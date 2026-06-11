import mongoose from 'mongoose';

const FilterRuleSchema = new mongoose.Schema({
  field:    { type: String },
  operator: { type: String },
  value:    { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const SegmentSchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true },
  description:   { type: String },
  filterRules:   [FilterRuleSchema],
  logic:         { type: String, enum: ['AND', 'OR'], default: 'AND' },
  customerCount: { type: Number, default: 0 },
  createdBy:     { type: String, enum: ['human', 'agent'], default: 'human' },
  createdAt:     { type: Date, default: Date.now },
});

SegmentSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Segment', SegmentSchema);
