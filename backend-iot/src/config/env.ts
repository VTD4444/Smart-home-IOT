import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  clientOrigin: required("CLIENT_ORIGIN", "http://localhost:5173"),
  databaseUrl: required("DATABASE_URL"),
  mqttUrl: required("MQTT_URL"),
  mqttUsername: required("MQTT_USERNAME"),
  mqttPassword: required("MQTT_PASSWORD"),
  mqttTopicSensor: required("MQTT_TOPIC_SENSOR", "hw/sensor"),
  mqttTopicSensorError: required("MQTT_TOPIC_SENSOR_ERROR", "hw/sensor/error"),
  mqttTopicControl: required("MQTT_TOPIC_CONTROL", "hw/control"),
  mqttTopicFeedback: required("MQTT_TOPIC_FEEDBACK", "hw/feedback"),
};
