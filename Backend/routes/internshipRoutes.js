const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');

router.post('/', internshipController.createInternship);
router.get('/', internshipController.getAllInternships);
router.get('/:id', internshipController.getInternshipById);
router.put('/:id', internshipController.updateInternship);
router.delete('/:id', internshipController.deleteInternship);

module.exports = router;