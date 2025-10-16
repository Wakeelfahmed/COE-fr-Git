const LocalCollaboration = require('../models/LocalCollaboration');
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

// Helper function to check if user has access to the local collaboration
const hasAccessToLocalCollaboration = (user, localCollaboration) => {
  return user.role === 'director' || localCollaboration.createdBy.toString() === user._id.toString();
};

exports.createLocalCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const localCollaboration = new LocalCollaboration({
      ...req.body,
      createdBy: user._id
    });
    await localCollaboration.save();
    res.status(201).json(localCollaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllLocalCollaborations = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let localCollaborations;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      localCollaborations = await LocalCollaboration.find();
    } else {
      localCollaborations = await LocalCollaboration.find({ createdBy: user._id });
    }
    res.json(localCollaborations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLocalCollaborationById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const localCollaboration = await LocalCollaboration.findById(req.params.id);
    if (!localCollaboration) return res.status(404).json({ message: 'Local Collaboration not found' });

    if (!hasAccessToLocalCollaboration(user, localCollaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(localCollaboration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLocalCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const localCollaboration = await LocalCollaboration.findById(req.params.id);
    if (!localCollaboration) return res.status(404).json({ message: 'Local Collaboration not found' });

    if (!hasAccessToLocalCollaboration(user, localCollaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedLocalCollaboration = await LocalCollaboration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLocalCollaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteLocalCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const localCollaboration = await LocalCollaboration.findById(req.params.id);
    if (!localCollaboration) return res.status(404).json({ message: 'Local Collaboration not found' });

    if (!hasAccessToLocalCollaboration(user, localCollaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await LocalCollaboration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Local Collaboration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
