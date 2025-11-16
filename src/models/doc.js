const mongoose = require('mongoose')

const docSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, required: true }, // e.g., "guide", "faq", "tutorial", etc.
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Pre-save middleware to update timestamps
docSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

const Doc = mongoose.model('Doc', docSchema)

module.exports = Doc

