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

    // Import all models
    const CommercializationProject = require('../models/CommercializationProject');
    const Publication = require('../models/Publication');
    const Event = require('../models/Event');
    const Collaboration = require('../models/Collaboration');
    const Patent = require('../models/Patent');
    const Funding = require('../models/Funding');
    const FundingProposal = require('../models/FundingProposal');
    const Achievement = require('../models/Achievement');
    const TrainingsConducted = require('../models/TrainingsConducted');
    const Intership = require('../models/Intership');
    const TalkTrainingConference = require('../models/TalkTrainingConference');
    const Competition = require('../models/Competition');

    // Get activity counts from all collections
    const [
      projectCount,
      publicationCount,
      eventCount,
      collaborationCount,
      patentCount,
      fundingCount,
      fundingProposalCount,
      achievementCount,
      trainingConductedCount,
      internshipCount,
      talkTrainingConferenceCount,
      competitionCount
    ] = await Promise.all([
      CommercializationProject.countDocuments({ 'createdBy.id': accountId }),
      Publication.countDocuments({ 'createdBy.id': accountId }),
      Event.countDocuments({ 'createdBy.id': accountId }),
      Collaboration.countDocuments({ 'createdBy.id': accountId }),
      Patent.countDocuments({ 'createdBy.id': accountId }),
      Funding.countDocuments({ 'createdBy.id': accountId }),
      FundingProposal.countDocuments({ 'createdBy.id': accountId }),
      Achievement.countDocuments({ 'createdBy.id': accountId }),
      TrainingsConducted.countDocuments({ 'createdBy.id': accountId }),
      Intership.countDocuments({ 'createdBy.id': accountId }),
      TalkTrainingConference.countDocuments({ 'createdBy.id': accountId }),
      Competition.countDocuments({ 'createdBy.id': accountId })
    ]);

    // Get all activities from each category
    const allActivities = [];

    // Projects
    const allProjects = await CommercializationProject.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('projectTitle clientCompany dateOfContractSign createdAt');
    allProjects.forEach(p => allActivities.push({
      type: 'Industry/Commercial Project',
      title: p.projectTitle,
      clientCompany: p.clientCompany,
      date: p.dateOfContractSign,
      status: 'Active'
    }));

    // Publications
    const allPublications = await Publication.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('author publicationDetails typeOfPublication dateOfPublication');
    allPublications.forEach(p => allActivities.push({
      type: 'Publication',
      title: p.author || 'N/A',
      publicationType: p.typeOfPublication,
      date: p.dateOfPublication || p.createdAt,
      status: 'Published'
    }));

    // Events
    const allEvents = await Event.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('activity organizer date');
    allEvents.forEach(e => allActivities.push({
      type: 'Event',
      title: e.activity,
      organizer: e.organizer,
      date: e.date,
      status: 'Attended'
    }));

    // Collaborations
    const allCollaborations = await Collaboration.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('memberOfCoE foreignCollaboratingInstitute durationStart currentStatus');
    allCollaborations.forEach(c => allActivities.push({
      type: 'Collaboration',
      title: c.memberOfCoE || 'N/A',
      collaboratingInstitute: c.foreignCollaboratingInstitute,
      date: c.durationStart || c.createdAt,
      status: c.currentStatus || 'Active'
    }));

    // Patents
    const allPatents = await Patent.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('title patentOrg dateOfSubmission');
    allPatents.forEach(p => allActivities.push({
      type: 'Patent',
      title: p.title,
      patentOrg: p.patentOrg,
      date: p.dateOfSubmission,
      status: 'Filed'
    }));

    // Fundings
    const allFundings = await Funding.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('projectTitle fundingSource dateOfSubmission');
    allFundings.forEach(f => allActivities.push({
      type: 'Funding',
      title: f.projectTitle || 'N/A',
      fundingAgency: f.fundingSource,
      date: f.dateOfSubmission,
      status: 'Active'
    }));

    // Funding Proposals
    const allFundingProposals = await FundingProposal.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('projectTitle fundingSource team dateOfSubmission status');
    allFundingProposals.forEach(fp => allActivities.push({
      type: 'Funding Proposal',
      title: fp.projectTitle,
      fundingAgency: fp.team,
      date: fp.dateOfSubmission,
      status: fp.status || 'Submitted'
    }));

    // Achievements
    const allAchievements = await Achievement.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('event organizer date');
    allAchievements.forEach(a => allActivities.push({
      type: 'Achievement',
      title: a.event,
      organizer: a.organizer,
      date: a.date,
      status: 'Achieved'
    }));

    // Trainings Conducted
    const allTrainingsConducted = await TrainingsConducted.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('organizer resourcePersons date');
    allTrainingsConducted.forEach(tc => allActivities.push({
      type: 'Training Conducted',
      title: tc.organizer,
      resourcePersons: tc.resourcePersons,
      date: tc.date,
      status: 'Conducted'
    }));

    // Internships
    const allInternships = await Intership.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('applicantName centerName year');
    allInternships.forEach(i => allActivities.push({
      type: 'Internship',
      title: i.applicantName,
      centerName: i.centerName,
      date: new Date(i.year, 0, 1), // Convert year to date
      status: 'Active'
    }));

    // Talks/Trainings Attended
    const allTalksTrainings = await TalkTrainingConference.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('title resourcePerson date');
    allTalksTrainings.forEach(tt => allActivities.push({
      type: 'TalkTrainingConference',
      title: tt.title,
      resourcePerson: tt.resourcePerson,
      date: tt.date,
      status: 'Attended'
    }));

    // Competitions
    const allCompetitions = await Competition.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select('title organizer date');
    allCompetitions.forEach(c => allActivities.push({
      type: 'Competition',
      title: c.title,
      organizer: c.organizer,
      date: c.date,
      status: 'Participated'
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
        totalActivities: projectCount + publicationCount + eventCount + collaborationCount +
                        patentCount + fundingCount + fundingProposalCount + achievementCount +
                        trainingConductedCount + internshipCount + talkTrainingConferenceCount + competitionCount,
        projects: projectCount,
        publications: publicationCount,
        collaborations: collaborationCount,
        events: eventCount,
        patents: patentCount,
        fundings: fundingCount,
        fundingProposals: fundingProposalCount,
        achievements: achievementCount,
        trainingsConducted: trainingConductedCount,
        internships: internshipCount,
        talkTrainingConference: talkTrainingConferenceCount,
        competitions: competitionCount
      },
      allActivities: allActivities
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error generating account report:', error);
    res.status(500).json({ error: 'Failed to generate account report' });
  }
};