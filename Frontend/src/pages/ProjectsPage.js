import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL,deleteObject, getMetadata } from "firebase/storage";
import AccountFilter from '../components/AccountFilter';

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const uploadPdf = async (file, userId) => {
  if (!file) return;

  console.log('=== UPLOAD PDF DEBUG ===');
  console.log('File:', file);
  console.log('File name:', file.name);
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  console.log('User ID:', userId);
  console.log('Storage bucket:', storage.app.options.storageBucket);

  try {
    // Create a reference to the file location in storage
    const fileRef = ref(storage, `pdfs/${userId}/${file.name}`);
    console.log('File reference path:', fileRef.fullPath);

    // Upload the file
    console.log('Starting upload...');
    await uploadBytes(fileRef, file);

    // Get the file's download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Upload successful!');
    console.log("File uploaded successfully. Download URL:", downloadURL);
    return downloadURL; // Return the URL for use (e.g., saving in the database)
  } catch (error) {
    console.error("=== UPLOAD ERROR DETAILS ===");
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    throw error; // Handle error appropriately in your app
  }
};

const getPdfUrl = async (userId, fileName) => {
  try {
    // Create a reference to the file
    const fileRef = ref(storage, `pdfs/${userId}/${fileName}`);

    // Get the file's download URL
    const downloadURL = await getDownloadURL(fileRef);

    console.log("Retrieved file URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw error; // Handle error appropriately in your app
  }
};

const deletePdf = async (userId, fileName) => {
  try {
    const fileRef = ref(storage, `pdfs/${userId}/${fileName}`);
    
    // Check if file exists before attempting to delete
    try {
      await getMetadata(fileRef);
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log("File doesn't exist, skipping delete operation");
        return; // Exit function if file doesn't exist
      }
      throw error; // Rethrow if it's a different error
    }

    await deleteObject(fileRef);
    console.log("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error);
    // Handle different types of errors here
  }
};

const updatePdf = async (file, userId, oldFileName) => {
  if (!file) return;

  try {
    // Delete the old file if necessary
    if (oldFileName) {
      const oldFileRef = ref(storage, `pdfs/${userId}/${oldFileName}`);
      await deleteObject(oldFileRef);
    }

    // Create a reference for the new file
    const newFileRef = ref(storage, `pdfs/${userId}/${file.name}`);

    // Upload the new file
    await uploadBytes(newFileRef, file);

    // Get the new file's download URL
    const downloadURL = await getDownloadURL(newFileRef);

    console.log("File updated successfully. New download URL:", downloadURL);
    return downloadURL; // Return the URL for use (e.g., saving in the database)
  } catch (error) {
    console.error("Error updating file:", error);
    throw error; // Handle error appropriately in your app
  }
};


const ProjectsView = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentProject, setCurrentProject] = useState({
    projectTitle: '',
    teamLead: '',
    rndTeam: '',
    clientCompany: '',
    dateOfContractSign: '',
    dateOfDeploymentAsPerContract: '',
    amountInPKRM: '',
    advPaymentPercentage: '',
    dateOfReceivingAdvancePayment: '',
    actualDateOfDeployment: '',
    dateOfReceivingCompletePayment: '',
    taxPaidBy: 'BU',
    targetSDG: [],
    remarks: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    projectTitle: '',
    teamLead: '',
    clientCompany: '',
    dateFrom: '',
    dateTo: '',
    accountFilter: '' // Add account filter
  });
  const [selectedFiles, setSelectedFiles] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  console.log('=== FIREBASE DEBUG ===');
  console.log('Firebase storage initialized:', !!storage);
  console.log('Storage bucket:', storage?.app?.options?.storageBucket);
  console.log('User object:', user);
  console.log('User ID:', user?.id);
  console.log('User email:', user?.email);






  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleSaveReport = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, {
        title: reportTitle,
        sourceType: 'CommercializationProjects',
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
    fetchProjects();
  }, [showOnlyMine]);

    // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal) 
{        handleNewProject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal]);
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        params: { onlyMine: showOnlyMine }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Error fetching projects. Please try again.');
    }
  };

  const handleNewProject = () => {
    setIsEditMode(false);
    setCurrentProject({
      projectTitle: '',
      teamLead: '',
      rndTeam: '',
      clientCompany: '',
      dateOfContractSign: '',
      dateOfDeploymentAsPerContract: '',
      amountInPKRM: '',
      advPaymentPercentage: '',
      dateOfReceivingAdvancePayment: '',
      actualDateOfDeployment: '',
      dateOfReceivingCompletePayment: '',
      taxPaidBy: 'BU',
      targetSDG: [],
      remarks: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentProject({
      ...project,
      rndTeam: project.rndTeam.join(', '),
      dateOfContractSign: formatDateForInput(project.dateOfContractSign),
      dateOfDeploymentAsPerContract: formatDateForInput(project.dateOfDeploymentAsPerContract),
      dateOfReceivingAdvancePayment: formatDateForInput(project.dateOfReceivingAdvancePayment),
      actualDateOfDeployment: formatDateForInput(project.actualDateOfDeployment),
      dateOfReceivingCompletePayment: formatDateForInput(project.dateOfReceivingCompletePayment)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetSDG') {
      // Handle multiple selections for SDGs
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentProject(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setCurrentProject(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projectData = {
      ...currentProject,
      rndTeam: currentProject.rndTeam.split(',').map(member => member.trim()),
      amountInPKRM: parseFloat(currentProject.amountInPKRM),
      advPaymentPercentage: parseFloat(currentProject.advPaymentPercentage)
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/projects/${currentProject._id}`, projectData);
      } else {
        await axios.post(`${API_BASE_URL}/projects`, projectData);
      }
      setShowModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. Please try again.');
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
      teamLead: '',
      clientCompany: '',
      dateFrom: '',
      dateTo: '',
      accountFilter: ''
    });
  };

  const handleFileChange = (event, projectId) => {
    const file = event.target.files[0];
    console.log('=== FILE CHANGE DEBUG ===');
    console.log('Project ID:', projectId);
    console.log('Selected files:', event.target.files);
    console.log('Selected file:', file);

    if (file && file.type === 'application/pdf') {
      console.log('Valid PDF file selected:', file.name);
      setSelectedFiles(prev => ({ ...prev, [projectId]: file }));
      console.log('File added to selectedFiles state');
    } else {
      console.error('Invalid file selected or no file selected');
      console.error('File:', file);
      console.error('File type:', file?.type);
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (projectId) => {
    const file = selectedFiles[projectId];
    if (!file) {
      console.error('No file selected for project ID:', projectId);
      alert('Please select a file first');
      return;
    }

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Project ID:', projectId);
    console.log('Selected file:', file);
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('User ID:', user?.uid);
    console.log('User object:', user);

    try {
      console.log('Calling uploadPdf...');
      const fileUrl = await uploadPdf(file, user?.uid);
      console.log('File URL received:', fileUrl);

      console.log('Updating project with file URL...');
      await axios.put(`${API_BASE_URL}/projects/${projectId}`, { fileLink: fileUrl });
      console.log('Project updated successfully');

      setProjects(prevProjects =>
        prevProjects.map(project =>
          project._id === projectId ? { ...project, fileLink: fileUrl } : project
        )
      );

      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[projectId];
        return newState;
      });

      console.log('File upload completed successfully');
    } catch (error) {
      console.error('=== FILE UPLOAD ERROR ===');
      console.error('Error in handleFileUpload:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error stack:', error.stack);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (projectId, fileName) => {
    try {
      await deletePdf(user?.uid, fileName);
      await axios.put(`${API_BASE_URL}/projects/${projectId}`, { fileLink: null });
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project._id === projectId ? { ...project, fileLink: null } : project
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project => {
    return (project.projectTitle || '').toLowerCase().includes((filterCriteria.projectTitle || '').toLowerCase()) &&
      (project.teamLead || '').toLowerCase().includes((filterCriteria.teamLead || '').toLowerCase()) &&
      (project.clientCompany || '').toLowerCase().includes((filterCriteria.clientCompany || '').toLowerCase()) &&
      (filterCriteria.dateFrom === '' || project.dateOfContractSign >= filterCriteria.dateFrom) &&
      (filterCriteria.dateTo === '' || project.dateOfContractSign <= filterCriteria.dateTo) &&
      (filterCriteria.accountFilter === '' || (project.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Industry/Commercial Projects</h2>
        <div>
          <button onClick={handleNewProject} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Project
          </button>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Projects' : 'My Projects'}
            </button>
          )}
          <button onClick={toggleFilters} className="border border-blue-600 text-blue-600 px-4 py-2 rounded">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
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
              placeholder="Filter by Team Lead"
              name="teamLead"
              value={filterCriteria.teamLead}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Client Company"
              name="clientCompany"
              value={filterCriteria.clientCompany}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
            <label htmlFor="dateFrom">From Contract Sign Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label htmlFor="dateTo">To Contract Sign Date:</label>
            <input
              id="dateTo"
              type="date"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R&D Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployment Date (Contract)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (PKR M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Deployment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Paid By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target SDG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project, index) => (
              <tr key={project._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.projectTitle || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.teamLead || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.rndTeam ? project.rndTeam.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.clientCompany || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(project.dateOfContractSign)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(project.dateOfDeploymentAsPerContract)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.amountInPKRM ? project.amountInPKRM.toLocaleString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.advPaymentPercentage ? project.advPaymentPercentage + '%' : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(project.dateOfReceivingAdvancePayment)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(project.actualDateOfDeployment)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(project.dateOfReceivingCompletePayment)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.taxPaidBy || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.targetSDG ? project.targetSDG.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.remarks || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {project.fileLink ? (
                    <div>
                      <a href={project.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(project._id, project.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, project._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${project._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${project._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[project._id] && (
                        <button onClick={() => handleFileUpload(project._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, project._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${project._id}`} 
                      />
                      <label htmlFor={`fileUpload-${project._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[project._id] && (
                        <button onClick={() => handleFileUpload(project._id)} className="text-green-600 hover:text-green-900">Upload</button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditProject(project)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteProject(project._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Project' : 'New Project'}
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
                    value={currentProject.projectTitle}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teamLead">
                    Team Lead
                  </label>
                  <input
                    type="text"
                    id="teamLead"
                    name="teamLead"
                    value={currentProject.teamLead}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rndTeam">
                    R&D Team (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="rndTeam"
                    name="rndTeam"
                    value={currentProject.rndTeam}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientCompany">
                    Client Company
                  </label>
                  <input
                    type="text"
                    id="clientCompany"
                    name="clientCompany"
                    value={currentProject.clientCompany}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfContractSign">
                    Date of Contract Sign
                  </label>
                  <input
                    type="date"
                    id="dateOfContractSign"
                    name="dateOfContractSign"
                    value={currentProject.dateOfContractSign}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfDeploymentAsPerContract">
                    Date of Deployment (As Per Contract)
                  </label>
                  <input
                    type="date"
                    id="dateOfDeploymentAsPerContract"
                    name="dateOfDeploymentAsPerContract"
                    value={currentProject.dateOfDeploymentAsPerContract}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amountInPKRM">
                    Amount in PKR M <span className="text-gray-500 font-normal">(Contract value in millions)</span>
                  </label>
                  <input
                    type="number"
                    id="amountInPKRM"
                    name="amountInPKRM"
                    value={currentProject.amountInPKRM}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="advPaymentPercentage">
                    Advance Payment Percentage
                  </label>
                  <input
                    type="number"
                    id="advPaymentPercentage"
                    name="advPaymentPercentage"
                    value={currentProject.advPaymentPercentage}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfReceivingAdvancePayment">
                    Date of Receiving Advance Payment
                  </label>
                  <input
                    type="date"
                    id="dateOfReceivingAdvancePayment"
                    name="dateOfReceivingAdvancePayment"
                    value={currentProject.dateOfReceivingAdvancePayment}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="actualDateOfDeployment">
                    Actual Date of Deployment
                  </label>
                  <input
                    type="date"
                    id="actualDateOfDeployment"
                    name="actualDateOfDeployment"
                    value={currentProject.actualDateOfDeployment}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfReceivingCompletePayment">
                    Date of Receiving Complete Payment
                  </label>
                  <input
                    type="date"
                    id="dateOfReceivingCompletePayment"
                    name="dateOfReceivingCompletePayment"
                    value={currentProject.dateOfReceivingCompletePayment}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxPaidBy">
                    Tax Paid By
                  </label>
                  <select
                    id="taxPaidBy"
                    name="taxPaidBy"
                    value={currentProject.taxPaidBy}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="BU">BU</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetSDG">
                    Target SDG
                  </label>
                  <select
                    id="targetSDG"
                    name="targetSDG"
                    multiple
                    value={currentProject.targetSDG}
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
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="remarks">
                  Remarks
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={currentProject.remarks}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
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

export default ProjectsView;