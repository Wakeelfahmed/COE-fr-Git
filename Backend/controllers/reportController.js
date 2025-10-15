const CustomReport = require('../models/Report');
const Publication = require('../models/Publication');
const Event = require('../models/Event');
const CommercializationProject = require('../models/CommercializationProject');
const Funding = require('../models/Funding');
const Internship = require('../models/Intership');
const Patent = require('../models/Patent');
const Training = require('../models/Training');
const jwt = require('jsonwebtoken');


const getUserFromToken = (req) => {
    // console.log("this is running...")
    const token = req.cookies.token;
    // console.log("Token: ", token)
    if (!token) return null;
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.log(error)
      return null;
    }
};

function buildFilterCriteria(filter) {
    const filterCriteria = {};
  
    // Loop over each key in the filter object
    Object.keys(filter).forEach(key => {
      const value = filter[key];
      
      // Only add the key-value pair if it's not empty, null, or undefined
      if (value !== '' && value !== null && value !== undefined) {
        filterCriteria[key] = value;
      }
    });
  
    return filterCriteria;
  }
  

exports.createReport = async (req, res) => {
  try {
    const { title, sourceType, filterCriteria } = req.body;

    filter = buildFilterCriteria(filterCriteria)

    console.log("filtercriteria", filter)

    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const createdBy = user._id; // Assuming you have user authentication middleware

    let reportData;
    switch (sourceType) {
      case 'Publications':
        reportData = await Publication.find(filter);
        console.log("pub is running...")
        console.log("data: ", reportData)
        break;
      case 'Events':
        reportData = await Event.find(filter);
        break;
      case 'CommercializationProjects':
        reportData = await CommercializationProject.find(filter);
        break;
      case 'Fundings':
        reportData = await Funding.find(filter);
        break;
      case 'Internships':
        reportData = await Internship.find(filter);
        break;
      case 'Patents':
        reportData = await Patent.find(filter);
        break;
      case 'Trainings':
        reportData = await Training.find(filter);
        break;
      default:
        return res.status(400).json({ message: 'Invalid source type' });
    }

    const newReport = new CustomReport({
      title,
      createdBy,
      sourceType,
      filterCriteria: filter,
      reportData
    });

    await newReport.save();
    res.status(201).json({ message: 'Report created successfully', report: newReport });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let reports;
    if (user.role === 'director' && req.query.onlyMine !== 'true') {
      reports = await CustomReport.find().sort({ createdAt: -1 });
    } else {
      reports = await CustomReport.find({ createdBy: user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};
  
  exports.getReportById = async (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });


    try {
      const report = await CustomReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
  };
  
  exports.updateReport = async (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });


    try {
      const { title, filterCriteria, reportData } = req.body;
      const updatedReport = await CustomReport.findByIdAndUpdate(
        req.params.id,
        { title, filterCriteria, reportData, updatedAt: Date.now() },
        { new: true }
      );
      if (!updatedReport) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.status(200).json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
      res.status(500).json({ message: 'Error updating report', error: error.message });
    }
  };
  
  exports.deleteReport = async (req, res) => {

    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const deletedReport = await CustomReport.findByIdAndDelete(req.params.id);
      if (!deletedReport) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting report', error: error.message });
    }
  };