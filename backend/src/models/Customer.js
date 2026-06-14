import mongoose from 'mongoose';

function normalizePhone(v) {
  if (!v) return v;
  const digits = String(v).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return v;
}

const CustomerSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  name:          { type: String, required: true, index: true },
  email:         { type: String, required: true, index: true },
  phone:         {
    type: String,
    set: normalizePhone,
    validate: {
      validator: function (v) {
        if (!v) return true;
        const digits = v.replace(/\D/g, '');
        return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
      },
      message: props => `${props.value} is not a valid 10-digit Indian phone number`,
    },
  },
  city:          { type: String, index: true },
  gender:        { type: String, enum: ['male', 'female', 'other'] },
  age:           { type: Number },
  tags:          [{ type: String }],
  ltv:           { type: Number, default: 0 },
  totalOrders:   { type: Number, default: 0 },
  lastOrderAt:   { type: Date },
  createdAt:     { type: Date, default: Date.now },
});

CustomerSchema.index({ userId: 1, email: 1 }, { unique: true });
CustomerSchema.index({ ltv: 1, lastOrderAt: 1, city: 1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ totalOrders: 1 });

export default mongoose.model('Customer', CustomerSchema);
