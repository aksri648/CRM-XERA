import mongoose from 'mongoose';

const ABTestSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  name:          { type: String, required: true },
  campaignAId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  campaignBId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  status:           { type: String, enum: ['draft', 'running', 'completed'], default: 'draft' },
  winnerCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  createdAt:        { type: Date, default: Date.now },
});

export default mongoose.model('ABTest', ABTestSchema);
