const express = require('express');
const router = express.Router();
const trainingsConductedController = require('../controllers/trainingsConductedController');

router.post('/', trainingsConductedController.createTrainingsConducted);
router.get('/', trainingsConductedController.getAllTrainingsConducted);
router.get('/:id', trainingsConductedController.getTrainingsConductedById);
router.put('/:id', trainingsConductedController.updateTrainingsConducted);
router.delete('/:id', trainingsConductedController.deleteTrainingsConducted);

module.exports = router;
