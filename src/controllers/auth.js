const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { createUserHash } = require('../utils/hash')
const config = require('../config/config')

const signToken = (user) => {
  // Handle users without email (migration users)
  const payload = { id: user.user_id }
  if (user.email) {
    payload.email = user.email
  }
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
}

class AuthController {
  async register(req, res) {
    try {
      const user = await User.register({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        nickname: req.body.nickname,
        userHashGenerator: createUserHash
      })
      const token = signToken(user)
      res.status(201).json({ token, user: { email: user.email, userHash: user.user_hash } })
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  }

  async login(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })
      const ok = await user.comparePassword(req.body.password)
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
      const token = signToken(user)
      res.json({ token, user: { email: user.email, userHash: user.user_hash } })
    } catch (err) {
      res.status(500).json({ error: 'Login failed' })
    }
  }

  async setEmailPassword(req, res) {
    try {
      const { user_hash, email, password } = req.body
      
      if (!user_hash || !email || !password) {
        return res.status(400).json({ error: 'user_hash, email, and password are required' })
      }

      const user = await User.findOne({ user_hash })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (user.isRegistered && user.email) {
        return res.status(400).json({ error: 'User already has email/password set' })
      }

      await user.setEmailPassword(email, password)
      const token = signToken(user)
      
      res.json({ 
        token, 
        user: { 
          email: user.email, 
          userHash: user.user_hash,
          telegram_id: user.telegram_id 
        },
        message: 'Email and password set successfully'
      })
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  }
}

module.exports = new AuthController()


