import { Router } from 'express';
import AgentProposal from '../models/AgentProposal.js';
import Campaign from '../models/Campaign.js';
import { buildMongoQuery } from '../services/segmentation.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { launchCampaign } from '../services/campaignLauncher.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { title, segmentId, channel, messageTemplate, confidenceScore, aiReasoning } = req.body;
    const proposal = await AgentProposal.create({
      title,
      segmentId: segmentId || null,
      channel: channel || 'whatsapp',
      messageTemplate: messageTemplate || '',
      confidenceScore,
      aiReasoning,
      status: 'pending',
    });
    res.status(201).json({ proposal });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const proposals = await AgentProposal.find(query).sort({ createdAt: -1 }).populate('segmentId', 'name').lean();
    res.json({ proposals });
  } catch (err) { next(err); }
});

router.get('/count', async (req, res, next) => {
  try {
    const count = await AgentProposal.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const proposal = await AgentProposal.findById(req.params.id).populate('segmentId', 'name').lean();
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json({ proposal });
  } catch (err) { next(err); }
});

router.patch('/:id/approve', async (req, res, next) => {
  try {
    const proposal = await AgentProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });

    const campaign = await Campaign.create({
      name: proposal.title,
      segmentId: proposal.segmentId,
      channel: proposal.channel || 'email',
      messageTemplate: proposal.messageTemplate || '',
      status: 'draft',
      createdBy: 'agent',
    });

    const segment = await Segment.findById(campaign.segmentId);
    const mongoQuery = segment ? buildMongoQuery(segment.filterRules, segment.logic) : {};
    const customers = await Customer.find(mongoQuery);

    campaign.status = 'running';
    campaign.launchedAt = new Date();
    await campaign.save();

    try {
      await launchCampaign(campaign, customers);
    } catch (err) {
      campaign.status = 'failed';
      await campaign.save();
      throw err;
    }
    proposal.status = 'approved';
    await proposal.save();

    res.json({ campaign });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { title, segmentId, channel, messageTemplate, confidenceScore, aiReasoning } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (segmentId !== undefined) updateData.segmentId = segmentId;
    if (channel !== undefined) updateData.channel = channel;
    if (messageTemplate !== undefined) updateData.messageTemplate = messageTemplate;
    if (confidenceScore !== undefined) updateData.confidenceScore = confidenceScore;
    if (aiReasoning !== undefined) updateData.aiReasoning = aiReasoning;

    const proposal = await AgentProposal.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('segmentId', 'name');
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json({ proposal });
  } catch (err) { next(err); }
});

router.patch('/:id/reject', async (req, res, next) => {
  try {
    const proposal = await AgentProposal.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
