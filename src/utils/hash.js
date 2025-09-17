const crypto = require('crypto')

const createUserHash = (userId) => {
  return crypto.createHash('sha256').update(String(userId)).digest('hex')
}

module.exports = { createUserHash }


