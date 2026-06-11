import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name:          { type: String, required: true, index: true },
  email:         { type: String, required: true, unique: true, index: true },
  phone:         { type: String },
  city:          { type: String, index: true },
  gender:        { type: String, enum: ['male', 'female', 'other'] },
  age:           { type: Number },
  tags:          [{ type: String }],
  ltv:           { type: Number, default: 0 },
  totalOrders:   { type: Number, default: 0 },
  lastOrderAt:   { type: Date },
  createdAt:     { type: Date, default: Date.now },
});

CustomerSchema.index({ ltv: 1, lastOrderAt: 1, city: 1 });

export default mongoose.model('Customer', CustomerSchema);
