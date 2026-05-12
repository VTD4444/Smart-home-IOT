import { Prisma } from '@prisma/client'
import { prisma } from '../db/prismaClient'
import type { ActionStatus, DeviceName, DeviceStatus, SensorName } from '../types/domain'

const sensorNames: SensorName[] = ['temperature', 'humidity', 'light', 'motion']
const deviceNames: DeviceName[] = ['fan', 'dehumidifier', 'living_room_light', 'alarm_siren', 'aux_led']

type PageArgs = {
  page: number
  limit: number
  search?: string
  type?: string
  status?: 'active' | 'inactive' | 'timeout'
  start?: string
  end?: string
}

type MotionHistoryItem = {
  value: number
  createdAt: Date
}

type DailyStatsArgs = {
  start?: string
  end?: string
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toBounds(base: Date, hasSeconds: boolean): { gte: Date; lt: Date } {
  const gte = new Date(base)
  if (hasSeconds) {
    gte.setMilliseconds(0)
    return { gte, lt: new Date(gte.getTime() + 1000) }
  }
  gte.setSeconds(0, 0)
  return { gte, lt: new Date(gte.getTime() + 60_000) }
}

/**
 * Hỗ trợ tìm theo timestamp copy từ UI:
 * - ISO: YYYY-MM-DDTHH:mm[:ss]
 * - Date-only: YYYY-MM-DD hoặc DD/MM/YYYY hoặc MM/DD/YYYY
 * - Time-only: HH:mm[:ss] (áp dụng trên ngày hiện tại theo giờ local)
 * - Locale: DD/MM/YYYY, HH:mm[:ss] hoặc MM/DD/YYYY, HH:mm[:ss]
 */
function parseSearchAsTimeBounds(search: string): Array<{ gte: Date; lt: Date }> {
  const t = search.trim()

  const out: Array<{ gte: Date; lt: Date }> = []
  const seen = new Set<number>()
  const pushBound = (d: Date, hasSeconds: boolean) => {
    if (Number.isNaN(d.getTime())) return
    const b = toBounds(d, hasSeconds)
    const key = b.gte.getTime()
    if (seen.has(key)) return
    seen.add(key)
    out.push(b)
  }
  const pushDayBound = (d: Date) => {
    if (Number.isNaN(d.getTime())) return
    const gte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const key = gte.getTime()
    if (seen.has(key)) return
    seen.add(key)
    out.push({ gte, lt: new Date(gte.getTime() + 24 * 60 * 60 * 1000) })
  }

  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (iso) {
    const [, y, m, d, hh, mm, ss] = iso
    const date = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      ss ? Number(ss) : 0,
      0,
    )
    pushBound(date, Boolean(ss))
    return out
  }

  const isoDateOnly = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateOnly) {
    const [, y, m, d] = isoDateOnly
    pushDayBound(new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0))
    return out
  }

  const timeOnly = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (timeOnly) {
    const [, hh, mm, ss] = timeOnly
    const h = Number(hh)
    const mi = Number(mm)
    const sec = ss ? Number(ss) : 0
    if (h < 0 || h > 23 || mi < 0 || mi > 59 || sec < 0 || sec > 59) return out
    const now = new Date()
    const gte = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      mi,
      sec,
      0,
    )
    const hasSeconds = Boolean(ss)
    if (!Number.isNaN(gte.getTime())) {
      out.push({
        gte,
        lt: new Date(gte.getTime() + (hasSeconds ? 1000 : 60_000)),
      })
    }
    return out
  }

  const localeDateOnly = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (localeDateOnly) {
    const [, a, b, y] = localeDateOnly
    const n1 = Number(a)
    const n2 = Number(b)
    const yy = Number(y)
    const pushDateBound = (day: number, month: number) =>
      pushDayBound(new Date(yy, month - 1, day, 0, 0, 0, 0))
    if (n1 > 12 && n2 <= 12) {
      pushDateBound(n1, n2)
    } else if (n2 > 12 && n1 <= 12) {
      pushDateBound(n2, n1)
    } else {
      // Mơ hồ (vd 04/05/2026): thử cả 2 để tăng khả năng khớp.
      pushDateBound(n1, n2)
      if (n1 !== n2) pushDateBound(n2, n1)
    }
    return out
  }

  const locale = t.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!locale) return out

  const [, a, b, y, hh, mm, ss] = locale
  const n1 = Number(a)
  const n2 = Number(b)
  const yy = Number(y)
  const h = Number(hh)
  const mi = Number(mm)
  const s = ss ? Number(ss) : 0
  const hasSeconds = Boolean(ss)

  const tryDayMonth = () => pushBound(new Date(yy, n2 - 1, n1, h, mi, s, 0), hasSeconds)
  const tryMonthDay = () => pushBound(new Date(yy, n1 - 1, n2, h, mi, s, 0), hasSeconds)

  if (n1 > 12 && n2 <= 12) {
    tryDayMonth()
  } else if (n2 > 12 && n1 <= 12) {
    tryMonthDay()
  } else {
    // Mơ hồ (vd 04/05/2026): thử cả 2 để tăng khả năng khớp.
    tryDayMonth()
    tryMonthDay()
  }
  return out
}

/** #123 hoặc 123 → khớp id; số thuần còn khớp value (cảm biến) */
function sensorSearchClause(search: string): Prisma.data_sensorsWhereInput | undefined {
  const trimmed = search.trim()
  if (!trimmed) return undefined
  const or: Prisma.data_sensorsWhereInput[] = [
    { sensors: { name: { contains: trimmed, mode: 'insensitive' } } },
  ]
  const tws = parseSearchAsTimeBounds(trimmed)
  for (const tw of tws) {
    or.push({ create_at: { gte: tw.gte, lt: tw.lt } })
  }
  const idMatch = trimmed.match(/^#?(\d+)$/)
  if (idMatch) {
    const n = Number(idMatch[1])
    if (Number.isSafeInteger(n) && n > 0) {
      or.push({ id: n })
      or.push({ value: { equals: new Prisma.Decimal(n) } })
    }
  } else {
    const num = Number(trimmed)
    if (Number.isFinite(num)) {
      or.push({ value: { equals: new Prisma.Decimal(num) } })
    }
  }
  return { OR: or }
}

function actionSearchClause(search: string): Prisma.action_historiesWhereInput | undefined {
  const trimmed = search.trim()
  if (!trimmed) return undefined
  const or: Prisma.action_historiesWhereInput[] = [
    { devices: { name: { contains: trimmed, mode: 'insensitive' } } },
    { action: { contains: trimmed, mode: 'insensitive' } },
    { status: { contains: trimmed, mode: 'insensitive' } },
  ]
  const tws = parseSearchAsTimeBounds(trimmed)
  for (const tw of tws) {
    or.push({ create_at: { gte: tw.gte, lt: tw.lt } })
  }
  const idMatch = trimmed.match(/^#?(\d+)$/)
  if (idMatch) {  
    const n = Number(idMatch[1])
    if (Number.isSafeInteger(n) && n > 0) or.push({ id: n })
  }
  return { OR: or }
}

export class DataService {
  private sensorIdByName = new Map<SensorName, number>()
  private deviceIdByName = new Map<DeviceName, number>()
  private lastMotionValue: number | null = null

  async init() {
    for (const name of sensorNames) {
      const row = await prisma.sensors.upsert({ where: { name }, update: {}, create: { name } })
      this.sensorIdByName.set(name, row.id)
    }
    for (const name of deviceNames) {
      const row = await prisma.devices.upsert({ where: { name }, update: {}, create: { name } })
      this.deviceIdByName.set(name, row.id)
    }
  }

  async addSensorReading(sensorName: SensorName, value: number, createdAt = new Date()) {
    // Firmware có thể gửi motion kèm payload định kỳ; chỉ lưu khi đổi trạng thái để tối ưu DB.
    if (sensorName === 'motion') {
      const normalized = value > 0.5 ? 1 : 0
      if (this.lastMotionValue !== null && this.lastMotionValue === normalized) return
      this.lastMotionValue = normalized
      value = normalized
    }
    const sensorId = this.sensorIdByName.get(sensorName)
    if (!sensorId) return
    return prisma.data_sensors.create({
      data: { sensor_id: sensorId, value: new Prisma.Decimal(value), create_at: createdAt },
    })
  }

  async addAction(deviceName: DeviceName, action: string, status: ActionStatus, createdAt = new Date()) {
    const deviceId = this.deviceIdByName.get(deviceName)
    if (!deviceId) return
    return prisma.action_histories.create({
      data: { device_id: deviceId, action, status, create_at: createdAt },
      include: { devices: true },
    })
  }

  async getSensorHistory(args: PageArgs) {
    const { page, limit, search, type, start, end } = args
    const startDate = start ? new Date(start) : undefined
    const endDate = end ? new Date(end) : undefined
    const where: Prisma.data_sensorsWhereInput = {
      ...(type ? { sensors: { name: type } } : {}),
      ...(startDate || endDate
        ? {
            create_at: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
      ...(search ? sensorSearchClause(search) : {}),
    }
    const [items, total] = await Promise.all([
      prisma.data_sensors.findMany({
        where,
        orderBy: { create_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { sensors: true },
      }),
      prisma.data_sensors.count({ where }),
    ])
    return { items, total, page, limit }
  }

  async getActionHistory(args: PageArgs) {
    const { page, limit, search, type, status, start, end } = args
    const startDate = start ? new Date(start) : undefined
    const endDate = end ? new Date(end) : undefined
    const where: Prisma.action_historiesWhereInput = {
      ...(type ? { devices: { name: type } } : {}),
      ...(status ? { status } : {}),
      ...(startDate || endDate
        ? {
            create_at: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
      ...(search ? actionSearchClause(search) : {}),
    }
    const [items, total] = await Promise.all([
      prisma.action_histories.findMany({
        where,
        orderBy: { create_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { devices: true },
      }),
      prisma.action_histories.count({ where }),
    ])
    return { items, total, page, limit }
  }

  /** Trạng thái output cuối cùng đã xác nhận (active/inactive), bỏ qua timeout/loading. */
  async getLastConfirmedOutputStates(): Promise<Record<DeviceName, DeviceStatus>> {
    const base: Record<DeviceName, DeviceStatus> = {
      fan: 'inactive',
      dehumidifier: 'inactive',
      living_room_light: 'inactive',
      alarm_siren: 'inactive',
      aux_led: 'inactive',
    }
    await Promise.all(
      deviceNames.map(async (name) => {
        const row = await prisma.action_histories.findFirst({
          where: {
            devices: { name },
            status: { in: ['active', 'inactive'] },
          },
          orderBy: { create_at: 'desc' },
        })
        if (row && (row.status === 'active' || row.status === 'inactive')) {
          base[name] = row.status
        }
      }),
    )
    return base
  }

  async getCurrentDashboard() {
    const [latest, deviceStates, motionRows] = await Promise.all([
      Promise.all(
        sensorNames.map(async (name) => {
          const item = await prisma.data_sensors.findFirst({
            where: { sensors: { name } },
            orderBy: { create_at: 'desc' },
            include: { sensors: true },
          })
          return [name, item] as const
        }),
      ),
      this.getLastConfirmedOutputStates(),
      prisma.data_sensors.findMany({
        where: { sensors: { name: 'motion' } },
        orderBy: { create_at: 'desc' },
        take: 80,
      }),
    ])
    const sensorValues = Object.fromEntries(
      latest.map(([name, item]) => [name, item ? Number(item.value) : null]),
    )
    const motionHistory: MotionHistoryItem[] = motionRows
      .map((row) => ({ value: Number(row.value), createdAt: row.create_at }))
      .reverse()
    return { sensorValues, deviceStates, motionHistory }
  }

  async getDailyDeviceActionStats(args: DailyStatsArgs) {
    const now = new Date()
    const parsedEnd = args.end ? new Date(args.end) : now
    const end = Number.isNaN(parsedEnd.getTime()) ? now : parsedEnd
    end.setHours(23, 59, 59, 999)

    const parsedStart = args.start ? new Date(args.start) : new Date(end)
    if (!args.start) parsedStart.setDate(parsedStart.getDate() - 6)
    const start = Number.isNaN(parsedStart.getTime()) ? new Date(end) : parsedStart
    start.setHours(0, 0, 0, 0)

    if (start > end) {
      const tmp = new Date(start)
      start.setTime(end.getTime())
      end.setTime(tmp.getTime())
    }

    const rows = await prisma.action_histories.findMany({
      where: {
        devices: { name: { in: deviceNames } },
        create_at: { gte: start, lte: end },
        OR: [{ status: { in: ['active', 'inactive'] } }, { action: { in: ['Turn On', 'Turn Off'] } }],
      },
      orderBy: { create_at: 'asc' },
      include: { devices: true },
    })

    const days: string[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      days.push(toLocalDateKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    const seed = () => ({ on: 0, off: 0, total: 0 })
    const bucket = new Map<string, Record<DeviceName, ReturnType<typeof seed>>>()
    for (const day of days) {
      bucket.set(day, {
        fan: seed(),
        dehumidifier: seed(),
        living_room_light: seed(),
        alarm_siren: seed(),
        aux_led: seed(),
      })
    }

    for (const row of rows) {
      const day = toLocalDateKey(row.create_at)
      const deviceName = row.devices.name as DeviceName
      const group = bucket.get(day)
      if (!group || !group[deviceName]) continue
      const status = row.status.toLowerCase()
      const action = row.action.toLowerCase()
      if (status === 'active' || action === 'turn on') group[deviceName].on += 1
      if (status === 'inactive' || action === 'turn off') group[deviceName].off += 1
      group[deviceName].total = group[deviceName].on + group[deviceName].off
    }

    const series = deviceNames.map((device) => ({
      device,
      on: days.map((day) => bucket.get(day)![device].on),
      off: days.map((day) => bucket.get(day)![device].off),
      total: days.map((day) => bucket.get(day)![device].total),
    }))

    return {
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      days,
      series,
    }
  }
}
