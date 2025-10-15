const Achievement = require('../models/Achievement');
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

// Helper function to check if user has access to the achievement
const hasAccessToAchievement = (user, achievement) => {
  return user.role === 'director' || achievement.createdBy.toString() === user._id.toString();
};

exports.createAchievement = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const achievement = new Achievement({
      ...req.body,
      createdBy: user._id
    });
    await achievement.save();
    res.status(201).json(achievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllAchievements = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let achievements;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      achievements = await Achievement.find();
    } else {
      achievements = await Achievement.find({ createdBy: user._id });
    }
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAchievementById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    if (!hasAccessToAchievement(user, achievement)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(achievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAchievement = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    if (!hasAccessToAchievement(user, achievement)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedAchievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedAchievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAchievement = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    if (!hasAccessToAchievement(user, achievement)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
