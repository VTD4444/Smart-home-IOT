import mqtt, { type MqttClient } from "mqtt";
import { env } from "../config/env";

export class MqttBridge {
  private readonly client: MqttClient;
  private started = false;

  constructor(
    private readonly onSensor: (payload: string) => void,
    private readonly onSensorError: (payload: string) => void,
    private readonly onFeedback: (payload: string) => void,
  ) {
    this.client = mqtt.connect(env.mqttUrl, {
      username: env.mqttUsername,
      password: env.mqttPassword,
    });
  }

  private subscribeAll() {
    const topics = [
      env.mqttTopicSensor,
      env.mqttTopicSensorError,
      env.mqttTopicFeedback,
    ];
    this.client.subscribe(topics, (err) => {
      if (err) {
        console.error("[mqtt] subscribe failed:", err.message);
        this.onSensorError(`MQTT subscribe failed: ${err.message}`);
        return;
      }
      console.log("[mqtt] subscribed:", topics.join(", "));
    });
  }

  start() {
    if (this.started) return;
    this.started = true;

    this.client.on("connect", () => {
      console.log("[mqtt] connected →", env.mqttUrl);
      this.subscribeAll();
    });

    this.client.on("reconnect", () => {
      console.warn("[mqtt] reconnecting…");
    });

    this.client.on("error", (err) => {
      console.error("[mqtt] error:", err.message);
      this.onSensorError(`MQTT error: ${err.message}`);
    });

    this.client.on("offline", () => {
      console.warn("[mqtt] offline (broker unreachable or closed connection)");
      this.onSensorError("MQTT offline: broker unreachable or connection closed");
    });

    this.client.on("message", (topic, payload) => {
      const text = payload.toString();
      if (topic === env.mqttTopicSensor) this.onSensor(text);
      if (topic === env.mqttTopicSensorError) this.onSensorError(text);
      if (topic === env.mqttTopicFeedback) this.onFeedback(text);
    });

    /**
     * `bootstrap()` gọi `start()` sau `await dataService.init()`. Nếu broker gần,
     * client có thể đã emit `connect` trước khi listener được gắn → không bao giờ subscribe.
     */
    if (this.client.connected) {
      console.log("[mqtt] already connected before listeners; subscribing now");
      this.subscribeAll();
    }
  }

  publishControl(command: string) {
    this.client.publish(env.mqttTopicControl, command);
  }
}
