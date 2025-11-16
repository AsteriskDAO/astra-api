const express = require('express')
const router = express.Router()
const migrationController = require('../controllers/migration')
const { validate } = require('../middleware/validation')

router.post('/generate-code', validate('generateMigrationCode'), migrationController.generateCode)
router.post('/verify-code', validate('verifyMigrationCode'), migrationController.verifyCode)
router.get('/status', migrationController.getStatus)

module.exports = router

