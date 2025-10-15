const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

router.post('/', achievementController.createAchievement);
router.get('/', achievementController.getAllAchievements);
router.get('/:id', achievementController.getAchievementById);
router.put('/:id', achievementController.updateAchievement);
router.delete('/:id', achievementController.deleteAchievement);

module.exports = router;
