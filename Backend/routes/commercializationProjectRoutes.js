// routes/commercializationProjectRoutes.js
const express = require('express');
const router = express.Router();
const commercializationProjectController = require('../controllers/commercializationProjectController');

router.post('/projects', commercializationProjectController.createProject);
router.get('/projects', commercializationProjectController.getAllProjects);
router.get('/projects/:id', commercializationProjectController.getProjectById);
router.put('/projects/:id', commercializationProjectController.updateProject);
router.delete('/projects/:id', commercializationProjectController.deleteProject);

module.exports = router;