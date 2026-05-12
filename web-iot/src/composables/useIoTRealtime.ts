import { onMounted, onUnmounted, ref } from 'vue'
import { wsUrl } from '@/api/http'
import { useIotStore, ALL_DEVICE_IDS, type DeviceId, type SensorId } from '@/stores/iot'
import { useToastStore } from '@/stores/toast'

type ControlPayload = {
  deviceId: DeviceId
  action: 'ON' | 'OFF'
}

type RealtimeMessage = { type: string; payload?: unknown }

const deviceToastTitles: Record<ControlPayload['deviceId'], string> = {
  fan: 'Ceiling Fan',
  dehumidifier: 'Dehumidifier',
  living_room_light: 'Living Room Light',
  alarm_siren: 'Alarm Siren',
  aux_led: 'Aux LED',
}

const sensorKeys: SensorId[] = ['temperature', 'humidity', 'light', 'motion']
const deviceKeys: DeviceId[] = [...ALL_DEVICE_IDS]

export function useIoTRealtime() {
  const socket = ref<WebSocket | null>(null)
  const connected = ref(false)
  const iot = useIotStore()
  const toast = useToastStore()

  function connect() {
    const ws = new WebSocket(wsUrl())
    socket.value = ws
    ws.onopen = () => {
      connected.value = true
    }
    ws.onclose = () => {
      connected.value = false
      socket.value = null
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as RealtimeMessage
      const payload =
        message.payload && typeof message.payload === 'object'
          ? (message.payload as Record<string, unknown>)
          : {}

      if (message.type === 'init' && payload.sensorValues && typeof payload.sensorValues === 'object') {
        for (const [key, value] of Object.entries(payload.sensorValues as Record<string, unknown>)) {
          if (sensorKeys.includes(key as SensorId)) {
            iot.pushSensor(key as SensorId, Number(value ?? 0))
          }
        }
        for (const [key, value] of Object.entries((payload.deviceStates as Record<string, unknown>) ?? {})) {
          if (deviceKeys.includes(key as DeviceId)) {
            iot.setDeviceState(key as DeviceId, String(value))
          }
        }
      }
      if (message.type === 'sensor:reading' && typeof payload.sensorName === 'string') {
        if (sensorKeys.includes(payload.sensorName as SensorId)) {
          iot.pushSensor(
            payload.sensorName as SensorId,
            Number(payload.value),
            typeof payload.createdAt === 'string' ? payload.createdAt : undefined,
          )
        }
      }
      if (message.type === 'sensor:error') {
        const rawMessage = String(
          payload.message ??
            payload.raw ??
            'Có lỗi khi đọc dữ liệu cảm biến. Vui lòng kiểm tra phần cứng và MQTT.',
        )
        toast.push({
          type: 'warning',
          title: 'Cảnh báo cảm biến',
          message: rawMessage,
        })
      }
      if (message.type === 'device-state:changed') {
        const name = payload.name as ControlPayload['deviceId']
        if (!(name in deviceToastTitles)) return
        const status = String(payload.status ?? '')
        iot.setDeviceState(name, status)
        if (status === 'error' && name in deviceToastTitles) {
          toast.push({
            type: 'error',
            title: 'Lỗi điều khiển',
            message: `${deviceToastTitles[name]} không xác nhận kịp thời. Vui lòng kiểm tra ESP32, máy chủ MQTT và dây nối.`,
          })
        }
      }
    }
  }

  function sendControl(payload: ControlPayload) {
    socket.value?.send(JSON.stringify({ type: 'device:control', payload }))
  }

  onMounted(connect)
  onUnmounted(() => socket.value?.close())

  return { connected, sendControl }
}
