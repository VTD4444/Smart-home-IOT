export type SensorName = 'temperature' | 'humidity' | 'light' | 'motion'
/** Tên thiết bị điều khiển (slug) — tách biệt với SensorName */
export type DeviceName = 'fan' | 'dehumidifier' | 'living_room_light' | 'alarm_siren' | 'aux_led'
export type DeviceStatus = 'active' | 'inactive' | 'loading' | 'error'
export type ActionType = 'manual' | 'auto'
export type ActionStatus = DeviceStatus | 'timeout'

export interface SensorReading {
  sensorName: SensorName
  value: number
  createdAt?: Date
}

export interface DeviceSnapshot {
  name: DeviceName
  status: DeviceStatus
  updatedAt: Date
}
