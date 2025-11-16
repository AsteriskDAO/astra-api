const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "bug", "feature", "general", etc.
  message: { type: String, required: true },
  user_hash: { type: String, default: null }, // Optional: track who submitted feedback
  resolved: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
})

const Feedback = mongoose.model('Feedback', feedbackSchema)

module.exports = Feedback

