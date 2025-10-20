const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      contactNumber,
      address,
      uid
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { uid }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or UID already exists' });
    }

    const user = new User({
      email,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      contactNumber,
      address,
      uid
    });

    await user.save();
    const token = jwt.sign({ _id: user._id, role: role }, process.env.JWT_SECRET);
    
    res.cookie('token', token, { 
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or UID already in use' });
    }
    res.status(500).json({ error: 'An error occurred during signup' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ _id: user._id, role:user.role  }, process.env.JWT_SECRET);
    
    // Set the token as an HTTP-only cookie
    res.cookie('token', token, { 
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
};

// New route to check if user is authenticated
exports.checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      return res.status(401).send({ authenticated: false });
    }

    res.send({ authenticated: true, user });
  } catch (error) {
    res.status(401).send({ authenticated: false });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getAllAccounts = async (req, res) => {
  try {
    const users = await User.find({}).select('firstName lastName email role uid joinDate');
    res.json({ accounts: users });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};


exports.generateAccountReport = async (req, res) => {
  try {
    const { accountId } = req.body;
    const user = await User.findById(accountId);

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get activity counts from different collections
    const CommercializationProject = require('../models/CommercializationProject');
    const Publication = require('../models/Publication');
    const Event = require('../models/Event');
    const Collaboration = require('../models/Collaboration');

    const [
      projectCount,
      publicationCount,
      eventCount,
      collaborationCount
    ] = await Promise.all([
      CommercializationProject.countDocuments({ 'createdBy.id': accountId }),
      Publication.countDocuments({ 'createdBy.id': accountId }),
      Event.countDocuments({ 'createdBy.id': accountId }),
      Collaboration.countDocuments({ 'createdBy.id': accountId })
    ]);

    // Get all activities from each category (not just recent)
    const allActivities = [];

    const allProjects = await CommercializationProject.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('projectTitle createdAt');
    allProjects.forEach(p => allActivities.push({
      type: 'Project',
      title: p.projectTitle,
      date: p.createdAt,
      status: 'Active'
    }));

    const allPublications = await Publication.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('title createdAt');
    allPublications.forEach(p => allActivities.push({
      type: 'Publication',
      title: p.title,
      date: p.createdAt,
      status: 'Published'
    }));

    const allEvents = await Event.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('activity date');
    allEvents.forEach(e => allActivities.push({
      type: 'Event',
      title: e.activity,
      date: e.date,
      status: 'Attended'
    }));

    const allCollaborations = await Collaboration.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('memberOfCoE createdAt');
    allCollaborations.forEach(c => allActivities.push({
      type: 'Collaboration',
      title: c.memberOfCoE,
      date: c.createdAt,
      status: 'Active'
    }));

    // Sort all activities by date (most recent first)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const reportData = {
      account: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        uid: user.uid,
        joinDate: user.joinDate
      },
      summary: {
        totalActivities: projectCount + publicationCount + eventCount + collaborationCount,
        projects: projectCount,
        publications: publicationCount,
        collaborations: collaborationCount,
        events: eventCount
      },
      allActivities: allActivities
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error generating account report:', error);
    res.status(500).json({ error: 'Failed to generate account report' });
  }
};