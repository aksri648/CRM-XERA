import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import Communication from '../models/Communication.js';
import { buildMongoQuery } from '../services/segmentation.js';
import { launchCampaign } from '../services/campaignLauncher.js';

const router = Router();
router.use(requireAuth());

router.get('/', async (req, res, next) => {
  try {
    const { status, sort = '-createdAt', limit = 20 } = req.query;
    const query = status ? { status } : {};
    const campaigns = await Campaign.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate('segmentId', 'name');
    res.json({ campaigns });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const campaign = await Campaign.create({ ...req.body, status: 'draft' });
    res.status(201).json({ campaign });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('segmentId', 'name');
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json({ campaign });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json({ campaign });
  } catch (err) { next(err); }
});

router.post('/:id/launch', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    if (campaign.status !== 'draft') return res.status(400).json({ error: 'Already launched' });

    const segment = await Segment.findById(campaign.segmentId);
    const mongoQuery = segment ? buildMongoQuery(segment.filterRules, segment.logic) : {};
    const customers = await Customer.find(mongoQuery);

    campaign.status = 'running';
    campaign.launchedAt = new Date();
    await campaign.save();

    const result = await launchCampaign(campaign, customers);
    res.json({ dispatched: result.dispatched, campaignId: campaign._id });
  } catch (err) { next(err); }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).select('stats');
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json({ stats: campaign.stats });
  } catch (err) { next(err); }
});

router.get('/:id/communications', async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const query = { campaignId: req.params.id };
    const total = await Communication.countDocuments(query);
    const communications = await Communication.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ communications, total, page: Number(page) });
  } catch (err) { next(err); }
});

router.patch('/:id/stop', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    if (campaign.status !== 'running') return res.status(400).json({ error: 'Only running campaigns can be stopped' });
    campaign.status = 'stopped';
    campaign.completedAt = new Date();
    await campaign.save();
    res.json({ campaign });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || (campaign.status !== 'draft' && campaign.status !== 'stopped')) {
      return res.status(400).json({ error: 'Only draft or stopped campaigns can be deleted' });
    }
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
