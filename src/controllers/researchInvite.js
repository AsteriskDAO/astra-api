const ResearchInvite = require('../models/researchInvite')
const logger = require('../utils/logger')

class ResearchInviteController {
  /**
   * Create new research invite
   * POST /api/research-invites
   */
  async createInvite(req, res) {
    try {
      const { title, message, type, client, link, isPrivate } = req.body
      
      if (!title || !message || !client || !link) {
        return res.status(400).json({ error: 'Title, message, client, and link are required' })
      }
      
      const invite = new ResearchInvite({
        title,
        message,
        type: type || null,
        client,
        link,
        isPrivate: isPrivate === true || isPrivate === 'true',
        invited_users: [],
        responses: []
      })
      
      await invite.save()
      
      logger.info(`Research invite created: ${invite._id}, client: ${client}, isPrivate: ${invite.isPrivate}`)
      
      res.status(201).json({
        id: invite._id,
        title: invite.title,
        message: invite.message,
        type: invite.type,
        client: invite.client,
        link: invite.link,
        isPrivate: invite.isPrivate,
        invited_users: invite.invited_users,
        responses: invite.responses,
        created_at: invite.created_at
      })
    } catch (err) {
      logger.error('Error creating research invite:', err)
      res.status(500).json({ error: 'Failed to create research invite' })
    }
  }

  /**
   * Get all research invites
   * GET /api/research-invites
   */
  async getInvites(req, res) {
    try {
      const invites = await ResearchInvite.find()
        .sort({ created_at: -1 })
        .select('-__v')
      
      res.json(invites)
    } catch (err) {
      logger.error('Error fetching research invites:', err)
      res.status(500).json({ error: 'Failed to fetch research invites' })
    }
  }

  /**
   * Get research invite by ID
   * GET /api/research-invites/:id
   */
  async getInviteById(req, res) {
    try {
      const { id } = req.params
      const invite = await ResearchInvite.findById(id)
      
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      res.json(invite)
    } catch (err) {
      logger.error('Error fetching research invite:', err)
      res.status(500).json({ error: 'Failed to fetch research invite' })
    }
  }

  /**
   * Invite a user to research
   * POST /api/research-invites/:id/invite
   * Body: { user_hash: "..." }
   */
  async inviteUser(req, res) {
    try {
      const { id } = req.params
      const { user_hash } = req.body
      
      if (!user_hash) {
        return res.status(400).json({ error: 'user_hash is required' })
      }
      
      const invite = await ResearchInvite.findById(id)
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      const response = await invite.inviteUser(user_hash)
      
      logger.info(`User ${user_hash} invited to research invite ${id}`)
      
      res.json({
        message: 'User invited successfully',
        response
      })
    } catch (err) {
      logger.error('Error inviting user:', err)
      res.status(500).json({ error: err.message || 'Failed to invite user' })
    }
  }

  /**
   * Record user response to research invite
   * POST /api/research-invites/:id/respond
   * Body: { user_hash: "...", response: "yes" | "no" }
   * Note: For private invites, user must be invited first. For public invites, any user can respond.
   */
  async recordResponse(req, res) {
    try {
      const { id } = req.params
      const { user_hash, response } = req.body
      
      if (!user_hash || !response) {
        return res.status(400).json({ error: 'user_hash and response are required' })
      }
      
      if (!['yes', 'no'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "yes" or "no"' })
      }
      
      const invite = await ResearchInvite.findById(id)
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      const userResponse = await invite.recordResponse(user_hash, response)
      
      logger.info(`User ${user_hash} responded ${response} to research invite ${id}`)
      
      res.json({
        message: 'Response recorded successfully',
        response: userResponse
      })
    } catch (err) {
      logger.error('Error recording response:', err)
      res.status(400).json({ error: err.message || 'Failed to record response' })
    }
  }

  /**
   * Get user's status for an invite
   * GET /api/research-invites/:id/status?user_hash=...
   * Returns: invited status, response status (if any)
   */
  async getUserStatus(req, res) {
    try {
      const { id } = req.params
      const { user_hash } = req.query
      
      if (!user_hash) {
        return res.status(400).json({ error: 'user_hash is required' })
      }
      
      const invite = await ResearchInvite.findById(id)
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      const isInvited = invite.invited_users.includes(user_hash)
      const userResponse = invite.responses.find(r => r.user_hash === user_hash)
      
      res.json({
        isPrivate: invite.isPrivate,
        invited: isInvited,
        canRespond: invite.isPrivate ? isInvited : true, // Public invites: anyone can respond
        hasResponded: !!userResponse,
        response: userResponse ? userResponse.response : null,
        responded_at: userResponse ? userResponse.responded_at : null
      })
    } catch (err) {
      logger.error('Error fetching user status:', err)
      res.status(500).json({ error: 'Failed to fetch user status' })
    }
  }

  /**
   * Get all invited users for a research invite
   * GET /api/research-invites/:id/invited-users
   * Returns list of invited users and their response status
   */
  async getInvitedUsers(req, res) {
    try {
      const { id } = req.params
      const invite = await ResearchInvite.findById(id)
      
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      // Map invited users with their response status
      const invitedUsersWithStatus = invite.invited_users.map(userHash => {
        const response = invite.responses.find(r => r.user_hash === userHash)
        return {
          user_hash: userHash,
          hasResponded: !!response,
          response: response ? response.response : null,
          responded_at: response ? response.responded_at : null
        }
      })
      
      res.json({
        isPrivate: invite.isPrivate,
        total_invited: invite.invited_users.length,
        users: invitedUsersWithStatus
      })
    } catch (err) {
      logger.error('Error fetching invited users:', err)
      res.status(500).json({ error: 'Failed to fetch invited users' })
    }
  }

  /**
   * Get statistics for a research invite
   * GET /api/research-invites/:id/stats
   */
  async getStats(req, res) {
    try {
      const { id } = req.params
      const invite = await ResearchInvite.findById(id)
      
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      const stats = {
        isPrivate: invite.isPrivate,
        total_invited: invite.invited_users.length, // Only for private invites
        total_responses: invite.responses.length,
        yes_count: invite.responses.filter(r => r.response === 'yes').length,
        no_count: invite.responses.filter(r => r.response === 'no').length,
        // For private invites: pending = invited but not responded
        pending_count: invite.isPrivate 
          ? invite.invited_users.filter(userHash => 
              !invite.responses.find(r => r.user_hash === userHash)
            ).length
          : 0
      }
      
      res.json(stats)
    } catch (err) {
      logger.error('Error fetching stats:', err)
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  }

  /**
   * Update research invite
   * PUT /api/research-invites/:id
   */
  async updateInvite(req, res) {
    try {
      const { id } = req.params
      const { title, message, type, client, link, isPrivate } = req.body
      
      const invite = await ResearchInvite.findById(id)
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      if (title) invite.title = title
      if (message) invite.message = message
      if (type !== undefined) invite.type = type
      if (client) invite.client = client
      if (link) invite.link = link
      if (isPrivate !== undefined) invite.isPrivate = isPrivate === true || isPrivate === 'true'
      
      await invite.save()
      
      logger.info(`Research invite updated: ${id}`)
      
      res.json(invite)
    } catch (err) {
      logger.error('Error updating research invite:', err)
      res.status(500).json({ error: 'Failed to update research invite' })
    }
  }

  /**
   * Delete research invite
   * DELETE /api/research-invites/:id
   */
  async deleteInvite(req, res) {
    try {
      const { id } = req.params
      const invite = await ResearchInvite.findByIdAndDelete(id)
      
      if (!invite) {
        return res.status(404).json({ error: 'Research invite not found' })
      }
      
      logger.info(`Research invite deleted: ${id}`)
      
      res.json({ message: 'Research invite deleted successfully' })
    } catch (err) {
      logger.error('Error deleting research invite:', err)
      res.status(500).json({ error: 'Failed to delete research invite' })
    }
  }
}

module.exports = new ResearchInviteController()

