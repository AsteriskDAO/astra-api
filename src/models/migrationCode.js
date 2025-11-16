const mongoose = require('mongoose')

const migrationCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, default: null }, // Set when code is verified
  user_hash: { type: String, default: null }, // Set when code is verified
  telegram_id: { type: String, required: true }, // Set when code is generated
  isLinked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  created_at: { type: Date, default: Date.now }
})

// Index for faster lookups
migrationCodeSchema.index({ code: 1, expiresAt: 1 })

const MigrationCode = mongoose.model('MigrationCode', migrationCodeSchema)

module.exports = MigrationCode

