const Internship = require('../models/Intership');
const TalkTrainingConference = require('../models/TalkTrainingConference');
const Funding = require('../models/Funding');
const Patent = require('../models/Patent');
const Publication = require('../models/Publication');
const Event = require('../models/Event');
const Achievement = require('../models/Achievement');
const Collaboration = require('../models/Collaboration');
const CommercializationProject = require('../models/CommercializationProject');
const TrainingsConducted = require('../models/TrainingsConducted');
const FundingProposal = require('../models/FundingProposal');
const Competition = require('../models/Competition');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to calculate object size in KB
const calculateObjectSize = (obj) => {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8') / 1024;
};

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

// Helper function to format table names for display
const formatTableName = (tableName) => {
  const nameMap = {
    'talkTrainingConference': 'Talks/Training Conference',
    'fundingProposals': 'Funding Proposals',
    'commercializationProjects': 'Commercialization Projects',
    'trainingsConducted': 'Trainings Conducted',
    'trainings': 'Trainings'
  };

  return nameMap[tableName] || tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/([A-Z])/g, ' $1');
};

// Get comprehensive data usage analytics
exports.getDataUsageAnalytics = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // Only directors can access detailed analytics
  if (user.role !== 'director') {
    return res.status(403).json({ message: 'Access denied. Only directors can view analytics.' });
  }

  try {
    const models = {
      internships: Internship,
      talkTrainingConference: TalkTrainingConference,
      fundings: Funding,
      fundingProposals: FundingProposal,
      patents: Patent,
      publications: Publication,
      events: Event,
      achievements: Achievement,
      competitions: Competition,
      collaborations: Collaboration,
      commercializationProjects: CommercializationProject,
      trainingsConducted: TrainingsConducted,
    };

    const analytics = {
      totalUsers: 0,
      totalRecords: 0,
      totalDataSize: 0,
      averageRecordSize: 0,
      tableStats: {},
      userStats: [],
      createdAt: new Date()
    };

    // Get all users
    const users = await User.find({}, 'firstName lastName email role');
    analytics.totalUsers = users.length;

    // Calculate statistics for each table
    for (const [tableName, model] of Object.entries(models)) {
      const records = await model.find({});
      const recordCount = records.length;

      if (recordCount > 0) {
        // Calculate total size and average size for this table
        const totalSize = records.reduce((sum, record) => sum + calculateObjectSize(record), 0);
        const avgSize = totalSize / recordCount;

        analytics.tableStats[tableName] = {
          count: recordCount,
          totalSize: Math.round(totalSize * 100) / 100, // Round to 2 decimal places
          averageSize: Math.round(avgSize * 100) / 100,
          tableName: formatTableName(tableName)
        };

        analytics.totalRecords += recordCount;
        analytics.totalDataSize += totalSize;
      } else {
        analytics.tableStats[tableName] = {
          count: 0,
          totalSize: 0,
          averageSize: 0,
          tableName: formatTableName(tableName)
        };
      }
    }

    // Calculate overall average record size
    if (analytics.totalRecords > 0) {
      analytics.averageRecordSize = Math.round((analytics.totalDataSize / analytics.totalRecords) * 100) / 100;
    }

    // Calculate per-user statistics
    for (const user of users) {
      const userStat = {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        totalRecords: 0,
        totalSize: 0,
        tableBreakdown: {}
      };

      // Count records for each table for this user
      for (const [tableName, model] of Object.entries(models)) {
        let userRecords;

        // Check if the model has createdBy field (Training model doesn't have it)
        if (tableName === 'trainings') {
          // For Training model, count all records (not user-specific)
          userRecords = await model.find({});
          userStat.tableBreakdown[tableName] = {
            count: userRecords.length,
            totalSize: userRecords.length > 0 ? Math.round(userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) * 100) / 100 : 0,
            averageSize: userRecords.length > 0 ? Math.round((userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) / userRecords.length) * 100) / 100 : 0,
            tableName: formatTableName(tableName),
            note: 'System-wide records (not user-specific)'
          };
          if (userRecords.length > 0) {
            userStat.totalRecords += userRecords.length;
            userStat.totalSize += userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0);
          }
        } else {
          // For models with createdBy field
          userRecords = await model.find({
            $or: [
              { 'createdBy.id': user._id },
              { createdBy: user._id }
            ]
          });

          if (userRecords.length > 0) {
            const tableSize = userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0);
            userStat.tableBreakdown[tableName] = {
              count: userRecords.length,
              totalSize: Math.round(tableSize * 100) / 100,
              averageSize: Math.round((tableSize / userRecords.length) * 100) / 100,
              tableName: formatTableName(tableName)
            };
            userStat.totalRecords += userRecords.length;
            userStat.totalSize += tableSize;
          } else {
            userStat.tableBreakdown[tableName] = {
              count: 0,
              totalSize: 0,
              averageSize: 0,
              tableName: formatTableName(tableName)
            };
          }
        }
      }

      if (userStat.totalRecords > 0) {
        userStat.totalSize = Math.round(userStat.totalSize * 100) / 100;
        analytics.userStats.push(userStat);
      }
    }

    // Sort user stats by total records (descending)
    analytics.userStats.sort((a, b) => b.totalRecords - a.totalRecords);

    res.json(analytics);
  } catch (error) {
    console.error('Error in getDataUsageAnalytics:', error);
    res.status(500).json({ message: 'Error fetching analytics data', error: error.message });
  }
};

// Get table-specific analytics
exports.getTableAnalytics = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (user.role !== 'director') {
    return res.status(403).json({ message: 'Access denied. Only directors can view analytics.' });
  }

  const { tableName } = req.params;

  try {
    const models = {
      internships: Internship,
      talkTrainingConference: TalkTrainingConference,
      fundings: Funding,
      fundingProposals: FundingProposal,
      patents: Patent,
      publications: Publication,
      events: Event,
      achievements: Achievement,
      competitions: Competition,
      collaborations: Collaboration,
      commercializationProjects: CommercializationProject,
      trainingsConducted: TrainingsConducted,
    };

    const model = models[tableName];
    if (!model) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const records = await model.find({});
    const recordCount = records.length;

    let totalSize = 0;
    let avgSize = 0;

    if (recordCount > 0) {
      totalSize = records.reduce((sum, record) => sum + calculateObjectSize(record), 0);
      avgSize = totalSize / recordCount;
    }

    // Get per-user breakdown for this table
    const userBreakdown = {};
    const users = await User.find({});

    for (const user of users) {
      let userRecords;

      // Check if the model has createdBy field (Training model doesn't have it)
      if (tableName === 'trainings') {
        // For Training model, show all records for all users (not user-specific)
        userRecords = await model.find({});
        userBreakdown[user._id.toString()] = {
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          count: userRecords.length,
          totalSize: userRecords.length > 0 ? Math.round(userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) * 100) / 100 : 0,
          averageSize: userRecords.length > 0 ? Math.round((userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) / userRecords.length) * 100) / 100 : 0,
          note: 'System-wide records (not user-specific)'
        };
      } else {
        // For models with createdBy field
        userRecords = await model.find({
          $or: [
            { 'createdBy.id': user._id },
            { createdBy: user._id }
          ]
        });

        if (userRecords.length > 0) {
          const userSize = userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0);
          userBreakdown[user._id.toString()] = {
            userName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            count: userRecords.length,
            totalSize: Math.round(userSize * 100) / 100,
            averageSize: Math.round((userSize / userRecords.length) * 100) / 100
          };
        }
      }
    }

    const tableAnalytics = {
      tableName: formatTableName(tableName),
      totalRecords: recordCount,
      totalSize: Math.round(totalSize * 100) / 100,
      averageSize: Math.round(avgSize * 100) / 100,
      userBreakdown,
      createdAt: new Date()
    };

    res.json(tableAnalytics);
  } catch (error) {
    console.error('Error in getTableAnalytics:', error);
    res.status(500).json({ message: 'Error fetching table analytics', error: error.message });
  }
};

// Get user-specific analytics
exports.getUserAnalytics = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { userId } = req.params;

  // Users can only view their own analytics, directors can view any user's
  if (user.role !== 'director' && userId !== user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const models = {
      internships: Internship,
      talkTrainingConference: TalkTrainingConference,
      fundings: Funding,
      fundingProposals: FundingProposal,
      patents: Patent,
      publications: Publication,
      events: Event,
      achievements: Achievement,
      competitions: Competition,
      collaborations: Collaboration,
      commercializationProjects: CommercializationProject,
      trainingsConducted: TrainingsConducted,
    };

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userAnalytics = {
      userId: targetUser._id,
      userName: `${targetUser.firstName} ${targetUser.lastName}`,
      email: targetUser.email,
      role: targetUser.role,
      totalRecords: 0,
      totalSize: 0,
      tableBreakdown: {},
      createdAt: new Date()
    };

    // Calculate statistics for each table for this user
    for (const [tableName, model] of Object.entries(models)) {
      let userRecords;

      // Check if the model has createdBy field (Training model doesn't have it)
      if (tableName === 'trainings') {
        // For Training model, count all records (not user-specific)
        userRecords = await model.find({});
        userAnalytics.tableBreakdown[tableName] = {
          count: userRecords.length,
          totalSize: userRecords.length > 0 ? Math.round(userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) * 100) / 100 : 0,
          averageSize: userRecords.length > 0 ? Math.round((userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0) / userRecords.length) * 100) / 100 : 0,
          tableName: formatTableName(tableName),
          note: 'System-wide records (not user-specific)'
        };
        if (userRecords.length > 0) {
          userAnalytics.totalRecords += userRecords.length;
          userAnalytics.totalSize += userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0);
        }
      } else {
        // For models with createdBy field
        userRecords = await model.find({
          $or: [
            { 'createdBy.id': targetUser._id },
            { createdBy: targetUser._id }
          ]
        });

        if (userRecords.length > 0) {
          const tableSize = userRecords.reduce((sum, record) => sum + calculateObjectSize(record), 0);
          userStat.tableBreakdown[tableName] = {
            count: userRecords.length,
            totalSize: Math.round(tableSize * 100) / 100,
            averageSize: Math.round((tableSize / userRecords.length) * 100) / 100,
            tableName: formatTableName(tableName)
          };
          userStat.totalRecords += userRecords.length;
          userStat.totalSize += tableSize;
        } else {
          userStat.tableBreakdown[tableName] = {
            count: 0,
            totalSize: 0,
            averageSize: 0,
            tableName: formatTableName(tableName)
          };
        }
      }
    }

    userAnalytics.totalSize = Math.round(userAnalytics.totalSize * 100) / 100;

    res.json(userAnalytics);
  } catch (error) {
    console.error('Error in getUserAnalytics:', error);
    res.status(500).json({ message: 'Error fetching user analytics', error: error.message });
  }
};
