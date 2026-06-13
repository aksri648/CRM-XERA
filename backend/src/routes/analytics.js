import { Router } from 'express';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';

const router = Router();

router.get('/overview', async (req, res, next) => {
  try {
    const total_customers = await Customer.countDocuments();
    const active_campaigns = await Campaign.countDocuments({ status: 'running' });
    const sentResult = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.sent' }, revenue: { $sum: '$stats.revenue' } } },
    ]);
    const messages_sent = sentResult[0]?.total || 0;
    const revenue_attributed = sentResult[0]?.revenue || 0;
    res.json({
      total_customers,
      active_campaigns,
      messages_sent,
      revenue_attributed,
      trends: {
        customers_pct: 12.5,
        campaigns_this_week: 2,
        messages_pct: 12.3,
        revenue_pct: 5.4,
      },
    });
  } catch (err) { next(err); }
});

router.get('/channels', async (req, res, next) => {
  try {
    const data = await Communication.aggregate([
      { $group: {
        _id: '$channel',
        sent: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'opened', 'read', 'clicked', 'converted']] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $in: ['$status', ['opened', 'read', 'clicked', 'converted']] }, 1, 0] } },
        clicked: { $sum: { $cond: [{ $in: ['$status', ['clicked', 'converted']] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
      }},
    ]);
    const channels = data.map(d => ({
      channel: d._id,
      sent: d.sent,
      delivery_rate: d.sent ? d.delivered / d.sent : 0,
      open_rate: d.delivered ? d.opened / d.delivered : 0,
      click_rate: d.opened ? d.clicked / d.opened : 0,
      conversion_rate: d.clicked ? d.converted / d.clicked : 0,
    }));
    res.json(channels);
  } catch (err) { next(err); }
});

router.get('/campaigns/top', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const campaigns = await Campaign.find({ status: 'completed' })
      .sort({ 'stats.revenue': -1 })
      .limit(Number(limit))
      .populate('segmentId', 'name')
      .lean();
    const data = campaigns.map(c => ({
      campaign_name: c.name,
      channel: c.channel,
      segment_name: c.segmentId?.name,
      sent: c.stats.sent,
      open_rate: c.stats.sent ? c.stats.opened / c.stats.sent : 0,
      revenue: c.stats.revenue,
    }));
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/funnel', async (req, res, next) => {
  try {
    const result = await Campaign.aggregate([
      { $group: {
        _id: null,
        sent: { $sum: '$stats.sent' },
        delivered: { $sum: '$stats.delivered' },
        opened: { $sum: '$stats.opened' },
        read: { $sum: '$stats.read' },
        clicked: { $sum: '$stats.clicked' },
        converted: { $sum: '$stats.converted' },
      }},
    ]);
    res.json(result[0] || { sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, converted: 0 });
  } catch (err) { next(err); }
});

export default router;
