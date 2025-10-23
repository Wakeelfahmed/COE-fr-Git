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
    // console.log('=== BACKEND LOGIN DEBUG ===');
    // console.log('Login attempt for email:', req.body.email);
    // console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);

    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found in database for email:', email);
      console.log('This might be a Firebase-only user. Login cannot proceed without backend user record.');
      return res.status(401).send({ error: 'User not found. Please contact administrator or sign up first.' });
    }

    if (!(await user.comparePassword(password))) {
      console.log('Invalid password for email:', email);
      return res.status(401).send({ error: 'Invalid login credentials' });
    }

    // console.log('User found:', user.email, 'with role:', user.role);
    const token = jwt.sign({ _id: user._id, role:user.role  }, process.env.JWT_SECRET);
    // console.log('JWT token created successfully');

    // Set the token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    console.log('Cookie set, sending response...');
    res.send({ user });
  } catch (error) {
    console.error('Backend login error:', error);
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

// Sync Firebase user with backend database
exports.syncFirebaseUser = async (req, res) => {
  try {
    // console.log('=== SYNC FIREBASE USER ===');
    const { email, uid, displayName } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ error: 'Email and UID are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { uid }] });

    if (user) {
      // console.log('User already exists in backend:', user.email);
      const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({ user });
    }

    // Create new user record for Firebase user
    console.log('Creating new backend user for Firebase user:', email);

    // Split displayName into first and last name if available
    let firstName = 'Unknown';
    let lastName = 'User';
    if (displayName) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0] || 'Unknown';
      lastName = nameParts.slice(1).join(' ') || 'User';
    }

    user = new User({
      email,
      password: 'firebase-user-' + Date.now(), // Dummy password for Firebase users
      role: 'Researcher/Dev', // Default role
      firstName,
      lastName,
      uid,
      joinDate: new Date()
    });

    await user.save();
    console.log('Backend user created successfully');

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Sync Firebase user error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
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
    const { accountId } = req.params; // Get accountId from route parameter
    const { detailed } = req.query; // Check for detailed parameter
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

    // If detailed report is requested, return full data
    if (detailed === 'true') {
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
        }
      };

      // Get all detailed data for each collection
      const [
        projects,
        publications,
        events,
        collaborations,
        patents,
        fundings,
        fundingProposals,
        achievements,
        trainingsConducted,
        internships,
        talkTrainings,
        competitions
      ] = await Promise.all([
        CommercializationProject.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Publication.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Event.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Collaboration.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Patent.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Funding.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        FundingProposal.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Achievement.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        TrainingsConducted.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Intership.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        TalkTrainingConference.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 }),
        Competition.find({ 'createdBy.id': accountId }).sort({ createdAt: -1 })
      ]);

      // Add detailed data to report
      if (projects.length > 0) reportData.projects = projects;
      if (publications.length > 0) reportData.publications = publications;
      if (events.length > 0) reportData.events = events;
      if (collaborations.length > 0) reportData.collaborations = collaborations;
      if (patents.length > 0) reportData.patents = patents;
      if (fundings.length > 0) reportData.fundings = fundings;
      if (fundingProposals.length > 0) reportData.fundingProposals = fundingProposals;
      if (achievements.length > 0) reportData.achievements = achievements;
      if (trainingsConducted.length > 0) reportData.trainingsConducted = trainingsConducted;
      if (internships.length > 0) reportData.internships = internships;
      if (talkTrainings.length > 0) reportData.talkTrainings = talkTrainings;
      if (competitions.length > 0) reportData.competitions = competitions;

      return res.json(reportData);
    }

    // Original summary format for non-detailed reports
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
      .sort({ createdAt: -1 });
    allEvents.forEach(e => allActivities.push({
      type: 'Event',
      title: e.activity,
      organizer: e.organizer,
      resourcePerson: e.resourcePerson,
      role: e.role,
      otherRole: e.otherRole,
      eventType: e.type,
      participants: e.participantsOfEvent,
      nameOfAttendee: e.nameOfAttendee,
      date: e.date,
      status: 'Attended'
    }));

    // Collaborations
    const allCollaborations = await Collaboration.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allCollaborations.forEach(c => allActivities.push({
      type: 'Collaboration',
      title: c.memberOfCoE || 'N/A',
      memberOfCoE: c.memberOfCoE,
      collaboratingForeignResearcher: c.collaboratingForeignResearcher,
      foreignCollaboratingInstitute: c.foreignCollaboratingInstitute,
      collaborationScope: c.collaborationScope,
      collaboratingCountry: c.collaboratingCountry,
      typeOfCollaboration: c.typeOfCollaboration,
      otherTypeDescription: c.otherTypeDescription,
      durationStart: c.durationStart,
      durationEnd: c.durationEnd,
      currentStatus: c.currentStatus,
      keyOutcomes: c.keyOutcomes,
      detailsOfOutcome: c.detailsOfOutcome,
      date: c.durationStart || c.createdAt,
      status: c.currentStatus || 'Active'
    }));

    // Patents
    const allPatents = await Patent.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allPatents.forEach(p => allActivities.push({
      type: 'Patent',
      title: p.title,
      inventor: p.inventor,
      coInventor: p.coInventor,
      patentOrg: p.patentOrg,
      affiliationOfCoInventor: p.affiliationOfCoInventor,
      dateOfSubmission: p.dateOfSubmission,
      scope: p.scope,
      directoryNumber: p.directoryNumber,
      patentNumber: p.patentNumber,
      dateOfApproval: p.dateOfApproval,
      targetSDG: p.targetSDG,
      date: p.dateOfSubmission,
      status: 'Filed'
    }));

    // Fundings
    const allFundings = await Funding.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allFundings.forEach(f => allActivities.push({
      type: 'Funding',
      title: f.projectTitle || 'N/A',
      projectTitle: f.projectTitle,
      pi: f.pi,
      researchTeam: f.researchTeam,
      dateOfSubmission: f.dateOfSubmission,
      dateOfApproval: f.dateOfApproval,
      fundingSource: f.fundingSource,
      pkr: f.pkr,
      team: f.team,
      status: f.status,
      closingDate: f.closingDate,
      targetSDG: f.targetSDG,
      date: f.dateOfSubmission
    }));

    // Funding Proposals
    const allFundingProposals = await FundingProposal.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allFundingProposals.forEach(fp => allActivities.push({
      type: 'Funding Proposal',
      title: fp.projectTitle,
      projectTitle: fp.projectTitle,
      pi: fp.pi,
      researchTeam: fp.researchTeam,
      dateOfSubmission: fp.dateOfSubmission,
      fundingSource: fp.fundingSource,
      pkr: fp.pkr,
      team: fp.team,
      status: fp.status,
      targetSDG: fp.targetSDG,
      date: fp.dateOfSubmission
    }));

    // Achievements
    const allAchievements = await Achievement.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allAchievements.forEach(a => allActivities.push({
      type: 'Achievement',
      title: a.event,
      event: a.event,
      organizer: a.organizer,
      date: a.date,
      participantOfEvent: a.participantOfEvent,
      participantFromCoEAI: a.participantFromCoEAI,
      roleOfParticipantFromCoEAI: a.roleOfParticipantFromCoEAI,
      detailsOfAchievement: a.detailsOfAchievement,
      status: 'Achieved'
    }));

    // Trainings Conducted
    const allTrainingsConducted = await TrainingsConducted.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allTrainingsConducted.forEach(tc => allActivities.push({
      type: 'Training Conducted',
      title: tc.organizer ? `Organizer: ${tc.organizer}` : 'N/A',
      attendees: tc.attendees,
      numberOfAttendees: tc.numberOfAttendees,
      organizer: tc.organizer,
      resourcePersons: tc.resourcePersons,
      date: tc.date,
      targetSDG: tc.targetSDG,
      totalRevenueGenerated: tc.totalRevenueGenerated,
      status: 'Conducted'
    }));

    // Internships
    const allInternships = await Intership.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allInternships.forEach(i => allActivities.push({
      type: 'Internship',
      title: i.applicantName ? `Applicant: ${i.applicantName}` : 'N/A',
      year: i.year,
      duration: i.duration,
      certificateNumber: i.certificateNumber,
      applicantName: i.applicantName,
      officialEmail: i.officialEmail,
      contactNumber: i.contactNumber,
      affiliation: i.affiliation,
      centerName: i.centerName,
      supervisor: i.supervisor,
      tasksCompleted: i.tasksCompleted,
      date: new Date(i.year, 0, 1), // Convert year to date
      status: 'Active'
    }));

    // Talks/Trainings Attended
    const allTalksTrainings = await TalkTrainingConference.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allTalksTrainings.forEach(tt => allActivities.push({
      type: 'TalkTrainingConference',
      title: tt.title,
      eventType: tt.type,
      resourcePerson: tt.resourcePerson,
      participants: tt.participants,
      mode: tt.mode,
      date: tt.date,
      targetSDG: tt.targetSDG,
      agenda: tt.agenda,
      followUpActivity: tt.followUpActivity,
      status: 'Attended'
    }));

    // Competitions
    const allCompetitions = await Competition.find({ 'createdBy.id': accountId })
      .sort({ createdAt: -1 });
    allCompetitions.forEach(c => allActivities.push({
      type: 'Competition',
      title: c.title,
      organizer: c.organizer,
      date: c.date,
      participants: c.participants,
      scope: c.scope,
      scopeOther: c.scopeOther,
      participantsFromBU: c.participantsFromBU,
      prizeMoney: c.prizeMoney,
      details: c.details,
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