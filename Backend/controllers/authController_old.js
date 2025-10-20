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




exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is director
    if (req.user.role !== 'director') {
      return res.status(403).json({ error: 'Director access required' });
    }

    const users = await User.find({}, '-password').sort({ firstName: 1, lastName: 1 });
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateDirectorReport = async (req, res) => {
  try {
    // Check if user is director
    if (req.user.role !== 'director') {
      return res.status(403).json({ error: 'Director access required' });
    }

    const { targetUserId, generatedBy } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Create a comprehensive report for the target user
    const reportData = {
      targetUser: {
        id: targetUser._id,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        role: targetUser.role,
        joinDate: targetUser.joinDate
      },
      generatedBy: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role
      },
      generatedAt: new Date(),
      reportType: 'director_user_report'
    };

    // In a real implementation, you would generate comprehensive reports
    // For now, we'll just return the user data
    res.json({
      message: 'Director report generated successfully',
      accountName: `${targetUser.firstName} ${targetUser.lastName}`,
      reportData
    });

  } catch (error) {
    console.error('Director report generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};