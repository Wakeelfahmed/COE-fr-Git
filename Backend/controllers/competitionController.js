const Competition = require('../models/Competition');
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

// Helper function to check if user has access to the competition
const hasAccessToCompetition = (user, competition) => {
  // Handle both old (simple ID) and new (object with id) createdBy structures
  const creatorId = competition.createdBy?.id || competition.createdBy;
  return user.role === 'director' || creatorId?.toString() === user._id.toString();
};

exports.createCompetition = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Get full user information including name
    const User = require('../models/User');
    const fullUser = await User.findById(user._id);

    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle scope field - if scope is 'Other', use the scopeOther field
    const competitionData = { ...req.body };
    if (competitionData.scope === 'Other' && competitionData.scopeOther) {
      competitionData.scope = competitionData.scopeOther;
    }
    delete competitionData.scopeOther; // Remove scopeOther from the data

    const competition = new Competition({
      ...competitionData,
      createdBy: {
        id: user._id,
        name: `${fullUser.firstName} ${fullUser.lastName}`,
        email: fullUser.email
      }
    });
    await competition.save();
    res.status(201).json(competition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCompetitions = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let competitions;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      competitions = await Competition.find();
    } else {
      // Handle both old (simple ID) and new (object with id) createdBy structures
      competitions = await Competition.find({
        $or: [
          { 'createdBy.id': user._id },
          { createdBy: user._id }
        ]
      });
    }
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompetitionById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });

    if (!hasAccessToCompetition(user, competition)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(competition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCompetition = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });

    if (!hasAccessToCompetition(user, competition)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Handle scope field - if scope is 'Other', use the scopeOther field
    const updateData = { ...req.body };
    if (updateData.scope === 'Other' && updateData.scopeOther) {
      updateData.scope = updateData.scopeOther;
    }
    delete updateData.scopeOther; // Remove scopeOther from the data

    const updatedCompetition = await Competition.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedCompetition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCompetition = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });

    if (!hasAccessToCompetition(user, competition)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Competition.findByIdAndDelete(req.params.id);
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
