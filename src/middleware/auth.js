const jwt = require('jsonwebtoken')
const config = require('../config/config')

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, config.jwt.secret)
    req.user = { id: payload.id, email: payload.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { authenticate }


