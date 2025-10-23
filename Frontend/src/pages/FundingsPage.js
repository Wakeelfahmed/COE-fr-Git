import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";
import AccountFilter from '../components/AccountFilter';

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const uploadPdf = async (file, userId) => {
  if (!file) return;
  try {
    const fileRef = ref(storage, `pdfs/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log("File uploaded successfully. Download URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const deletePdf = async (userId, fileName) => {
  try {
    const fileRef = ref(storage, `pdfs/${userId}/${fileName}`);
    try {
      await getMetadata(fileRef);
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log("File doesn't exist, skipping delete operation");
        return;
      }
      throw error;
    }
    await deleteObject(fileRef);
    console.log("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

const FundingsView = () => {
  const [fundedProjects, setFundedProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFundedProject, setCurrentFundedProject] = useState({
    projectTitle: '',
    pi: '',
    coPI: '',
    dateOfSubmission: '',
    dateOfApproval: '',
    fundingSource: '',
    pkr: '',
    team: '',
    status: '',
    closingDate: '',
    targetSDG: [],
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    projectTitle: '',
    pi: '',
    fundingSource: '',
    team: '',
    dateFrom: '',
    dateTo: '',
    accountFilter: '' // Add account filter
  });
  const [selectedFiles, setSelectedFiles] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleSaveReport = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, {
        title: reportTitle,
        sourceType: 'Fundings',
        filterCriteria
      });
      console.log('Report saved:', response.data);
      setShowReportModal(false);
      setReportTitle('');
      // Optionally, show a success message to the user
    } catch (error) {
      console.error('Error saving report:', error);
      // Optionally, show an error message to the user
    }
  };

  // Helper function to format dates for display (dd-mm-year format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (user) {
      fetchFundedProjects();
    }
  }, [showOnlyMine, user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal) 
{        handleNewFundedProject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal]);

  const fetchFundedProjects = async () => {
    if (!user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }

    try {
      console.log('Fetching funded projects for user:', user.email);
      const response = await axios.get(`${API_BASE_URL}/fundings`, {
        params: { onlyMine: showOnlyMine }
      });
      console.log('Funded projects fetched successfully:', response.data.length);
      setFundedProjects(response.data);
    } catch (error) {
      console.error('Error fetching funded projects:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed, user may need to login again');
        // Optionally redirect to login or show login prompt
      }
      alert('Error fetching funded projects. Please try again.');
    }
  };

  const handleNewFundedProject = () => {
    setIsEditMode(false);
    setCurrentFundedProject({
      projectTitle: '',
      pi: '',
      coPI: '',
      dateOfSubmission: '',
      dateOfApproval: '',
      fundingSource: '',
      pkr: '',
      team: '',
      status: '',
      closingDate: '',
      targetSDG: [],
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditFundedProject = (fundedProject) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentFundedProject({
      ...fundedProject,
      dateOfSubmission: formatDateForInput(fundedProject.dateOfSubmission),
      dateOfApproval: formatDateForInput(fundedProject.dateOfApproval),
      closingDate: formatDateForInput(fundedProject.closingDate)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetSDG') {
      // Handle multiple selections for SDGs
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentFundedProject(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setCurrentFundedProject(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fundedProjectData = {
      ...currentFundedProject,
      pkr: parseFloat(currentFundedProject.pkr)
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/fundings/${currentFundedProject._id}`, fundedProjectData);
      } else {
        await axios.post(`${API_BASE_URL}/fundings`, fundedProjectData);
      }
      setShowModal(false);
      fetchFundedProjects();
    } catch (error) {
      console.error('Error saving funded project:', error);
      alert('Error saving funded project. Please try again.');
    }
  };

  const handleDeleteFundedProject = async (fundingId) => {
    if (window.confirm('Are you sure you want to delete this funded project?')) {
      try {
        await axios.delete(`${API_BASE_URL}/fundings/${fundingId}`);
        fetchFundedProjects();
      } catch (error) {
        console.error('Error deleting funded project:', error);
        alert('Error deleting funded project. Please try again.');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({ ...prev, [name]: value }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setFilterCriteria({
      projectTitle: '',
      pi: '',
      fundingSource: '',
      team: '',
      dateFrom: '',
      dateTo: '',
      accountFilter: ''
    });
  };

  const handleFileChange = (event, fundingId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [fundingId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (fundedProjectId) => {
    const file = selectedFiles[fundedProjectId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/fundings/${fundedProjectId}`, { fileLink: fileUrl });
      
      setFundedProjects(prevFundedProjects => 
        prevFundedProjects.map(fundedProject => 
          fundedProject._id === fundedProjectId ? { ...fundedProject, fileLink: fileUrl } : fundedProject
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[fundedProjectId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (fundedProjectId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/fundings/${fundedProjectId}`, { fileLink: null });
      
      setFundedProjects(prevFundedProjects => 
        prevFundedProjects.map(fundedProject => 
          fundedProject._id === fundedProjectId ? { ...fundedProject, fileLink: null } : fundedProject
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredFundedProjects = fundedProjects.filter(fundedProject => {
    return (fundedProject.projectTitle || '').toLowerCase().includes((filterCriteria.projectTitle || '').toLowerCase()) &&
           (fundedProject.pi || '').toLowerCase().includes((filterCriteria.pi || '').toLowerCase()) &&
           (fundedProject.fundingSource || '').toLowerCase().includes((filterCriteria.fundingSource || '').toLowerCase()) &&
           (fundedProject.team || '').toLowerCase().includes((filterCriteria.team || '').toLowerCase()) &&
           (filterCriteria.dateFrom === '' || fundedProject.dateOfSubmission >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || fundedProject.dateOfSubmission <= filterCriteria.dateTo) &&
           (filterCriteria.accountFilter === '' || (fundedProject.createdBy?.id === filterCriteria.accountFilter));
  });


  





  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Funded Projects</h2>
        <div>
          <button onClick={handleNewFundedProject} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Funded Project
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Funded Projects' : 'My Funded Projects'}
            </button>
          )}
          <button onClick={toggleFilters} className="border border-blue-600 text-blue-600 px-4 py-2 rounded">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-2">
            <input
              type="text"
              placeholder="Filter by Project Title"
              name="projectTitle"
              value={filterCriteria.projectTitle}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by PI"
              name="pi"
              value={filterCriteria.pi}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Team"
              name="team"
              value={filterCriteria.team}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
            <label for="dateFrom">From Submission Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateTo">To Submission Date:</label>
            <input
              type="date"
              placeholder="To Date"
              name="dateTo"
              value={filterCriteria.dateTo}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
          </div>
          <button onClick={clearFilters} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
            Clear Filters
          </button>
          <button onClick={handleGenerateReport} className="bg-green-500 text-white px-4 py-2 rounded ml-2">
            Generate Report
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Co-PI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PKR (M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target SDG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFundedProjects.map((fundedProject, index) => (
              <tr key={fundedProject._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.projectTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.pi}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.coPI}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(fundedProject.dateOfSubmission)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(fundedProject.dateOfApproval)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.fundingSource}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.pkr.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.team}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(fundedProject.closingDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fundedProject.targetSDG ? fundedProject.targetSDG.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {fundedProject.fileLink ? (
                    <div>
                      <a href={fundedProject.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(fundedProject._id, fundedProject.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, fundedProject._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${fundedProject._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${fundedProject._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[fundedProject._id] && (
                        <button onClick={() => handleFileUpload(fundedProject._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileChange(e, fundedProject._id)} 
                          accept=".pdf" 
                          className="hidden" 
                          id={`fileUpload-${fundedProject._id}`} 
                        />
                        <label htmlFor={`fileUpload-${fundedProject._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                        {selectedFiles[fundedProject._id] && (
                          <button onClick={() => handleFileUpload(fundedProject._id)} className="text-green-600 hover:text-green-900">Upload</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEditFundedProject(fundedProject)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button onClick={() => handleDeleteFundedProject(fundedProject._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {isEditMode ? 'Edit Funded Project' : 'New Funded Project'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectTitle">
                      Project Title
                    </label>
                    <input
                      type="text"
                      id="projectTitle"
                      name="projectTitle"
                      value={currentFundedProject.projectTitle}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pi">
                      PI
                    </label>
                    <input
                      type="text"
                      id="pi"
                      name="pi"
                      value={currentFundedProject.pi}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coPI">
                      Co-PI
                    </label>
                    <input
                      type="text"
                      id="coPI"
                      name="coPI"
                      value={currentFundedProject.coPI}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fundingSource">
                      Funding Source
                    </label>
                    <input
                      type="text"
                      id="fundingSource"
                      name="fundingSource"
                      value={currentFundedProject.fundingSource}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pkr">
                      PKR (M)
                    </label>
                    <input
                      type="number"
                      id="pkr"
                      name="pkr"
                      value={currentFundedProject.pkr}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="team">
                      Team <span className="text-gray-500 font-normal">(Comma separated names)</span>
                    </label>
                    <input
                      type="text"
                      id="team"
                      name="team"
                      value={currentFundedProject.team}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                      Status
                    </label>
                    <input
                      type="text"
                      id="status"
                      name="status"
                      value={currentFundedProject.status}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfSubmission">
                      Date of Submission
                    </label>
                    <input
                      type="date"
                      id="dateOfSubmission"
                      name="dateOfSubmission"
                      value={currentFundedProject.dateOfSubmission}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfApproval">
                      Date of Approval
                    </label>
                    <input
                      type="date"
                      id="dateOfApproval"
                      name="dateOfApproval"
                      value={currentFundedProject.dateOfApproval}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="closingDate">
                      Closing Date
                    </label>
                    <input
                      type="date"
                      id="closingDate"
                      name="closingDate"
                      value={currentFundedProject.closingDate}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetSDG">
                    Target SDG
                  </label>
                  <select
                    id="targetSDG"
                    name="targetSDG"
                    multiple
                    value={currentFundedProject.targetSDG}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    style={{ height: '120px' }}
                  >
                    <option value="SDG 1: No Poverty">SDG 1: No Poverty</option>
                    <option value="SDG 2: Zero Hunger">SDG 2: Zero Hunger</option>
                    <option value="SDG 3: Good Health and Well-being">SDG 3: Good Health and Well-being</option>
                    <option value="SDG 4: Quality Education">SDG 4: Quality Education</option>
                    <option value="SDG 5: Gender Equality">SDG 5: Gender Equality</option>
                    <option value="SDG 6: Clean Water and Sanitation">SDG 6: Clean Water and Sanitation</option>
                    <option value="SDG 7: Affordable and Clean Energy">SDG 7: Affordable and Clean Energy</option>
                    <option value="SDG 8: Decent Work and Economic Growth">SDG 8: Decent Work and Economic Growth</option>
                    <option value="SDG 9: Industry, Innovation and Infrastructure">SDG 9: Industry, Innovation and Infrastructure</option>
                    <option value="SDG 10: Reduced Inequalities">SDG 10: Reduced Inequalities</option>
                    <option value="SDG 11: Sustainable Cities and Communities">SDG 11: Sustainable Cities and Communities</option>
                    <option value="SDG 12: Responsible Consumption and Production">SDG 12: Responsible Consumption and Production</option>
                    <option value="SDG 13: Climate Action">SDG 13: Climate Action</option>
                    <option value="SDG 14: Life Below Water">SDG 14: Life Below Water</option>
                    <option value="SDG 15: Life on Land">SDG 15: Life on Land</option>
                    <option value="SDG 16: Peace, Justice and Strong Institutions">SDG 16: Peace, Justice and Strong Institutions</option>
                    <option value="SDG 17: Partnerships for the Goals">SDG 17: Partnerships for the Goals</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple SDGs</p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {isEditMode ? 'Update' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



{showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Generate Report</h3>
            <input
              type="text"
              placeholder="Report Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveReport}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Save Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



      </div>
    );
  };
  
  export default FundingsView;