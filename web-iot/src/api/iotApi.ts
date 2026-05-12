import { apiGet } from './http'

export type DashboardResponse = {
  sensorValues: Record<string, number | null>
  deviceStates: Record<string, string>
  motionHistory?: Array<{ value: number; createdAt: string }>
}

export type DeviceDailyStatsResponse = {
  range: { start: string; end: string }
  days: string[]
  series: Array<{
    device: string
    on: number[]
    off: number[]
    total: number[]
  }>
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

type SensorHistoryRow = {
  id: number
  value: string | number
  create_at: string
  sensors?: { name?: string }
}

type DeviceActionHistoryRow = {
  id: number
  action?: string
  status?: string
  create_at: string
  devices?: { name?: string }
}

export function getDashboardCurrent() {
  return apiGet<DashboardResponse>('/api/dashboard/current')
}

export function getSensorsHistory(params: URLSearchParams) {
  return apiGet<Paginated<SensorHistoryRow>>(`/api/sensors/history?${params.toString()}`)
}

export function getDeviceActionsHistory(params: URLSearchParams) {
  return apiGet<Paginated<DeviceActionHistoryRow>>(`/api/device-actions/history?${params.toString()}`)
}

export function getDeviceActionsDailyStats(params: URLSearchParams) {
  return apiGet<DeviceDailyStatsResponse>(`/api/device-actions/daily-stats?${params.toString()}`)
}
