import type { DeviceName, DeviceSnapshot, DeviceStatus, SensorName } from '../types/domain'

const ALL_DEVICES: DeviceName[] = ['fan', 'dehumidifier', 'living_room_light', 'alarm_siren', 'aux_led']

/**
 * Trạng thái thiết bị trên UI chỉ đổi theo phản hồi MQTT từ phần cứng (onFeedback),
 * không còn suy ra từ ngưỡng cảm biến (đèn chỉ do người điều khiển).
 */
export class DeviceStateService {
  private sensorValues: Record<SensorName, number> = {
    temperature: 0,
    humidity: 0,
    light: 0,
    motion: 0,
  }

  private overrideFlags: Record<DeviceName, boolean> = {
    fan: false,
    dehumidifier: false,
    living_room_light: false,
    alarm_siren: false,
    aux_led: false,
  }

  private states: Record<DeviceName, DeviceStatus> = {
    fan: 'inactive',
    dehumidifier: 'inactive',
    living_room_light: 'inactive',
    alarm_siren: 'inactive',
    aux_led: 'inactive',
  }

  /** Chỉ cập nhật giá trị cảm biến; không tự đổi trạng thái thiết bị/đèn */
  updateSensor(sensorName: SensorName, value: number): DeviceSnapshot | null {
    this.sensorValues[sensorName] = value
    return null
  }

  onManualControl(device: DeviceName, _action: 'ON' | 'OFF') {
    this.overrideFlags[device] = true
    this.states[device] = 'loading'
  }

  onFeedback(message: string): DeviceSnapshot[] {
    const text = message.toLowerCase()
    const now = new Date()

    if (text.includes('bat tat ca den')) {
      const out: DeviceSnapshot[] = []
      for (const key of ALL_DEVICES) {
        this.overrideFlags[key] = false
        this.states[key] = 'active'
        out.push({ name: key, status: 'active', updatedAt: now })
      }
      return out
    }

    if (text.includes('tat het den')) {
      const out: DeviceSnapshot[] = []
      for (const key of ALL_DEVICES) {
        this.overrideFlags[key] = false
        this.states[key] = 'inactive'
        out.push({ name: key, status: 'inactive', updatedAt: now })
      }
      return out
    }

    const byText: Array<{ key: DeviceName; onWords: string[]; offWords: string[] }> = [
      { key: 'fan', onWords: ['bat den nhiet do'], offWords: ['tat den nhiet do'] },
      { key: 'dehumidifier', onWords: ['bat den do am'], offWords: ['tat den do am'] },
      { key: 'living_room_light', onWords: ['bat den anh sang'], offWords: ['tat den anh sang'] },
      { key: 'alarm_siren', onWords: ['bat den pir'], offWords: ['tat den pir'] },
      { key: 'aux_led', onWords: ['bat den phu'], offWords: ['tat den phu'] },
    ]
    for (const row of byText) {
      if (row.onWords.some((word) => text.includes(word))) {
        this.overrideFlags[row.key] = false
        this.states[row.key] = 'active'
        return [{ name: row.key, status: 'active', updatedAt: now }]
      }
      if (row.offWords.some((word) => text.includes(word))) {
        this.overrideFlags[row.key] = false
        this.states[row.key] = 'inactive'
        return [{ name: row.key, status: 'inactive', updatedAt: now }]
      }
    }
    return []
  }

  releaseOverride(device: DeviceName): DeviceSnapshot {
    this.overrideFlags[device] = false
    this.states[device] = 'inactive'
    return { name: device, status: 'inactive', updatedAt: new Date() }
  }

  getState(): Record<DeviceName, DeviceStatus> {
    return { ...this.states }
  }

  /** Đồng bộ RAM với CSDL sau khởi động hoặc khi cần. */
  hydrate(states: Record<DeviceName, DeviceStatus>) {
    for (const key of ALL_DEVICES) {
      const s = states[key]
      if (s === 'active' || s === 'inactive') {
        this.states[key] = s
        this.overrideFlags[key] = false
      }
    }
  }

  /** Hết hạn chờ phản hồi MQTT sau điều khiển thủ công. */
  markControlError(device: DeviceName) {
    this.states[device] = 'error'
  }
}
