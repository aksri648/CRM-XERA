import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  title:         { type: String, required: true },
  description:         { type: String },
  audienceDescription: { type: String },
  expectedRevenue:     { type: Number },
  aiReasoning:         { type: String },
  status:              { type: String, enum: ['active', 'dismissed', 'converted'], default: 'active' },
  createdAt:           { type: Date, default: Date.now },
});

OpportunitySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Opportunity', OpportunitySchema);
