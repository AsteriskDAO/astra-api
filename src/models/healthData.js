const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const profileSchema = new mongoose.Schema({
  age_range: { type: String, enum: ['18-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50+'] },
  ethnicity: { type: [String], default: [] },
  location: String,
  is_pregnant: Boolean
})

const conditionsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date_diagnosed: { type: String },
  type: { type: String, enum: ['clinically diagnosed', 'self diagnosed', 'suspected'], required: true },
  status: { type: String, enum: ['Untreated', 'Treating', 'Remission', 'Resolved'] },
  notes: { type: String }
})

const treatmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  start_date: { type: String },
  location: { type: String, enum: ['Clinical', 'At home', 'Appt-based'] },
  type: { type: String }, // includes medication as possible value
  status: { type: String, enum: ['Ongoing', 'Completed', 'Paused', 'Discontinued'] },
  frequency: { type: String, enum: ['Multiple times per day', 'Daily', 'Weekly', 'Biweekly', 'Monthly', 'Intermittent'] },
  notes: { type: String }
})


const healthDataSchema = new mongoose.Schema({
  schema_version: { type: String, default: 'v2', enum: ['v1', 'v2'], required: true },
  healthDataId: { type: String, required: true, unique: true },
  user_hash: { type: String, required: true },
  research_opt_in: { type: Boolean, default: false },
  profile: profileSchema,
  conditions: { type: [conditionsSchema] },
  medications: { type: [String] },
  treatments: { type: [treatmentSchema] },
  caretaker: { type: [String] },
  timestamp: { type: Date, default: Date.now }
})

healthDataSchema.statics.createHealthData = async function(healthData) {
  const newHealthDataId = uuidv4()
  const newHealthData = new this({
    ...healthData,
    healthDataId: newHealthDataId
  })
  return newHealthData.save()
}

module.exports = mongoose.model('HealthData', healthDataSchema)


