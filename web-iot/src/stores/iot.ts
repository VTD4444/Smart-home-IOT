import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDashboardCurrent } from '@/api/iotApi'

export type SensorId = 'temperature' | 'humidity' | 'light' | 'motion'
/** Thiết bị điều khiển — slug, không trùng tên cảm biến */
export type DeviceId = 'fan' | 'dehumidifier' | 'living_room_light' | 'alarm_siren' | 'aux_led'

export const ALL_DEVICE_IDS: DeviceId[] = ['fan', 'dehumidifier', 'living_room_light', 'alarm_siren', 'aux_led']

export type MotionBarSample = { id: number; v: number; at: number }

export const useIotStore = defineStore('iot', () => {
  const sensorValues = ref<Record<SensorId, number>>({
    temperature: 0,
    humidity: 0,
    light: 0,
    motion: 0,
  })
  const deviceStates = ref<Record<DeviceId, string>>({
    fan: 'inactive',
    dehumidifier: 'inactive',
    living_room_light: 'inactive',
    alarm_siren: 'inactive',
    aux_led: 'inactive',
  })
  const sensorSeries = ref<Record<SensorId, number[]>>({
    temperature: [],
    humidity: [],
    light: [],
    motion: [],
  })

  let motionSampleSeq = 0
  const motionBarSamples = ref<MotionBarSample[]>([])

  const motionBarValues = computed(() => motionBarSamples.value.map((s) => s.v))
  const motionBarKeys = computed(() => motionBarSamples.value.map((s) => s.id))

  function normalizeMotionHistory(input: Array<{ value: number; createdAt?: string }>) {
    const sorted = [...input]
      .map((x) => ({
        value: Number(x.value) > 0.5 ? 1 : 0,
        at: x.createdAt ? new Date(x.createdAt).getTime() : Date.now(),
      }))
      .filter((x) => Number.isFinite(x.at))
      .sort((a, b) => a.at - b.at)
    const out: MotionBarSample[] = []
    for (const row of sorted) {
      const prev = out[out.length - 1]
      if (prev && prev.v === row.value) continue
      out.push({ id: ++motionSampleSeq, v: row.value, at: row.at })
    }
    return out.slice(-120)
  }

  async function loadInit() {
    const data = await getDashboardCurrent()
    motionSampleSeq = 0
    motionBarSamples.value = normalizeMotionHistory(data.motionHistory ?? [])
    for (const key of Object.keys(sensorValues.value) as SensorId[]) {
      sensorValues.value[key] = Number(data.sensorValues[key] ?? 0)
      if (key === 'motion') {
        sensorSeries.value.motion = []
        if (!motionBarSamples.value.length) {
          motionBarSamples.value = [{ id: ++motionSampleSeq, v: sensorValues.value.motion > 0.5 ? 1 : 0, at: Date.now() }]
        }
      } else {
        sensorSeries.value[key] = [sensorValues.value[key]]
      }
    }
    for (const key of Object.keys(deviceStates.value) as DeviceId[]) {
      deviceStates.value[key] = data.deviceStates[key] ?? 'inactive'
    }
  }

  function pushSensor(sensor: SensorId, value: number, createdAt?: string | number | Date) {
    sensorValues.value[sensor] = value
    if (sensor === 'motion') {
      const v = value > 0.5 ? 1 : 0
      const at =
        createdAt instanceof Date
          ? createdAt.getTime()
          : typeof createdAt === 'number'
            ? createdAt
            : typeof createdAt === 'string'
              ? new Date(createdAt).getTime()
              : Date.now()
      motionBarSamples.value = [...motionBarSamples.value, { id: ++motionSampleSeq, v, at }].slice(-48)
      return
    }
    sensorSeries.value[sensor] = [...sensorSeries.value[sensor], value].slice(-20)
  }

  function setDeviceState(device: DeviceId, status: string) {
    deviceStates.value[device] = status
  }

  return {
    sensorValues,
    deviceStates,
    sensorSeries,
    motionBarSamples,
    motionBarValues,
    motionBarKeys,
    loadInit,
    pushSensor,
    setDeviceState,
  }
})
