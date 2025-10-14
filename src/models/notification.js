const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, default: 'daily_checkin' },
  scheduled_time: { type: String, default: '0 10 * * *' },
  // New reminder configuration
  reminder_schedule: { type: String, enum: ['daily', 'specific_days', 'weekly'], default: 'daily' },
  // Only used when reminder_schedule is 'specific_days' or 'weekly'
  reminder_days: { type: [String], enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], default: [] },
  // HH:mm in user's local time or a standard time string
  reminder_time: { type: String, default: '10:00' },
  email_notifications: { type: Boolean, default: false },
  substack: { type: Boolean, default: false },
  last_sent: Date,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

notificationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

notificationSchema.statics.createNotification = async function(user_id) {
  const notification = new this({
    user_id: user_id,
    type: 'daily_checkin',
    scheduled_time: '0 10 * * *',
    reminder_schedule: 'daily',
    reminder_days: [],
    reminder_time: '10:00',
    email_notifications: false,
    substack: false,
    is_active: true
  })
  return notification.save()
}

module.exports = mongoose.model('Notification', notificationSchema);


