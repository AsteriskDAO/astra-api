const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { createUserHash } = require('../utils/hash')
const config = require('../config/config')

const signToken = (user) => {
  return jwt.sign({ id: user.user_id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
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
}

module.exports = new AuthController()


