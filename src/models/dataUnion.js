const mongoose = require('mongoose')

const dataUnionSchema = new mongoose.Schema({
  schema_version: { type: String, default: 'v1', enum: ['v1'], required: true },
  user_hash: { type: String, required: true, trim: true },
  data_type: { type: String, enum: ['health', 'checkin'], required: true },
  data_id: { type: String, required: true, trim: true },
  partners: {
    akave: {
      is_synced: { type: Boolean, default: false },
      error_message: { type: String, default: null },
      retry_data: { type: Object, default: null },
      key: { type: String, default: null },
      url: { type: String, default: null }
    },
    vana: {
      is_synced: { type: Boolean, default: false },
      error_message: { type: String, default: null },
      retry_data: { type: Object, default: null },
      file_id: { type: String, default: null }
    }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

dataUnionSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

dataUnionSchema.index({ user_hash: 1, data_type: 1, data_id: 1 }, { unique: true })
dataUnionSchema.index({ 'partners.vana.is_synced': 1 })
dataUnionSchema.index({ 'partners.akave.is_synced': 1 })
dataUnionSchema.index({ updated_at: -1 })

dataUnionSchema.statics.createDataUnion = async function(data) {
  const existingRecord = await this.findByDataReference(data.user_hash, data.data_type, data.data_id)
  if (existingRecord) return existingRecord
  const dataUnion = new this(data)
  return await dataUnion.save()
}

dataUnionSchema.methods.updatePartnerSync = async function(partner, isSynced, errorMessage = null, retryData = null) {
  if (!this.partners[partner]) {
    throw new Error(`Partner ${partner} not found`)
  }
  this.partners[partner].is_synced = isSynced
  this.partners[partner].error_message = errorMessage
  if (retryData) {
    this.partners[partner].retry_data = retryData
    if (partner === 'akave') {
      if (retryData.key !== undefined) this.partners[partner].key = retryData.key
      if (retryData.url !== undefined) this.partners[partner].url = retryData.url
    }
    if (partner === 'vana') {
      if (retryData.file_id !== undefined) this.partners[partner].file_id = retryData.file_id
      if (retryData.fileId !== undefined) this.partners[partner].file_id = retryData.fileId
    }
  }
  this.updated_at = new Date()
  return await this.save()
}

dataUnionSchema.statics.findFailedSyncs = async function(partner, dataType = null) {
  const query = { [`partners.${partner}.is_synced`]: false }
  if (dataType) query.data_type = dataType
  return await this.find(query).sort({ updated_at: -1 })
}

dataUnionSchema.statics.findByDataReference = async function(userHash, dataType, dataId) {
  return await this.findOne({ user_hash: userHash, data_type: dataType, data_id: dataId })
}

const DataUnion = mongoose.model('DataUnion', dataUnionSchema)
module.exports = DataUnion


