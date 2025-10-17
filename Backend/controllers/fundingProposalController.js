const FundingProposal = require('../models/FundingProposal.js');
const jwt = require('jsonwebtoken');

// Helper function to get user info from token
const getUserFromToken = (req) => {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Helper function to check if user has access to the funding proposal
const hasAccessToFundingProposal = (user, fundingProposal) => {
  // Handle both old (simple ID) and new (object with id) createdBy structures
  const creatorId = fundingProposal.createdBy?.id || fundingProposal.createdBy;
  return user.role === 'director' || creatorId?.toString() === user._id.toString();
};

exports.createFundingProposal = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Get full user information including name
    const User = require('../models/User');
    const fullUser = await User.findById(user._id);

    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fundingProposal = new FundingProposal({
      ...req.body,
      createdBy: {
        id: user._id,
        name: `${fullUser.firstName} ${fullUser.lastName}`,
        email: fullUser.email
      }
    });
    await fundingProposal.save();
    res.status(201).json(fundingProposal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllFundingProposals = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let fundingProposals;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      fundingProposals = await FundingProposal.find();
    } else {
      // Handle both old (simple ID) and new (object with id) createdBy structures
      fundingProposals = await FundingProposal.find({
        $or: [
          { 'createdBy.id': user._id },
          { createdBy: user._id }
        ]
      });
    }
    res.json(fundingProposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFundingProposalById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const fundingProposal = await FundingProposal.findById(req.params.id);
    if (!fundingProposal) return res.status(404).json({ message: 'Funding Proposal not found' });

    if (!hasAccessToFundingProposal(user, fundingProposal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(fundingProposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFundingProposal = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const fundingProposal = await FundingProposal.findById(req.params.id);
    if (!fundingProposal) return res.status(404).json({ message: 'Funding Proposal not found' });

    if (!hasAccessToFundingProposal(user, fundingProposal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedFundingProposal = await FundingProposal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFundingProposal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFundingProposal = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const fundingProposal = await FundingProposal.findById(req.params.id);
    if (!fundingProposal) return res.status(404).json({ message: 'Funding Proposal not found' });

    if (!hasAccessToFundingProposal(user, fundingProposal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await FundingProposal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Funding Proposal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
