import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Campaign from '../models/Campaign.js';
import PipelineEvent from '../models/PipelineEvent.js';

const router = Router();
router.use(requireAuth());

router.get('/status', async (req, res, next) => {
  try {
    const active_campaigns = await Campaign.countDocuments({ status: 'running' });
    const stats = await Campaign.aggregate([
      { $group: {
        _id: null,
        total_sent: { $sum: '$stats.sent' },
        total_delivered: { $sum: '$stats.delivered' },
        total_opened: { $sum: '$stats.opened' },
        total_clicked: { $sum: '$stats.clicked' },
        total_converted: { $sum: '$stats.converted' },
      }},
    ]);
    const s = stats[0] || {};
    let channel_service_health = 'unknown';
    try {
      const ch = await fetch(`${process.env.CHANNEL_SERVICE_URL || 'http://localhost:8002'}/health`);
      const chData = await ch.json();
      channel_service_health = chData.status || 'degraded';
    } catch (e) { channel_service_health = 'degraded'; }

    res.json({
      active_campaigns,
      queue_pending: 0,
      workers_processing: 0,
      total_sent: s.total_sent || 0,
      total_delivered: s.total_delivered || 0,
      total_opened: s.total_opened || 0,
      total_clicked: s.total_clicked || 0,
      total_converted: s.total_converted || 0,
      channel_service_health,
    });
  } catch (err) { next(err); }
});

router.get('/events', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const events = await PipelineEvent.find().sort({ createdAt: -1 }).limit(Number(limit));
    res.json(events);
  } catch (err) { next(err); }
});

export default router;
