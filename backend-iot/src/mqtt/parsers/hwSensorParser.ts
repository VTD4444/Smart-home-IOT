import type { SensorReading } from '../../types/domain'

/** Mặc định payload môi trường định kỳ không kèm motion. */
const ENV_PATTERN =
  /Nhiet do:\s*([0-9.]+)C,\s*Do am:\s*([0-9.]+)%,\s*Anh sang:\s*([0-9.]+)(?:,\s*Chuyen dong:\s*([01]))?/i
const MOTION_EVENT_PATTERN = /^Chuyen dong:\s*([01])$/i

export function parseHwSensorPayload(payload: string): SensorReading[] {
  const text = payload.trim()
  const readings: SensorReading[] = []

  const envMatch = text.match(ENV_PATTERN)
  if (envMatch) {
    readings.push(
      { sensorName: 'temperature', value: Number(envMatch[1]) },
      { sensorName: 'humidity', value: Number(envMatch[2]) },
      { sensorName: 'light', value: Number(envMatch[3]) },
    )
    if (envMatch[4] !== undefined) {
      readings.push({ sensorName: 'motion', value: Number(envMatch[4]) })
    }
    return readings
  }

  const motionEvent = text.match(MOTION_EVENT_PATTERN)
  if (motionEvent) {
    return [{ sensorName: 'motion', value: Number(motionEvent[1]) }]
  }

  if (text.includes('Phat hien chuyen dong')) {
    return [{ sensorName: 'motion', value: 1 }]
  }
  if (text.includes('Ket thuc chuyen dong') || text.includes('Khong con chuyen dong')) {
    return [{ sensorName: 'motion', value: 0 }]
  }

  return readings
}
