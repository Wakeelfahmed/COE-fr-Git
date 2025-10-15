const Internship = require('../models/Intership.js');
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

// Helper function to check if user has access to the internship
const hasAccessToInternship = (user, internship) => {
  return user.role === 'director' || internship.createdBy.toString() === user._id.toString();
};

exports.createInternship = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const internship = new Internship({
      ...req.body,
      createdBy: user._id
    });
    await internship.save();
    res.status(201).json(internship);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllInternships = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  

  try {
    let internships;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      internships = await Internship.find();
    } else {
      internships = await Internship.find({ createdBy: user._id });
    }
    res.json(internships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInternshipById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    if (!hasAccessToInternship(user, internship)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(internship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInternship = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    if (!hasAccessToInternship(user, internship)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedInternship);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteInternship = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    if (!hasAccessToInternship(user, internship)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Internship.findByIdAndDelete(req.params.id);
    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};