const CommercializationProject = require('../models/CommercializationProject');
const jwt = require('jsonwebtoken');

// Helper function to get user info from token
const getUserFromToken = (req) => {
  const token = req.cookies.token;
  // console.log('=== TOKEN DEBUG ===');
  // console.log('Token from cookies:', token ? 'PRESENT' : 'MISSING');
  if (!token) return null;

  try {
    // console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Token verified successfully for user:', decoded._id);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
};

// Helper function to check if user has access to the project
const hasAccessToProject = (user, project) => {
  // Handle both old (simple ID) and new (object with id) createdBy structures
  const creatorId = project.createdBy?.id || project.createdBy;
  return user.role === 'director' || creatorId?.toString() === user._id.toString();
};

exports.createProject = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Get full user information including name
    const User = require('../models/User');
    const fullUser = await User.findById(user._id);

    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const project = new CommercializationProject({
      ...req.body,
      createdBy: {
        id: user._id,
        name: `${fullUser.firstName} ${fullUser.lastName}`,
        email: fullUser.email
      }
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let projects;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      projects = await CommercializationProject.find();
      // console.log("\n\n All projects: \n", projects, "\n\n")
    } else {
      // console.log('Fetching only user projects');
      // Handle both old (simple ID) and new (object with id) createdBy structures
      projects = await CommercializationProject.find({
        $or: [
          { 'createdBy.id': user._id },
          { createdBy: user._id }
        ]
      });
      console.log("\n\n My projects: \n", projects, "\n\n")
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const project = await CommercializationProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!hasAccessToProject(user, project)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const project = await CommercializationProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!hasAccessToProject(user, project)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedProject = await CommercializationProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const project = await CommercializationProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!hasAccessToProject(user, project)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await CommercializationProject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};