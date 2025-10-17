const express = require('express');
const router = express.Router();
const talkTrainingConferenceController = require('../controllers/TalkTrainingConferenceController');

router.post('/', talkTrainingConferenceController.createEvent);
router.get('/', talkTrainingConferenceController.getAllEvents);
router.get('/:id', talkTrainingConferenceController.getEventById);
router.put('/:id', talkTrainingConferenceController.updateEvent);
router.delete('/:id', talkTrainingConferenceController.deleteEvent);

module.exports = router;
