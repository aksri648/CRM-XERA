import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  singleton:             { type: String, default: 'global', unique: true },
  platformName:          { type: String, default: 'Xeno AI Campaign Studio' },
  timezone:              { type: String, default: 'Asia/Kolkata' },
  currency:              { type: String, default: 'INR' },
  aiModel:               { type: String, default: 'default' },
  scanSchedule:          { type: String, default: 'daily_6am' },
  autoApprove:           { type: Boolean, default: false },
  telegramToken:         { type: String, default: '' },
  telegramChatId:        { type: String, default: '' },
  notifTelegram:         { type: Boolean, default: true },
  notifCampaignComplete: { type: Boolean, default: true },
  notifOpportunities:    { type: Boolean, default: true },
  notifWeeklyDigest:     { type: Boolean, default: false },
});

export default mongoose.model('Settings', SettingsSchema);
