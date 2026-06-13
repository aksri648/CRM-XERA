import { Router } from 'express';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });
    if (!settings) {
      settings = await Settings.create({ userId: req.userId });
    }
    res.json(settings);
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body, userId: req.userId },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) { next(err); }
});

export default router;
