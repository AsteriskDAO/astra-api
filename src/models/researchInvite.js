const mongoose = require('mongoose')

const researchInviteResponseSchema = new mongoose.Schema({
  user_hash: { type: String, required: true },
  response: { 
    type: String, 
    enum: ['yes', 'no'], 
    required: true
  },
  responded_at: { type: Date, default: Date.now }
}, { _id: false })

const researchInviteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: null }, // Optional
  client: { type: String, required: true },
  link: { type: String, required: true },
  isPrivate: { type: Boolean, default: false }, // true = private (invite only), false = public (open to all)
  invited_users: [{ type: String }], // Array of user_hashes for private invites
  responses: [researchInviteResponseSchema], // Track actual user responses (yes/no)
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Pre-save middleware to update timestamps
researchInviteSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Method to add a user to the invite list (for private invites)
researchInviteSchema.methods.inviteUser = async function(userHash) {
  // Check if user is already invited
  if (this.invited_users.includes(userHash)) {
    return { user_hash: userHash, already_invited: true }
  }
  
  // Add user to invited_users array
  this.invited_users.push(userHash)
  
  await this.save()
  return { user_hash: userHash, invited: true }
}

// Method to record user response
researchInviteSchema.methods.recordResponse = async function(userHash, response) {
  if (!['yes', 'no'].includes(response)) {
    throw new Error('Response must be "yes" or "no"')
  }
  
  // For private invites, check if user was invited
  if (this.isPrivate && !this.invited_users.includes(userHash)) {
    throw new Error('User was not invited to this private research invite')
  }
  
  // Check if user already responded
  const existingResponse = this.responses.find(r => r.user_hash === userHash)
  if (existingResponse) {
    // Update existing response
    existingResponse.response = response
    existingResponse.responded_at = new Date()
  } else {
    // Add new response
    this.responses.push({
      user_hash: userHash,
      response: response,
      responded_at: new Date()
    })
  }
  
  await this.save()
  return this.responses.find(r => r.user_hash === userHash)
}

const ResearchInvite = mongoose.model('ResearchInvite', researchInviteSchema)

module.exports = ResearchInvite

