const express = require('express');
const router = express.Router();
const localCollaborationController = require('../controllers/localCollaborationController');

router.post('/', localCollaborationController.createLocalCollaboration);
router.get('/', localCollaborationController.getAllLocalCollaborations);
router.get('/:id', localCollaborationController.getLocalCollaborationById);
router.put('/:id', localCollaborationController.updateLocalCollaboration);
router.delete('/:id', localCollaborationController.deleteLocalCollaboration);

module.exports = router;
