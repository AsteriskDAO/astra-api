const mongoose = require('mongoose')
const crypto = require('crypto')

const checkInSchema = new mongoose.Schema({
  schema_version: { type: String, default: 'v1', enum: ['v1'], required: true },
  user_hash: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  checkinId: { type: String, required: true, unique: true },
  mood: String,
  health_comment: String,
  doctor_visit: Boolean,
  health_profile_update: Boolean,
  anxiety_level: Number,
  anxiety_details: String,
  pain_level: Number,
  pain_details: String,
  fatigue_level: Number,
  fatigue_details: String
})

checkInSchema.index({ user_hash: 1, timestamp: -1 })

checkInSchema.statics.generateCheckinId = function() {
  return `checkin_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
}

checkInSchema.statics.createCheckIn = async function(data) {
  if (!data.checkinId) {
    data.checkinId = this.generateCheckinId()
  }
  const checkIn = new this(data)
  return await checkIn.save()
}

checkInSchema.pre('save', function(next) {
  if (!this.checkinId) {
    this.checkinId = this.constructor.generateCheckinId()
  }
  next()
})

module.exports = mongoose.model('CheckIn', checkInSchema)


