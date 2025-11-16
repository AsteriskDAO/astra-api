const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth')
const { validate } = require('../middleware/validation')

router.post('/register', validate('register'), authController.register)
router.post('/login', validate('login'), authController.login)
router.post('/set-email', validate('setEmailPassword'), authController.setEmailPassword)

module.exports = router


