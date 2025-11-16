const express = require('express')
const router = express.Router()
const docController = require('../controllers/doc')
const { validate } = require('../middleware/validation')

router.post('/', validate('createDoc'), docController.createDoc)
router.get('/', docController.getDocs)
router.get('/:id', docController.getDocById)
router.put('/:id', validate('updateDoc'), docController.updateDoc)
router.delete('/:id', docController.deleteDoc)

module.exports = router

