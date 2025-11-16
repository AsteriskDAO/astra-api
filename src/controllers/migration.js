const MigrationCode = require('../models/migrationCode')
const User = require('../models/user')
const logger = require('../utils/logger')

class MigrationController {
  /**
   * Generate a 6-digit migration code from Telegram
   * POST /api/migration/generate-code
   * Body: { telegram_id: "123456789" }
   */
  async generateCode(req, res) {
    try {
      const { telegram_id } = req.body
      
      if (!telegram_id) {
        return res.status(400).json({ error: 'telegram_id is required' })
      }
      
      // Generate a 6-digit numeric code with collision detection
      let code
      let attempts = 0
      const maxAttempts = 10
      
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString()
        const existing = await MigrationCode.findOne({ code, expiresAt: { $gt: new Date() } })
        if (!existing) break
        attempts++
      } while (attempts < maxAttempts)
      
      if (attempts >= maxAttempts) {
        logger.error('Failed to generate unique migration code after max attempts')
        return res.status(500).json({ error: 'Failed to generate code, please try again' })
      }
      
      // Code expires in 5 minutes (300 seconds)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      
      // Create migration code record (user_hash will be set when code is verified)
      const migrationCode = new MigrationCode({
        code,
        user_id: null, // Will be set when verified
        user_hash: null, // Will be set when verified
        telegram_id: telegram_id,
        expiresAt,
        isLinked: false
      })
      
      await migrationCode.save()
      
      logger.info(`Generated migration code: ${code} for telegram_id: ${telegram_id}`)
      
      res.json({
        code,
        expiresIn: 300 // 5 minutes in seconds
      })
    } catch (err) {
      logger.error('Error generating migration code:', err)
      res.status(500).json({ error: 'Failed to generate migration code' })
    }
  }

  /**
   * Verify and link a migration code with user account (called from app)
   * POST /api/migration/verify-code
   * Body: { code: "482193", user_hash: "existing_user_hash" }
   */
  async verifyCode(req, res) {
    try {
      const { code, user_hash } = req.body
      
      // Validate code format (should be 6 digits, but validation middleware handles this)
      if (!code || !user_hash) {
        return res.status(400).json({ error: 'Code and user_hash are required' })
      }
      
      // Find the migration code
      const migrationCode = await MigrationCode.findOne({ code })
      
      if (!migrationCode) {
        return res.status(404).json({ error: 'Invalid code' })
      }
      
      // Check if code has expired
      if (new Date() > migrationCode.expiresAt) {
        return res.status(400).json({ error: 'Code has expired' })
      }
      
      // Check if already linked
      if (migrationCode.isLinked) {
        return res.status(400).json({ error: 'Code has already been used' })
      }
      
      // Find existing user by user_hash (user already exists in app)
      const user = await User.findOne({ user_hash })
      
      if (!user) {
        return res.status(404).json({ error: 'User account not found' })
      }
      
      // Check if user already has a different telegram_id
      if (user.telegram_id && user.telegram_id !== migrationCode.telegram_id) {
        return res.status(400).json({ error: 'This account is already linked to a different Telegram account' })
      }
      
      // Check if telegram_id is already linked to another account
      const existingUserWithTelegram = await User.findOne({ telegram_id: migrationCode.telegram_id })
      if (existingUserWithTelegram && existingUserWithTelegram.user_hash !== user_hash) {
        return res.status(400).json({ error: 'Telegram account is already linked to another Astra account' })
      }
      
      // Link telegram_id to existing user
      user.telegram_id = migrationCode.telegram_id
      await user.save()
      
      // Mark code as linked and store user info
      migrationCode.isLinked = true
      migrationCode.user_id = user.user_id
      migrationCode.user_hash = user.user_hash
      await migrationCode.save()
      
      logger.info(`Migration code ${code} linked to telegram_id: ${migrationCode.telegram_id}, user_hash: ${user_hash}`)
      
      res.json({
        success: true,
        user_hash: user.user_hash,
        telegram_id: migrationCode.telegram_id,
        message: 'Account linked successfully'
      })
    } catch (err) {
      logger.error('Error verifying migration code:', err)
      res.status(500).json({ error: 'Failed to verify code' })
    }
  }

  /**
   * Check migration status by code
   * GET /api/migration/status?code=482193
   */
  async getStatus(req, res) {
    try {
      const { code } = req.query
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' })
      }
      
      const migrationCode = await MigrationCode.findOne({ code })
      
      if (!migrationCode) {
        return res.status(404).json({ error: 'Invalid code' })
      }
      
      // Check if expired
      if (new Date() > migrationCode.expiresAt) {
        return res.json({
          isLinked: false,
          expired: true,
          message: 'Code has expired'
        })
      }
      
      res.json({
        isLinked: migrationCode.isLinked,
        expired: false,
        user_hash: migrationCode.user_hash || null,
        telegram_id: migrationCode.telegram_id
      })
    } catch (err) {
      logger.error('Error checking migration status:', err)
      res.status(500).json({ error: 'Failed to check status' })
    }
  }
}

module.exports = new MigrationController()

