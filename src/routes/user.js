const express = require('express')
const router = express.Router()
const userController = require('../controllers/user')
const { authenticate } = require('../middleware/auth')

router.get('/:userHash', authenticate, userController.getUser)
router.put('/update', authenticate, userController.updateUser)
router.get('/admin/sync-stats', authenticate, userController.getSyncStats)
router.post('/verify-gender', authenticate, userController.verifyGender)

module.exports = router


