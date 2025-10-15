const Publication = require('../models/Publication');
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

// Helper function to check if user has access to the publication
const hasAccessToPublication = (user, publication) => {
  return user.role === 'director' || publication.createdBy.toString() === user._id.toString();
};

exports.getAllPublications = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let publications;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      publications = await Publication.find();
    } else {
      publications = await Publication.find({ createdBy: user._id });
    }
    res.json(publications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPublication = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const publication = new Publication({
      ...req.body,
      createdBy: user._id
    });
    const newPublication = await publication.save();
    res.status(201).json(newPublication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPublicationById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    if (!hasAccessToPublication(user, publication)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(publication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePublication = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    if (!hasAccessToPublication(user, publication)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedPublication = await Publication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPublication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePublication = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    if (!hasAccessToPublication(user, publication)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Publication.findByIdAndDelete(req.params.id);
    res.json({ message: 'Publication deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};