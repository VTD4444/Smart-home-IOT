import http from "node:http";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { env } from "./config/env";
import { openApiSpec } from "./docs/openapi";
import { MqttBridge } from "./mqtt/mqttBridge";
import { parseHwSensorPayload } from "./mqtt/parsers/hwSensorParser";
import { createApiRouter } from "./routes/api";
import { DataService } from "./services/dataService";
import { DeviceStateService } from "./state/deviceStateService";
import { WsHub } from "./ws/hub";
import type { DeviceName } from "./types/domain";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const wsHub = new WsHub(wss);
const dataService = new DataService();
const deviceStateService = new DeviceStateService();
const feedbackTimeoutByDevice = new Map<DeviceName, NodeJS.Timeout>();
let motionState = 0;
let motionTicker: NodeJS.Timeout | null = null;

const wsControlSchema = z.object({
  type: z.literal("device:control"),
  payload: z.object({
    deviceId: z.enum(["fan", "dehumidifier", "living_room_light", "alarm_siren", "aux_led"]),
    action: z.enum(["ON", "OFF"]),
  }),
});

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/api", createApiRouter(dataService));

app.get("/health", (_req, res) => res.json({ ok: true }));

function commandFromDevice(deviceId: DeviceName, action: "ON" | "OFF") {
  const prefix: Record<DeviceName, string> = {
    fan: "LED_TEMP",
    dehumidifier: "LED_HUMID",
    living_room_light: "LED_LIGHT",
    alarm_siren: "PIR_LED",
    aux_led: "LED_AUX",
  };
  return `${prefix[deviceId]}:${action}`;
}

/** Nhãn lưu DB cột action (lịch sử thiết bị) */
function historyActionLabelFromStatus(status: string): string {
  if (status === "active") return "Turn On";
  if (status === "inactive") return "Turn Off";
  return status;
}

function startMotionStateBroadcast() {
  if (motionTicker) return;
  motionTicker = setInterval(() => {
    wsHub.broadcast({
      type: "sensor:reading",
      payload: { sensorName: "motion", value: motionState, createdAt: new Date() },
    });
  }, 2000);
}

const mqttBridge = new MqttBridge(
  async (payload) => {
    try {
      const readings = parseHwSensorPayload(payload);
      if (!readings.length) {
        wsHub.broadcast({
          type: "sensor:error",
          payload: {
            source: "sensor",
            message: "Invalid sensor payload",
            raw: payload,
          },
        });
        return;
      }
      for (const reading of readings) {
        const createdAt = new Date();
        if (reading.sensorName === "motion") {
          motionState = reading.value > 0.5 ? 1 : 0;
        }
        await dataService.addSensorReading(
          reading.sensorName,
          reading.value,
          createdAt,
        );
        wsHub.broadcast({
          type: "sensor:reading",
          payload: { ...reading, createdAt },
        });
        const changed = deviceStateService.updateSensor(
          reading.sensorName,
          reading.value,
        );
        if (changed) {
          const autoLabel = historyActionLabelFromStatus(changed.status);
          await dataService.addAction(changed.name, autoLabel, changed.status);
          wsHub.broadcast({ type: "device-state:changed", payload: changed });
          wsHub.broadcast({
            type: "device-action:created",
            payload: {
              device: changed.name,
              action: autoLabel,
              status: changed.status,
              createdAt: changed.updatedAt,
            },
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sensor error";
      wsHub.broadcast({
        type: "sensor:error",
        payload: { source: "sensor", message, raw: payload },
      });
    }
  },
  async (payload) => {
    wsHub.broadcast({
      type: "sensor:error",
      payload: { source: "mqtt", message: payload, raw: payload },
    });
  },
  async (payload) => {
    const snapshots = deviceStateService.onFeedback(payload);
    if (!snapshots.length) return;
    const now = new Date();
    for (const feedbackState of snapshots) {
      const runningTimeout = feedbackTimeoutByDevice.get(feedbackState.name);
      if (runningTimeout) {
        clearTimeout(runningTimeout);
        feedbackTimeoutByDevice.delete(feedbackState.name);
      }
      const actionLabel = historyActionLabelFromStatus(feedbackState.status);
      await dataService.addAction(
        feedbackState.name,
        actionLabel,
        feedbackState.status,
        now,
      );
      wsHub.broadcast({ type: "device-state:changed", payload: feedbackState });
      wsHub.broadcast({
        type: "device-action:created",
        payload: {
          device: feedbackState.name,
          action: actionLabel,
          status: feedbackState.status,
          raw: payload,
          createdAt: now,
        },
      });
    }
  },
);

wss.on("connection", async (socket) => {
  const init = await dataService.getCurrentDashboard();
  socket.send(JSON.stringify({ type: "init", payload: init }));

  socket.on("message", async (raw) => {
    try {
      const parsed = wsControlSchema.safeParse(JSON.parse(raw.toString()));
      if (!parsed.success) {
        socket.send(
          JSON.stringify({
            type: "error",
            payload: { code: "INVALID_WS_MESSAGE" },
          }),
        );
        return;
      }
      const { deviceId, action } = parsed.data.payload;
      deviceStateService.onManualControl(deviceId, action);
      wsHub.broadcast({
        type: "device-state:changed",
        payload: { name: deviceId, status: "loading", updatedAt: new Date() },
      });
      mqttBridge.publishControl(commandFromDevice(deviceId, action));
      const prev = feedbackTimeoutByDevice.get(deviceId);
      if (prev) clearTimeout(prev);
      const timeout = setTimeout(async () => {
        await dataService.addAction(deviceId, "No response", "timeout");
        deviceStateService.markControlError(deviceId);
        wsHub.broadcast({
          type: "device-state:changed",
          payload: { name: deviceId, status: "error", updatedAt: new Date() },
        });
        wsHub.broadcast({
          type: "device-action:created",
          payload: {
            device: deviceId,
            action: "No response",
            status: "timeout",
            createdAt: new Date(),
          },
        });
      }, 5000);
      feedbackTimeoutByDevice.set(deviceId, timeout);
    } catch {
      socket.send(
        JSON.stringify({ type: "error", payload: { code: "MALFORMED_JSON" } }),
      );
    }
  });
});

function logDatabaseError(context: string, err: unknown) {
  console.error(`[database] ${context}`);
  console.error(
    "[database] Kiểm tra PostgreSQL đang chạy (vd. docker compose) và biến DATABASE_URL trong .env.",
  );
  if (err instanceof Error) {
    console.error("[database]", err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.error("[database]", err);
  }
}

async function bootstrap() {
  try {
    await dataService.init();
    const persisted = await dataService.getLastConfirmedOutputStates();
    deviceStateService.hydrate(persisted);
    const snapshot = await dataService.getCurrentDashboard();
    motionState = Number(snapshot.sensorValues.motion ?? 0) > 0.5 ? 1 : 0;
  } catch (err) {
    logDatabaseError(
      "Không kết nối được CSDL khi khởi tạo (upsert sensors/devices).",
      err,
    );
    process.exit(1);
  }
  mqttBridge.start();
  startMotionStateBroadcast();
  server.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[bootstrap] Lỗi khởi động server:", error);
  process.exit(1);
});
