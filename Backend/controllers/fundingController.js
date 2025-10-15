const Funding = require('../models/Funding.js');
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

// Helper function to check if user has access to the funding
const hasAccessToFunding = (user, funding) => {
  return user.role === 'director' || funding.createdBy.toString() === user._id.toString();
};

exports.createFunding = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const funding = new Funding({
      ...req.body,
      createdBy: user._id
    });
    await funding.save();
    res.status(201).json(funding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllFundings = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let fundings;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      fundings = await Funding.find();
    } else {
      fundings = await Funding.find({ createdBy: user._id });
    }
    res.json(fundings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFundingById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const funding = await Funding.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding not found' });

    if (!hasAccessToFunding(user, funding)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(funding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFunding = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const funding = await Funding.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding not found' });

    if (!hasAccessToFunding(user, funding)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedFunding = await Funding.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFunding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFunding = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const funding = await Funding.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding not found' });

    if (!hasAccessToFunding(user, funding)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Funding.findByIdAndDelete(req.params.id);
    res.json({ message: 'Funding deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};