import { Router } from 'express'
import { z } from 'zod'
import type { DataService } from '../services/dataService'

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['active', 'inactive', 'timeout']).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
})

const dailyStatsQuery = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
})

export function createApiRouter(dataService: DataService) {
  const router = Router()

  router.get('/dashboard/current', async (_req, res) => {
    const data = await dataService.getCurrentDashboard()
    res.json(data)
  })

  router.get('/sensors/history', async (req, res) => {
    const parsed = pageQuery.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const data = await dataService.getSensorHistory(parsed.data)
    res.json(data)
  })

  router.get('/device-actions/history', async (req, res) => {
    const parsed = pageQuery.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const data = await dataService.getActionHistory(parsed.data)
    res.json(data)
  })

  router.get('/device-actions/daily-stats', async (req, res) => {
    const parsed = dailyStatsQuery.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const data = await dataService.getDailyDeviceActionStats(parsed.data)
    res.json(data)
  })

  return router
}
