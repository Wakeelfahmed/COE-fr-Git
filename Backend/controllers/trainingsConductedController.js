const TrainingsConducted = require('../models/TrainingsConducted');
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

// Helper function to check if user has access to the training
const hasAccessToTraining = (user, training) => {
  // Handle both old (simple ID) and new (object with id) createdBy structures
  const creatorId = training.createdBy?.id || training.createdBy;
  return user.role === 'director' || creatorId?.toString() === user._id.toString();
};

exports.getAllTrainingsConducted = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // console.log('=== GET ALL TRAININGS CONDUCTED ===');
  // console.log('User ID:', user._id);
  // console.log('User Role:', user.role);
  // console.log('Only Mine:', req.query.onlyMine);

  try {
    let trainings;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      // console.log('Fetching all trainings conducted (director mode)');
      trainings = await TrainingsConducted.find();
    } else {
      // console.log('Fetching only user trainings conducted');
      // Handle both old (simple ID) and new (object with id) createdBy structures
      trainings = await TrainingsConducted.find({
        $or: [
          { 'createdBy.id': user._id },
          { createdBy: user._id }
        ]
      });
    }
    // console.log('Trainings conducted found:', trainings.length);
    // console.log('Trainings conducted:', trainings);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings conducted:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createTrainingsConducted = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // console.log('=== CREATING TRAININGS CONDUCTED ===');
  // console.log('Training Data:', req.body);
  // console.log('User ID:', user._id);

  try {
    // Get full user information including name
    const User = require('../models/User');
    const fullUser = await User.findById(user._id);

    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const training = new TrainingsConducted({
      ...req.body,
      createdBy: {
        id: user._id,
        name: `${fullUser.firstName} ${fullUser.lastName}`,
        email: fullUser.email
      }
    });
    const newTraining = await training.save();
    console.log('Training conducted created successfully:', newTraining);
    res.status(201).json(newTraining);
  } catch (error) {
    console.error('Error creating training conducted:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getTrainingsConductedById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const training = await TrainingsConducted.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training conducted not found' });

    if (!hasAccessToTraining(user, training)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(training);
  } catch (error) {
    console.error('Error fetching training conducted:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTrainingsConducted = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const training = await TrainingsConducted.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training conducted not found' });

    if (!hasAccessToTraining(user, training)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTraining = await TrainingsConducted.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTraining);
  } catch (error) {
    console.error('Error updating training conducted:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTrainingsConducted = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const training = await TrainingsConducted.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training conducted not found' });

    if (!hasAccessToTraining(user, training)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await TrainingsConducted.findByIdAndDelete(req.params.id);
    res.json({ message: 'Training conducted deleted successfully' });
  } catch (error) {
    console.error('Error deleting training conducted:', error);
    res.status(500).json({ message: error.message });
  }
};
