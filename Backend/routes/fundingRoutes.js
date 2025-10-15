const express = require('express');
const router = express.Router();
const fundingController = require('../controllers/fundingController');

router.post('/', fundingController.createFunding);
router.get('/', fundingController.getAllFundings);
router.get('/:id', fundingController.getFundingById);
router.put('/:id', fundingController.updateFunding);
router.delete('/:id', fundingController.deleteFunding);

module.exports = router;