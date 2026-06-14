import { Router } from 'express';
import mongoose from 'mongoose';
import Communication, { STATUS_ORDER } from '../models/Communication.js';
import Campaign from '../models/Campaign.js';
import PipelineEvent from '../models/PipelineEvent.js';

const router = Router();

router.post('/callback', async (req, res) => {
  try {
    const { communication_id, campaign_id, customer_id, channel, event, timestamp } = req.body;

    if (!communication_id || !mongoose.Types.ObjectId.isValid(communication_id)) {
      console.warn(`Invalid communication_id: ${communication_id}`);
      return res.json({ ok: false, error: 'Invalid communication_id' });
    }

    const comm = await Communication.findById(communication_id);
    if (!comm) {
      console.warn(`Communication ${communication_id} not found`);
      return res.json({ ok: true });
    }

    const currentIdx = STATUS_ORDER.indexOf(comm.status);
    const newIdx = STATUS_ORDER.indexOf(event);

    if (newIdx === -1) return res.json({ ok: true });
    if (comm.status === 'failed') return res.json({ ok: true });
    if (newIdx <= currentIdx) return res.json({ ok: true });

    comm.status = event;
    comm.updatedAt = new Date();
    if (event === 'sent') comm.sentAt = timestamp || new Date();
    await comm.save();

    const update = { $inc: { [`stats.${event}`]: 1 } };
    if (event === 'converted') {
      const randomRevenue = Math.floor(Math.random() * 1801) + 200;
      update.$inc['stats.revenue'] = randomRevenue;
    }
    await Campaign.findByIdAndUpdate(campaign_id, update);

    if (event === 'converted' || event === 'failed') {
      const total = await Communication.countDocuments({ campaignId: campaign_id });
      const terminal = await Communication.countDocuments({
        campaignId: campaign_id,
        status: { $in: ['converted', 'failed'] },
      });
      if (total === terminal) {
        await Campaign.findByIdAndUpdate(campaign_id, {
          status: 'completed',
          completedAt: new Date(),
        });
      }
    }

    await PipelineEvent.create({
      userId: comm.userId,
      type: 'callback_received',
      title: 'Callback Received',
      description: `${event} for comm ${communication_id}`,
      badge: 'OK',
      campaignId: campaign_id,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Receipt callback error:', err.message);
    res.status(500).json({ ok: false, error: 'Callback processing failed' });
  }
});

export default router;
