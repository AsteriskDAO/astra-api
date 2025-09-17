const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, default: 'daily_checkin' },
  scheduled_time: { type: String, default: '0 10 * * *' },
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
    is_active: true
  })
  return notification.save()
}

module.exports = mongoose.model('Notification', notificationSchema);


