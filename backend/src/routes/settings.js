import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ singleton: 'global' });
    if (!settings) {
      settings = await Settings.create({ singleton: 'global' });
    }
    res.json(settings);
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { singleton: 'global' },
      { ...req.body, singleton: 'global' },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) { next(err); }
});

router.post('/test-telegram', async (req, res, next) => {
  try {
    const { token, chatId } = req.body;
    res.json({ success: true, message: 'Test message sent (simulated)' });
  } catch (err) { next(err); }
});

export default router;
