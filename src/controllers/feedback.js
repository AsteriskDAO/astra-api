const Feedback = require('../models/feedback')
const logger = require('../utils/logger')

class FeedbackController {
  /**
   * Create new feedback
   * POST /api/feedback
   */
  async createFeedback(req, res) {
    try {
      const { type, message, user_hash } = req.body
      
      if (!type || !message) {
        return res.status(400).json({ error: 'Type and message are required' })
      }
      
      const feedback = new Feedback({
        type,
        message,
        user_hash: user_hash || null,
        resolved: false
      })
      
      await feedback.save()
      
      logger.info(`Feedback created: ${feedback._id}, type: ${type}`)
      
      res.status(201).json({
        id: feedback._id,
        type: feedback.type,
        message: feedback.message,
        resolved: feedback.resolved,
        created_at: feedback.created_at
      })
    } catch (err) {
      logger.error('Error creating feedback:', err)
      res.status(500).json({ error: 'Failed to create feedback' })
    }
  }

  /**
   * Get all feedback (with optional filtering)
   * GET /api/feedback?type=bug&resolved=false
   */
  async getFeedback(req, res) {
    try {
      const { type, resolved } = req.query
      const query = {}
      
      if (type) query.type = type
      if (resolved !== undefined) query.resolved = resolved === 'true'
      
      const feedback = await Feedback.find(query)
        .sort({ created_at: -1 })
        .select('-__v')
      
      res.json(feedback)
    } catch (err) {
      logger.error('Error fetching feedback:', err)
      res.status(500).json({ error: 'Failed to fetch feedback' })
    }
  }

  /**
   * Get feedback by ID
   * GET /api/feedback/:id
   */
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params
      const feedback = await Feedback.findById(id)
      
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' })
      }
      
      res.json(feedback)
    } catch (err) {
      logger.error('Error fetching feedback:', err)
      res.status(500).json({ error: 'Failed to fetch feedback' })
    }
  }

  /**
   * Update feedback (mark as resolved/unresolved)
   * PUT /api/feedback/:id
   */
  async updateFeedback(req, res) {
    try {
      const { id } = req.params
      const { resolved, message, type } = req.body
      
      const feedback = await Feedback.findById(id)
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' })
      }
      
      if (resolved !== undefined) feedback.resolved = resolved
      if (message) feedback.message = message
      if (type) feedback.type = type
      
      await feedback.save()
      
      logger.info(`Feedback updated: ${id}, resolved: ${feedback.resolved}`)
      
      res.json({
        id: feedback._id,
        type: feedback.type,
        message: feedback.message,
        resolved: feedback.resolved,
        user_hash: feedback.user_hash,
        created_at: feedback.created_at
      })
    } catch (err) {
      logger.error('Error updating feedback:', err)
      res.status(500).json({ error: 'Failed to update feedback' })
    }
  }
}

module.exports = new FeedbackController()

