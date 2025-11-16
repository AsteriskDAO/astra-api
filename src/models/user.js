const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { createUserHash } = require('../utils/hash')
const { v4: uuidv4 } = require('uuid')

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  telegram_id: { type: String, unique: true, sparse: true }, // Optional, sparse index allows multiple nulls
  user_hash: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Optional, sparse index allows multiple nulls
  password: { type: String }, // Hashed password, optional
  wallet_address: String,
  proof_of_passport_id: String,
  name: String,
  nickname: String,
  checkIns: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastCheckIn: { type: Date, default: null },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  streakHistory: { type: [String], default: [] }, // YYYY-MM-DD dates for UI
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  isGenderVerified: { type: Boolean, default: false },
  isRegistered: { type: Boolean, default: false },
  currentHealthDataId: { type: String, default: null }, // Reference to current health data
})

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Method to record a check-in and update streaks (UTC server-side)
userSchema.methods.recordCheckIn = async function() {
  const now = new Date()
  const todayUTC = now.toISOString().split('T')[0] // YYYY-MM-DD
  
  // Check if already checked in today (1-check-in-per-day rule)
  if (this.lastCheckIn) {
    const lastCheckInUTC = this.lastCheckIn.toISOString().split('T')[0]
    if (lastCheckInUTC === todayUTC) {
      throw new Error('Already checked in today')
    }
  }

  this.checkIns++
  this.lastCheckIn = now
  this.points += 1

  // Update streak logic
  if (!this.lastCheckIn) {
    this.currentStreak = 1
  } else {
    const lastCheckInUTC = this.lastCheckIn.toISOString().split('T')[0]
    const yesterdayUTC = new Date(now)
    yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1)
    const yesterdayStr = yesterdayUTC.toISOString().split('T')[0]
    
    if (lastCheckInUTC === yesterdayStr) {
      this.currentStreak = (this.currentStreak || 0) + 1
    } else {
      this.currentStreak = 1
    }
  }
  
  this.longestStreak = Math.max(this.longestStreak || 0, this.currentStreak || 0)
  
  // Add to streak history (keep last 30 days)
  this.streakHistory = this.streakHistory || []
  this.streakHistory.push(todayUTC)
  this.streakHistory = this.streakHistory.slice(-7) // Keep last 7 days

  await this.save()
  return this.currentStreak
}

// Static method to create a new user with proper hashing
userSchema.statics.createUser = async function(userData) {
  const newUserId = uuidv4()
  const userHash = createUserHash(newUserId)
  
  const user = new this({
    user_id: newUserId,
    telegram_id: userData.telegram_id,
    user_hash: userHash,
    name: userData.name,
    nickname: userData.nickname,
    points: userData.points || 0,
    weeklyCheckIns: [],
    averageWeeklyCheckIns: 0
  })

  return user.save()
}

// Static method to create a user from migration (with pre-determined user_id and user_hash)
userSchema.statics.createUserFromMigration = async function(migrationData) {
  const { user_id, user_hash, telegram_id } = migrationData
  
  if (!user_id || !user_hash) {
    throw new Error('user_id and user_hash are required for migration')
  }
  
  const user = new this({
    user_id,
    user_hash,
    telegram_id: telegram_id || null,
    isRegistered: false
  })

  return user.save()
}

userSchema.statics.addPoints = async function(telegramId, points) {
  const user = await this.findOneAndUpdate(
    { telegram_id: telegramId },
    { $inc: { points: points } },
    { new: true }
  )
}

userSchema.statics.checkIn = async function(telegramId) {
  const user = await this.findOneAndUpdate(
    { telegram_id: telegramId },
    { $inc: { checkIns: 1 }, $set: { lastCheckIn: new Date() } },
    { new: true }
  )
}

// Method to check and reset streak if user missed a day (call when app opens)
userSchema.methods.checkStreakOnAppOpen = async function() {
  if (!this.lastCheckIn) return this.currentStreak
  
  const now = new Date()
  const todayUTC = now.toISOString().split('T')[0]
  const lastCheckInUTC = this.lastCheckIn.toISOString().split('T')[0]
  
  // If last check-in was more than 1 day ago, reset streak
  const lastCheckInDate = new Date(lastCheckInUTC + 'T00:00:00.000Z')
  const todayDate = new Date(todayUTC + 'T00:00:00.000Z')
  const daysDiff = Math.floor((todayDate - lastCheckInDate) / (1000 * 60 * 60 * 24))
  
  if (daysDiff > 1) {
    this.currentStreak = 0
    await this.save()
  }
  
  return this.currentStreak
}

// rollbackCheckIn no longer maintains weekly averages; keep minimal safe decrement
userSchema.methods.rollbackCheckIn = async function() {
  this.checkIns = Math.max(0, (this.checkIns || 0) - 1)
  this.points = Math.max(0, (this.points || 0) - 1)
  await this.save()
}

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// Static method to register a new user with email/password
userSchema.statics.register = async function(userData) {
  const { email, password, name, nickname, userHashGenerator } = userData
  
  // Check if email already exists
  const existingUser = await this.findOne({ email })
  if (existingUser) {
    throw new Error('Email already registered')
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Generate user_id and hash
  const newUserId = uuidv4()
  const userHash = userHashGenerator ? userHashGenerator(newUserId) : createUserHash(newUserId)
  
  // Create user
  const user = new this({
    user_id: newUserId,
    user_hash: userHash,
    email,
    password: hashedPassword,
    name,
    nickname,
    isRegistered: true
  })
  
  return user.save()
}

// Method to set email and password (for migration completion)
userSchema.methods.setEmailPassword = async function(email, password) {
  // Check if email is already taken by another user
  const existingUser = await this.constructor.findOne({ email, _id: { $ne: this._id } })
  if (existingUser) {
    throw new Error('Email already registered')
  }
  
  this.email = email
  this.password = await bcrypt.hash(password, 10)
  this.isRegistered = true
  return this.save()
}

const User = mongoose.model('User', userSchema)

module.exports = User

