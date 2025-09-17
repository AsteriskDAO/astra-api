const express = require('express')
const router = express.Router()
const checkInController = require('../controllers/checkIn')
const { authenticate } = require('../middleware/auth')

router.post('/:user_hash', authenticate, checkInController.createCheckin)
router.get('/:user_hash', authenticate, checkInController.getUserCheckins)

module.exports = router


