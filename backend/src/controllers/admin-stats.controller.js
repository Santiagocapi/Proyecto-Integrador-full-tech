import * as adminStatsService from '../services/admin-stats.service.js'

// GET /api/admin/stats
export async function get(req, res, next) {
  try {
    const stats = await adminStatsService.getStats()
    res.status(200).json(stats)
  } catch (err) {
    next(err)
  }
}
