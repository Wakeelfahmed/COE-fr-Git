const TalkTrainingConference = require('../models/TalkTrainingConference');
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

// Helper function to check if user has access to the event
const hasAccessToEvent = (user, event) => {
  return user.role === 'director' || event.createdBy.toString() === user._id.toString();
};

exports.getAllEvents = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  console.log('=== GET ALL TALK/TRAINING/CONFERENCE ===');
  console.log('User ID:', user._id);
  console.log('User Role:', user.role);
  console.log('Only Mine:', req.query.onlyMine);

  try {
    let events;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      console.log('Fetching all events (director mode)');
      events = await TalkTrainingConference.find();
    } else {
      console.log('Fetching only user events');
      events = await TalkTrainingConference.find({ createdBy: user._id });
    }
    console.log('Events found:', events.length);
    console.log('Events:', events);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  console.log('=== CREATING TALK/TRAINING/CONFERENCE ===');
  console.log('Event Data:', req.body);
  console.log('User ID:', user._id);

  try {
    const event = new TalkTrainingConference({
      ...req.body,
      createdBy: user._id
    });
    const newEvent = await event.save();
    console.log('Event created successfully:', newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const event = await TalkTrainingConference.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!hasAccessToEvent(user, event)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const event = await TalkTrainingConference.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!hasAccessToEvent(user, event)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedEvent = await TalkTrainingConference.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const event = await TalkTrainingConference.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!hasAccessToEvent(user, event)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await TalkTrainingConference.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: error.message });
  }
};
