const CheckIn = require('../models/checkIn')
const User = require('../models/user')

class CheckInController {
  async createCheckin(req, res) {
    try {
      const { user_hash } = req.params
      const checkIn = await CheckIn.createCheckIn({ user_hash, ...req.body })
      const user = await User.findOne({ user_hash })
      if (!user) throw new Error('User not found')
      await user.recordCheckIn()
      res.json({ success: true, checkIn: checkIn.toObject(), stats: { totalCheckIns: user.checkIns, currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakHistory: user.streakHistory } })
    } catch (error) {
      if (error.message === 'Already checked in today') {
        return res.status(400).json({ error: 'Already checked in today' })
      }
      res.status(500).json({ error: 'Failed to create check-in' })
    }
  }

  async getUserCheckins(req, res) {
    try {
      const { user_hash } = req.params
      const checkIns = await CheckIn.find({ user_hash })
      res.json(checkIns)
    } catch (error) {
      res.status(500).json({ error: 'Failed to get check-ins' })
    }
  }
}

module.exports = new CheckInController()


