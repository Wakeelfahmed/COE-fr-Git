import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

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

const PatentsView = () => {
  const [patents, setPatents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPatent, setCurrentPatent] = useState({
    title: '',
    inventor: '',
    coInventor: '',
    patentOrg: '',
    affiliationOfCoInventor: '',
    dateOfSubmission: '',
    scope: '',
    directoryNumber: '',
    patentNumber: '',
    dateOfApproval: '',
    targetSDG: [],
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    title: '',
    inventor: '',
    scope: '',
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
        sourceType: 'Patents',
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
    fetchPatents();
  }, [showOnlyMine]);

  // Add Escape key listener to close modals
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showModal) {
          setShowModal(false);
        }
        if (showReportModal) {
          setShowReportModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, showReportModal]);

  const fetchPatents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/patents`, {
        params: { onlyMine: showOnlyMine }
      });
      setPatents(response.data);
    } catch (error) {
      console.error('Error fetching patents:', error);
      alert('Error fetching patents. Please try again.');
    }
  };

  const handleNewPatent = () => {
    setIsEditMode(false);
    setCurrentPatent({
      title: '',
      inventor: '',
      coInventor: '',
      patentOrg: '',
      affiliationOfCoInventor: '',
      dateOfSubmission: '',
      scope: '',
      directoryNumber: '',
      patentNumber: '',
      dateOfApproval: '',
      targetSDG: [],
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditPatent = (patent) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentPatent({
      ...patent,
      coInventor: patent?.coInventor ? patent.coInventor.join(', ') : '',
      dateOfSubmission: formatDateForInput(patent.dateOfSubmission),
      dateOfApproval: formatDateForInput(patent.dateOfApproval)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetSDG') {
      // Handle multiple selections for SDGs
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentPatent(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setCurrentPatent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patentData = {
      ...currentPatent,
      coInventor: currentPatent?.coInventor
        ? currentPatent.coInventor.split(',').map(member => member.trim()).filter(member => member.length > 0)
        : []
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/patents/${currentPatent._id}`, patentData);
      } else {
        await axios.post(`${API_BASE_URL}/patents`, patentData);
      }
      setShowModal(false);
      fetchPatents();
    } catch (error) {
      console.error('Error saving patent:', error);
      alert('Error saving patent. Please try again.');
    }
  };

  const handleDeletePatent = async (patentId) => {
    if (window.confirm('Are you sure you want to delete this patent?')) {
      try {
        await axios.delete(`${API_BASE_URL}/patents/${patentId}`);
        fetchPatents();
      } catch (error) {
        console.error('Error deleting patent:', error);
        alert('Error deleting patent. Please try again.');
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
      title: '',
      inventor: '',
      scope: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFileChange = (event, patentId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [patentId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (patentId) => {
    const file = selectedFiles[patentId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/patents/${patentId}`, { fileLink: fileUrl });
      
      setPatents(prevPatents => 
        prevPatents.map(patent => 
          patent._id === patentId ? { ...patent, fileLink: fileUrl } : patent
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[patentId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (patentId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/patents/${patentId}`, { fileLink: null });
      
      setPatents(prevPatents => 
        prevPatents.map(patent => 
          patent._id === patentId ? { ...patent, fileLink: null } : patent
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredPatents = patents.filter(patent => {
    return (patent.title || '').toLowerCase().includes((filterCriteria.title || '').toLowerCase()) &&
           (patent.inventor || '').toLowerCase().includes((filterCriteria.inventor || '').toLowerCase()) &&
           (patent.scope || '').toLowerCase().includes((filterCriteria.scope || '').toLowerCase()) &&
           (filterCriteria.dateFrom === '' || patent.dateOfSubmission >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || patent.dateOfSubmission <= filterCriteria.dateTo);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Patents</h2>
        <div>
          <button onClick={handleNewPatent} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Patent
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Patents' : 'My Patents'}
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
              placeholder="Filter by Title"
              name="title"
              value={filterCriteria.title}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Inventor"
              name="inventor"
              value={filterCriteria.inventor}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <select
              name="scope"
              value={filterCriteria.scope}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Scopes</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
            <label htmlFor="dateFrom">From Submission Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label htmlFor="dateTo">To Submission Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Co-Inventor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patent Org</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Co-Inventor Affiliation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directory Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patent Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target SDG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatents.map((patent, index) => (
              <tr key={patent._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.title || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.inventor || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {Array.isArray(patent.coInventor) ? patent.coInventor.join(', ') : patent.coInventor || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.patentOrg || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.affiliationOfCoInventor || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(patent.dateOfSubmission)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.scope || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.directoryNumber || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.patentNumber || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(patent.dateOfApproval)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.targetSDG ? patent.targetSDG.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {patent.fileLink ? (
                    <div>
                      <a href={patent.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(patent._id, patent.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, patent._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${patent._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${patent._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[patent._id] && (
                        <button onClick={() => handleFileUpload(patent._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, patent._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${patent._id}`} 
                      />
                      <label htmlFor={`fileUpload-${patent._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[patent._id] && (
                        <button onClick={() => handleFileUpload(patent._id)} className="text-green-600 hover:text-green-900">Upload</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEditPatent(patent)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button onClick={() => handleDeletePatent(patent._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
                {isEditMode ? 'Edit Patent' : 'New Patent'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={currentPatent.title}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pi">
                      Inventor
                    </label>
                    <input
                      type="text"
                      id="inventor"
                      name="inventor"
                      value={currentPatent.inventor}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="team">
                      Co-Inventor (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="coInventor"
                      name="coInventor"
                      value={currentPatent.coInventor}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patentOrg">
                      Patent Organization
                    </label>
                    <input
                      type="text"
                      id="patentOrg"
                      name="patentOrg"
                      value={currentPatent.patentOrg}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliationOfCoPi">
                      Affiliation of Co-Inventor
                    </label>
                    <input
                      type="text"
                      id="affiliationOfCoInventor"
                      name="affiliationOfCoInventor"
                      value={currentPatent.affiliationOfCoInventor}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scope">
                      Scope
                    </label>
                    <select
                      id="scope"
                      name="scope"
                      value={currentPatent.scope}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Scope</option>
                      <option value="National">National</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="directoryNumber">
                      Directory Number
                    </label>
                    <input
                      type="text"
                      id="directoryNumber"
                      name="directoryNumber"
                      value={currentPatent.directoryNumber}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patentNumber">
                      Patent Number
                    </label>
                    <input
                      type="text"
                      id="patentNumber"
                      name="patentNumber"
                      value={currentPatent.patentNumber}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                      value={currentPatent.dateOfSubmission}
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
                      value={currentPatent.dateOfApproval}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                    value={currentPatent.targetSDG}
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
  
  export default PatentsView;