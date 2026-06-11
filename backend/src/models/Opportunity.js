import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema({
  title:               { type: String, required: true },
  description:         { type: String },
  audienceDescription: { type: String },
  expectedRevenue:     { type: Number },
  aiReasoning:         { type: String },
  status:              { type: String, enum: ['active', 'dismissed', 'converted'], default: 'active' },
  createdAt:           { type: Date, default: Date.now },
});

export default mongoose.model('Opportunity', OpportunitySchema);
