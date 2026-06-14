import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  userId:                { type: String, required: true, unique: true },
  platformName:          { type: String, default: 'Xeno AI Campaign Studio' },
  timezone:              { type: String, default: 'Asia/Kolkata' },
  currency:              { type: String, default: 'INR' },
  aiModel:               { type: String, default: 'default' },
  customModel:           { type: String, default: '' },
  scanSchedule:          { type: String, default: 'daily_6am' },
  autoApprove:           { type: Boolean, default: false },
  configSource:          { type: String, default: 'env' },
  openaiBaseUrl:         { type: String, default: '' },
  openaiApiKey:          { type: String, default: '' },
  mongodbUrl:            { type: String, default: '' },
  notifCampaignComplete: { type: Boolean, default: true },
  notifOpportunities:    { type: Boolean, default: true },
  notifWeeklyDigest:     { type: Boolean, default: false },
});

export default mongoose.model('Settings', SettingsSchema);
