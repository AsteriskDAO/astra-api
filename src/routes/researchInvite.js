const express = require('express')
const router = express.Router()
const researchInviteController = require('../controllers/researchInvite')
const { validate } = require('../middleware/validation')

router.post('/', validate('createResearchInvite'), researchInviteController.createInvite)
router.get('/', researchInviteController.getInvites)
router.get('/:id', researchInviteController.getInviteById)
router.put('/:id', validate('updateResearchInvite'), researchInviteController.updateInvite)
router.delete('/:id', researchInviteController.deleteInvite)
router.post('/:id/invite', validate('inviteUser'), researchInviteController.inviteUser)
router.post('/:id/respond', validate('recordResponse'), researchInviteController.recordResponse)
router.get('/:id/status', researchInviteController.getUserStatus)
router.get('/:id/invited-users', researchInviteController.getInvitedUsers)
router.get('/:id/stats', researchInviteController.getStats)

module.exports = router

