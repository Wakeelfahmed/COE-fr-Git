const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');

router.post('/', collaborationController.createCollaboration);
router.get('/', collaborationController.getAllCollaborations);
router.get('/:id', collaborationController.getCollaborationById);
router.put('/:id', collaborationController.updateCollaboration);
router.delete('/:id', collaborationController.deleteCollaboration);

module.exports = router;
