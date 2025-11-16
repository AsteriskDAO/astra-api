const Doc = require('../models/doc')
const logger = require('../utils/logger')

class DocController {
  /**
   * Create new doc
   * POST /api/docs
   */
  async createDoc(req, res) {
    try {
      const { title, text, type } = req.body
      
      if (!title || !text || !type) {
        return res.status(400).json({ error: 'Title, text, and type are required' })
      }
      
      const doc = new Doc({
        title,
        text,
        type
      })
      
      await doc.save()
      
      logger.info(`Doc created: ${doc._id}, type: ${type}`)
      
      res.status(201).json({
        id: doc._id,
        title: doc.title,
        text: doc.text,
        type: doc.type,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      })
    } catch (err) {
      logger.error('Error creating doc:', err)
      res.status(500).json({ error: 'Failed to create doc' })
    }
  }

  /**
   * Get all docs (with optional filtering by type)
   * GET /api/docs?type=guide
   */
  async getDocs(req, res) {
    try {
      const { type } = req.query
      const query = type ? { type } : {}
      
      const docs = await Doc.find(query)
        .sort({ created_at: -1 })
        .select('-__v')
      
      res.json(docs)
    } catch (err) {
      logger.error('Error fetching docs:', err)
      res.status(500).json({ error: 'Failed to fetch docs' })
    }
  }

  /**
   * Get doc by ID
   * GET /api/docs/:id
   */
  async getDocById(req, res) {
    try {
      const { id } = req.params
      const doc = await Doc.findById(id)
      
      if (!doc) {
        return res.status(404).json({ error: 'Doc not found' })
      }
      
      res.json(doc)
    } catch (err) {
      logger.error('Error fetching doc:', err)
      res.status(500).json({ error: 'Failed to fetch doc' })
    }
  }

  /**
   * Update doc
   * PUT /api/docs/:id
   */
  async updateDoc(req, res) {
    try {
      const { id } = req.params
      const { title, text, type } = req.body
      
      const doc = await Doc.findById(id)
      if (!doc) {
        return res.status(404).json({ error: 'Doc not found' })
      }
      
      if (title) doc.title = title
      if (text) doc.text = text
      if (type) doc.type = type
      
      await doc.save()
      
      logger.info(`Doc updated: ${doc._id}`)
      
      res.json({
        id: doc._id,
        title: doc.title,
        text: doc.text,
        type: doc.type,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      })
    } catch (err) {
      logger.error('Error updating doc:', err)
      res.status(500).json({ error: 'Failed to update doc' })
    }
  }

  /**
   * Delete doc
   * DELETE /api/docs/:id
   */
  async deleteDoc(req, res) {
    try {
      const { id } = req.params
      const doc = await Doc.findByIdAndDelete(id)
      
      if (!doc) {
        return res.status(404).json({ error: 'Doc not found' })
      }
      
      logger.info(`Doc deleted: ${id}`)
      
      res.json({ message: 'Doc deleted successfully' })
    } catch (err) {
      logger.error('Error deleting doc:', err)
      res.status(500).json({ error: 'Failed to delete doc' })
    }
  }
}

module.exports = new DocController()

