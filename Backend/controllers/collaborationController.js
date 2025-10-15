const Collaboration = require('../models/Collaboration');
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

// Helper function to check if user has access to the collaboration
const hasAccessToCollaboration = (user, collaboration) => {
  return user.role === 'director' || collaboration.createdBy.toString() === user._id.toString();
};

exports.createCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = new Collaboration({
      ...req.body,
      createdBy: user._id
    });
    await collaboration.save();
    res.status(201).json(collaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCollaborations = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let collaborations;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      collaborations = await Collaboration.find();
    } else {
      collaborations = await Collaboration.find({ createdBy: user._id });
    }
    res.json(collaborations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCollaborationById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(collaboration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCollaboration = await Collaboration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCollaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Collaboration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collaboration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
