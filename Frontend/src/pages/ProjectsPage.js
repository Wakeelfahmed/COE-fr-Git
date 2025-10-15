import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL,deleteObject, getMetadata } from "firebase/storage";

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const uploadPdf = async (file, userId) => {
  if (!file) return;

  try {
    // Create a reference to the file location in storage
    const fileRef = ref(storage, `pdfs/${userId}/${file.name}`);

    // Upload the file
    await uploadBytes(fileRef, file);

    // Get the file's download URL
    const downloadURL = await getDownloadURL(fileRef);

    console.log("File uploaded successfully. Download URL:", downloadURL);
    return downloadURL; // Return the URL for use (e.g., saving in the database)
  } catch (error) {
    console.error("Error uploading file:", error);
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
    supervisor: '',
    rndTeam: '',
    clientCompany: '',
    dateOfContractSign: '',
    dateOfDeploymentAsPerContract: '',
    amountInPKRM: '',
    advPaymentPercentage: '',
    advPaymentAmount: '',
    dateOfReceivingAdvancePayment: '',
    actualDateOfDeployment: '',
    dateOfReceivingCompletePayment: '',
    remarks: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    projectTitle: '',
    supervisor: '',
    clientCompany: '',
    dateFrom: '',
    dateTo: ''
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





  useEffect(() => {
    fetchProjects();
  }, [showOnlyMine]);

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
      supervisor: '',
      rndTeam: '',
      clientCompany: '',
      dateOfContractSign: '',
      dateOfDeploymentAsPerContract: '',
      amountInPKRM: '',
      advPaymentPercentage: '',
      advPaymentAmount: '',
      dateOfReceivingAdvancePayment: '',
      actualDateOfDeployment: '',
      dateOfReceivingCompletePayment: '',
      remarks: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setIsEditMode(true);
    setCurrentProject({
      ...project,
      rndTeam: project.rndTeam.join(', ')
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projectData = {
      ...currentProject,
      rndTeam: currentProject.rndTeam.split(',').map(member => member.trim()),
      amountInPKRM: parseFloat(currentProject.amountInPKRM),
      advPaymentPercentage: parseFloat(currentProject.advPaymentPercentage),
      advPaymentAmount: parseFloat(currentProject.advPaymentAmount)
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
      supervisor: '',
      clientCompany: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFileChange = (event, projectId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [projectId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (projectId) => {
    const file = selectedFiles[projectId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/projects/${projectId}`, { fileLink: fileUrl });
      
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
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (projectId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
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
    return project.projectTitle.toLowerCase().includes(filterCriteria.projectTitle.toLowerCase()) &&
      project.supervisor.toLowerCase().includes(filterCriteria.supervisor.toLowerCase()) &&
      project.clientCompany.toLowerCase().includes(filterCriteria.clientCompany.toLowerCase()) &&
      (filterCriteria.dateFrom === '' || project.dateOfContractSign >= filterCriteria.dateFrom) &&
      (filterCriteria.dateTo === '' || project.dateOfContractSign <= filterCriteria.dateTo);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
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
              placeholder="Filter by Supervisor"
              name="supervisor"
              value={filterCriteria.supervisor}
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
            <label for="dateFrom">From Contract Sign Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateTo">To Contract Sign Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R&D Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployment Date (Contract)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (PKR M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Deployment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project, index) => (
              <tr key={project._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.projectTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.supervisor}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.rndTeam.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.clientCompany}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfContractSign}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfDeploymentAsPerContract}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.amountInPKRM.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.advPaymentPercentage}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.advPaymentAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfReceivingAdvancePayment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.actualDateOfDeployment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfReceivingCompletePayment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.remarks}</td>
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditMode ? 'Edit Project' : 'New Project'}
            </h3>
            <form onSubmit={handleSubmit}>
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supervisor">
                  Supervisor
                </label>
                <input
                  type="text"
                  id="supervisor"
                  name="supervisor"
                  value={currentProject.supervisor}
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
                  Amount in PKR M
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="advPaymentAmount">
                  Advance Payment Amount
                </label>
                <input
                  type="number"
                  id="advPaymentAmount"
                  name="advPaymentAmount"
                  value={currentProject.advPaymentAmount}
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