const User = require('../models/user')
const HealthData = require('../models/healthData')
const Notification = require('../models/notification')
const DataUnion = require('../models/dataUnion')
const { verifyProof } = require('../services/self')

class UserController {
  async getUser(req, res) {
    try {
      const user = await User.findOne({ user_hash: req.params.userHash })
      if (!user) return res.status(404).json({ error: 'User not found' })
      
      // Check streak on app open
      await user.checkStreakOnAppOpen()
      
      let healthData = null
      if (user.currentHealthDataId) {
        healthData = await HealthData.findOne({ healthDataId: user.currentHealthDataId })
      } else {
        healthData = await HealthData.findOne({ user_hash: user.user_hash }).sort({ timestamp: -1 })
      }
      res.json({ ...user._doc, isRegistered: true, healthData, streakHistory: user.streakHistory })
    } catch (err) {
      res.status(500).json({ error: 'Failed to get user' })
    }
  }

  async updateUser(req, res) {
    try {
      const userData = req.body
      const healthData = userData.healthData
      const user = await User.findOneAndUpdate(
        { email: req.user.email },
        { $set: { ...userData, updated_at: new Date() } },
        { new: true }
      )
      if (!user) return res.status(404).json({ error: 'User not found' })

      healthData.user_hash = user.user_hash
      healthData.timestamp = new Date()
      const newHealthData = await HealthData.createHealthData(healthData)

      await User.findOneAndUpdate(
        { email: req.user.email },
        { $set: { currentHealthDataId: newHealthData.healthDataId, updated_at: new Date() } }
      )

      const notification = await Notification.findOne({ user_id: user.user_id })
      if (!notification) await Notification.createNotification(user.user_id)

      res.json({ ...user._doc, currentHealthDataId: newHealthData.healthDataId, isRegistered: true, healthData: newHealthData, streakHistory: user.streakHistory })
    } catch (err) {
      res.status(500).json({ error: 'Failed to update user' })
    }
  }

  async getSyncStats(req, res) {
    try {
      const totalRecords = await DataUnion.countDocuments()
      const akaveSuccess = await DataUnion.countDocuments({ 'partners.akave.is_synced': true })
      const vanaSuccess = await DataUnion.countDocuments({ 'partners.vana.is_synced': true })
      const akaveFailed = await DataUnion.countDocuments({ 'partners.akave.is_synced': false })
      const vanaFailed = await DataUnion.countDocuments({ 'partners.vana.is_synced': false })
      res.json({
        total: totalRecords,
        akave: { success: akaveSuccess, failed: akaveFailed, successRate: totalRecords > 0 ? Math.round((akaveSuccess / totalRecords) * 100) : 0 },
        vana: { success: vanaSuccess, failed: vanaFailed, successRate: totalRecords > 0 ? Math.round((vanaSuccess / totalRecords) * 100) : 0 }
      })
    } catch (err) {
      res.status(500).json({ error: 'Failed to get sync stats' })
    }
  }

  async verifyGender(req, res) {
    try {
      const { attestationId, proof, publicSignals, userContextData } = req.body
      if (!attestationId || !proof || !publicSignals || !userContextData) {
        return res.status(400).json({ error: 'Missing required parameters' })
      }
      const result = await verifyProof(attestationId, proof, publicSignals, userContextData)
      if (!result.isValid) {
        return res.status(400).json({ error: 'Proof verification failed', details: result.isValidDetails })
      }
      if (result.credentialSubject.gender === 'F') {
        const user = await User.findOneAndUpdate(
          { user_id: result.userData.userIdentifier },
          { $set: { isGenderVerified: true } },
          { new: true }
        )
        if (!user) return res.status(404).json({ error: 'User not found' })
        return res.status(200).json({ status: 'success', result: true, credentialSubject: result.credentialSubject, userData: result.userData })
      }
      return res.status(400).json({ status: 'error', result: false, message: 'Verification completed, but gender must be female', details: result.isValidDetails })
    } catch (error) {
      return res.status(500).json({ status: 'error', result: false, message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}

module.exports = new UserController()


