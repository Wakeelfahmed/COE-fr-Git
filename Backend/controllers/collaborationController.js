const Collaboration = require('../models/Collaboration');
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

// Helper function to check if user has access to the collaboration
const hasAccessToCollaboration = (user, collaboration) => {
  // Handle both old (simple ID) and new (object with id) createdBy structures
  const creatorId = collaboration.createdBy?.id || collaboration.createdBy;
  return user.role === 'director' || creatorId?.toString() === user._id.toString();
};

exports.createCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Get full user information including name
    const User = require('../models/User');
    const fullUser = await User.findById(user._id);

    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const collaboration = new Collaboration({
      ...req.body,
      createdBy: {
        id: user._id,
        name: `${fullUser.firstName} ${fullUser.lastName}`,
        email: fullUser.email
      }
    });
    await collaboration.save();
    res.status(201).json(collaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCollaborations = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let collaborations;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      collaborations = await Collaboration.find();
    } else {
      // Handle both old (simple ID) and new (object with id) createdBy structures
      collaborations = await Collaboration.find({
        $or: [
          { 'createdBy.id': user._id },
          { createdBy: user._id }
        ]
      });
    }

    // Apply filters if provided
    const {
      memberOfCoE,
      collaboratingForeignResearcher,
      collaboratingCountry,
      currentStatus,
      collaborationScope,
      accountFilter,
      dateFrom,
      dateTo
    } = req.query;

    // Apply text filters
    if (memberOfCoE) {
      collaborations = collaborations.filter(collab =>
        (collab.memberOfCoE || '').toLowerCase().includes(memberOfCoE.toLowerCase())
      );
    }

    if (collaboratingForeignResearcher) {
      collaborations = collaborations.filter(collab =>
        (collab.collaboratingForeignResearcher || '').toLowerCase().includes(collaboratingForeignResearcher.toLowerCase())
      );
    }

    if (currentStatus) {
      collaborations = collaborations.filter(collab =>
        (collab.currentStatus || '').toLowerCase().includes(currentStatus.toLowerCase())
      );
    }

    // Apply scope filter
    if (collaborationScope) {
      collaborations = collaborations.filter(collab =>
        (collab.collaborationScope || 'foreign') === collaborationScope
      );
    }

    // Apply country filter (only for foreign collaborations)
    if (collaboratingCountry) {
      collaborations = collaborations.filter(collab =>
        (collab.collaboratingCountry || '').toLowerCase().includes(collaboratingCountry.toLowerCase())
      );
    }

    // Apply account filter (director only)
    if (accountFilter && user.role === 'director') {
      collaborations = collaborations.filter(collab =>
        collab.createdBy?.id === accountFilter
      );
    }

    // Apply date filters
    if (dateFrom || dateTo) {
      collaborations = collaborations.filter(collab => {
        const collabDate = collab.durationStart ? new Date(collab.durationStart) : null;
        if (!collabDate) return false;

        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && collabDate < fromDate) return false;
        if (toDate && collabDate > toDate) return false;

        return true;
      });
    }

    res.json(collaborations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCollaborationById = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(collaboration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCollaboration = await Collaboration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCollaboration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCollaboration = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });

    if (!hasAccessToCollaboration(user, collaboration)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Collaboration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collaboration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
