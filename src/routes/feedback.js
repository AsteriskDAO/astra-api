const express = require('express')
const router = express.Router()
const feedbackController = require('../controllers/feedback')
const { validate } = require('../middleware/validation')

router.post('/', validate('createFeedback'), feedbackController.createFeedback)
router.get('/', feedbackController.getFeedback)
router.get('/:id', feedbackController.getFeedbackById)
router.put('/:id', validate('updateFeedback'), feedbackController.updateFeedback)

module.exports = router

