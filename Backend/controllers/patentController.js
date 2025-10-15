const Patent = require('../models/Patent.js');
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

// Helper function to check if user has access to the patent
const hasAccessToPatent = (user, patent) => {
  return user.role === 'director' || patent.createdBy.toString() === user._id.toString();
};

exports.createPatent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const patent = new Patent({
      ...req.body,
      createdBy: user._id
    });
    await patent.save();
    res.status(201).json(patent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllPatents = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let patents;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      patents = await Patent.find();
    } else {
      patents = await Patent.find({ createdBy: user._id });
    }
    res.json(patents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatentById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) return res.status(404).json({ message: 'Patent not found' });

    if (!hasAccessToPatent(user, patent)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(patent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePatent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) return res.status(404).json({ message: 'Patent not found' });

    if (!hasAccessToPatent(user, patent)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedPatent = await Patent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPatent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePatent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) return res.status(404).json({ message: 'Patent not found' });

    if (!hasAccessToPatent(user, patent)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Patent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};