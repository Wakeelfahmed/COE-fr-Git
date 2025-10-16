const express = require('express');
const router = express.Router();
const fundingProposalController = require('../controllers/fundingProposalController');

router.post('/', fundingProposalController.createFundingProposal);
router.get('/', fundingProposalController.getAllFundingProposals);
router.get('/:id', fundingProposalController.getFundingProposalById);
router.put('/:id', fundingProposalController.updateFundingProposal);
router.delete('/:id', fundingProposalController.deleteFundingProposal);

module.exports = router;
