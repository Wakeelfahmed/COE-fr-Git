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

    // Projects (Industry/Commercial)
    const projectSelectFields = req.body.detailed
      ? 'clientCompany projectTitle projectType startDate endDate status description budget'
      : 'clientCompany projectTitle projectType startDate endDate status';

    const allProjects = await CommercializationProject.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(projectSelectFields);
    allProjects.forEach(p => allActivities.push({
      type: 'Industry/Commercial Project',
      title: p.projectTitle || p.clientCompany || 'N/A',
      clientCompany: p.clientCompany,
      projectTitle: p.projectTitle,
      projectType: p.projectType,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status || 'Active',
      description: p.description,
      budget: p.budget
    }));

    // Publications
    const publicationSelectFields = req.body.detailed
      ? 'title publicationType journalConference authors doi isbn pages volume issue year'
      : 'title publicationType journalConference authors doi';

    const allPublications = await Publication.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(publicationSelectFields);
    allPublications.forEach(p => allActivities.push({
      type: 'Publication',
      title: p.title,
      publicationType: p.publicationType,
      journalConference: p.journalConference,
      authors: p.authors,
      doi: p.doi,
      isbn: p.isbn,
      pages: p.pages,
      volume: p.volume,
      issue: p.issue,
      year: p.year,
      date: p.year ? new Date(p.year, 0, 1) : p.createdAt,
      status: 'Published'
    }));

    // Events
    const eventSelectFields = req.body.detailed
      ? 'activity organizer resourcePerson role otherRole type participantsOfEvent nameOfAttendee date description'
      : 'activity organizer resourcePerson role type participantsOfEvent nameOfAttendee date';

    const allEvents = await Event.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(eventSelectFields);
    allEvents.forEach(e => allActivities.push({
      type: 'Event',
      title: e.activity,
      activity: e.activity,
      organizer: e.organizer,
      resourcePerson: e.resourcePerson,
      role: e.role === 'other' ? e.otherRole : e.role,
      type: e.type,
      participantsOfEvent: e.participantsOfEvent,
      nameOfAttendee: e.nameOfAttendee,
      date: e.date,
      description: e.description,
      status: 'Attended'
    }));

    // Collaborations
    const collaborationSelectFields = req.body.detailed
      ? 'memberOfCoE foreignCollaboratingInstitute durationStart durationEnd currentStatus description'
      : 'memberOfCoE foreignCollaboratingInstitute durationStart currentStatus';

    const allCollaborations = await Collaboration.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(collaborationSelectFields);
    allCollaborations.forEach(c => allActivities.push({
      type: 'Collaboration',
      title: c.memberOfCoE || 'N/A',
      collaboratingInstitute: c.foreignCollaboratingInstitute,
      collaborationType: c.memberOfCoE,
      startDate: c.durationStart,
      endDate: c.durationEnd,
      description: c.description,
      date: c.durationStart || c.createdAt,
      status: c.currentStatus || 'Active'
    }));

    // Patents
    const patentSelectFields = req.body.detailed
      ? 'title patentOrg applicationNumber filingDate patentNumber patentStatus inventors description'
      : 'title patentOrg applicationNumber filingDate patentNumber patentStatus';

    const allPatents = await Patent.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(patentSelectFields);
    allPatents.forEach(p => allActivities.push({
      type: 'Patent',
      title: p.title,
      patentOrg: p.patentOrg,
      applicationNumber: p.applicationNumber,
      filingDate: p.filingDate,
      patentNumber: p.patentNumber,
      patentStatus: p.patentStatus,
      inventors: p.inventors,
      description: p.description,
      date: p.filingDate || p.createdAt,
      status: p.patentStatus || 'Filed'
    }));

    // Fundings
    const fundingSelectFields = req.body.detailed
      ? 'projectTitle fundingSource amount startDate endDate status description'
      : 'projectTitle fundingSource amount startDate endDate status';

    const allFundings = await Funding.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(fundingSelectFields);
    allFundings.forEach(f => allActivities.push({
      type: 'Funding',
      title: f.projectTitle || 'N/A',
      fundingAgency: f.fundingSource,
      amount: f.amount,
      startDate: f.startDate,
      endDate: f.endDate,
      status: f.status || 'Active',
      description: f.description,
      date: f.startDate || f.createdAt
    }));

    // Funding Proposals
    const fundingProposalSelectFields = req.body.detailed
      ? 'projectTitle fundingSource proposedAmount team submissionDate status description'
      : 'projectTitle fundingSource team proposedAmount submissionDate status';

    const allFundingProposals = await FundingProposal.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(fundingProposalSelectFields);
    allFundingProposals.forEach(fp => allActivities.push({
      type: 'Funding Proposal',
      title: fp.projectTitle,
      fundingAgency: fp.fundingSource,
      proposedAmount: fp.proposedAmount,
      teamMembers: fp.team,
      submissionDate: fp.submissionDate,
      status: fp.status || 'Submitted',
      description: fp.description,
      date: fp.submissionDate || fp.createdAt
    }));

    // Achievements
    const achievementSelectFields = req.body.detailed
      ? 'event organizer date description awardType category'
      : 'event organizer date description awardType';

    const allAchievements = await Achievement.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(achievementSelectFields);
    allAchievements.forEach(a => allActivities.push({
      type: 'Achievement',
      title: a.event,
      organizer: a.organizer,
      date: a.date,
      description: a.description,
      awardType: a.awardType,
      category: a.category,
      status: 'Achieved'
    }));

    // Trainings Conducted
    const trainingConductedSelectFields = req.body.detailed
      ? 'organizer resourcePersons date participants duration venue'
      : 'organizer resourcePersons date participants duration';

    const allTrainingsConducted = await TrainingsConducted.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(trainingConductedSelectFields);
    allTrainingsConducted.forEach(tc => allActivities.push({
      type: 'Training Conducted',
      title: tc.organizer ? `Organizer: ${tc.organizer}` : 'N/A',
      resourcePersons: tc.resourcePersons,
      date: tc.date,
      participants: tc.participants,
      duration: tc.duration,
      venue: tc.venue,
      status: 'Conducted'
    }));

    // Internships
    const internshipSelectFields = req.body.detailed
      ? 'applicantName centerName year duration stipend location'
      : 'applicantName centerName year duration';

    const allInternships = await Intership.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(internshipSelectFields);
    allInternships.forEach(i => allActivities.push({
      type: 'Internship',
      title: i.applicantName ? `Applicant: ${i.applicantName}` : 'N/A',
      centerName: i.centerName,
      year: i.year,
      duration: i.duration,
      stipend: i.stipend,
      location: i.location,
      date: new Date(i.year, 0, 1), // Convert year to date
      status: 'Active'
    }));

    // Talks/Trainings Attended
    const talkTrainingSelectFields = req.body.detailed
      ? 'title resourcePerson date venue duration certificate'
      : 'title resourcePerson date venue duration';

    const allTalksTrainings = await TalkTrainingConference.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(talkTrainingSelectFields);
    allTalksTrainings.forEach(tt => allActivities.push({
      type: 'TalkTrainingConference',
      title: tt.title,
      resourcePerson: tt.resourcePerson,
      date: tt.date,
      venue: tt.venue,
      duration: tt.duration,
      certificate: tt.certificate,
      status: 'Attended'
    }));

    // Competitions
    const competitionSelectFields = req.body.detailed
      ? 'title organizer date position prize category'
      : 'title organizer date position prize';

    const allCompetitions = await Competition.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 }).select(competitionSelectFields);
    allCompetitions.forEach(c => allActivities.push({
      type: 'Competition',
      title: c.title,
      organizer: c.organizer,
      date: c.date,
      position: c.position,
      prize: c.prize,
      category: c.category,
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