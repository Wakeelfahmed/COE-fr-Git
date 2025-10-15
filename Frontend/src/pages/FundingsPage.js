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

const FundingsView = () => {
  const [fundings, setFundings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFunding, setCurrentFunding] = useState({
    projectTitle: '',
    pi: '',
    researchTeam: '',
    dateOfSubmission: '',
    dateOfApproval: '',
    fundingSource: '',
    pkr: '',
    team: '',
    status: '',
    closingDate: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    projectTitle: '',
    pi: '',
    fundingSource: '',
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


  useEffect(() => {
    fetchFundings();
  }, [showOnlyMine]);

  const fetchFundings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fundings`, {
        params: { onlyMine: showOnlyMine }
      });
      setFundings(response.data);
    } catch (error) {
      console.error('Error fetching fundings:', error);
      alert('Error fetching fundings. Please try again.');
    }
  };

  const handleNewFunding = () => {
    setIsEditMode(false);
    setCurrentFunding({
      projectTitle: '',
      pi: '',
      researchTeam: '',
      dateOfSubmission: '',
      dateOfApproval: '',
      fundingSource: '',
      pkr: '',
      team: '',
      status: '',
      closingDate: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditFunding = (funding) => {
    setIsEditMode(true);
    setCurrentFunding(funding);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFunding(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fundingData = {
      ...currentFunding,
      pkr: parseFloat(currentFunding.pkr)
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/fundings/${currentFunding._id}`, fundingData);
      } else {
        await axios.post(`${API_BASE_URL}/fundings`, fundingData);
      }
      setShowModal(false);
      fetchFundings();
    } catch (error) {
      console.error('Error saving funding:', error);
      alert('Error saving funding. Please try again.');
    }
  };

  const handleDeleteFunding = async (fundingId) => {
    if (window.confirm('Are you sure you want to delete this funding?')) {
      try {
        await axios.delete(`${API_BASE_URL}/fundings/${fundingId}`);
        fetchFundings();
      } catch (error) {
        console.error('Error deleting funding:', error);
        alert('Error deleting funding. Please try again.');
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
      dateFrom: '',
      dateTo: ''
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

  const handleFileUpload = async (fundingId) => {
    const file = selectedFiles[fundingId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/fundings/${fundingId}`, { fileLink: fileUrl });
      
      setFundings(prevFundings => 
        prevFundings.map(funding => 
          funding._id === fundingId ? { ...funding, fileLink: fileUrl } : funding
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[fundingId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (fundingId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/fundings/${fundingId}`, { fileLink: null });
      
      setFundings(prevFundings => 
        prevFundings.map(funding => 
          funding._id === fundingId ? { ...funding, fileLink: null } : funding
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredFundings = fundings.filter(funding => {
    return funding.projectTitle.toLowerCase().includes(filterCriteria.projectTitle.toLowerCase()) &&
           funding.pi.toLowerCase().includes(filterCriteria.pi.toLowerCase()) &&
           funding.fundingSource.toLowerCase().includes(filterCriteria.fundingSource.toLowerCase()) &&
           (filterCriteria.dateFrom === '' || funding.dateOfSubmission >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || funding.dateOfSubmission <= filterCriteria.dateTo);
  });


  





  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Fundings</h2>
        <div>
          <button onClick={handleNewFunding} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Funding
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Fundings' : 'My Fundings'}
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
              placeholder="Filter by PI"
              name="pi"
              value={filterCriteria.pi}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Funding Source"
              name="fundingSource"
              value={filterCriteria.fundingSource}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateFrom">From Submission Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateTo">From Submission Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Research Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PKR (M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFundings.map((funding, index) => (
              <tr key={funding._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.projectTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.pi}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.researchTeam}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.dateOfSubmission}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.dateOfApproval}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.fundingSource}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.pkr.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.team}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{funding.closingDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {funding.fileLink ? (
                    <div>
                      <a href={funding.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(funding._id, funding.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, funding._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${funding._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${funding._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[funding._id] && (
                        <button onClick={() => handleFileUpload(funding._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileChange(e, funding._id)} 
                          accept=".pdf" 
                          className="hidden" 
                          id={`fileUpload-${funding._id}`} 
                        />
                        <label htmlFor={`fileUpload-${funding._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                        {selectedFiles[funding._id] && (
                          <button onClick={() => handleFileUpload(funding._id)} className="text-green-600 hover:text-green-900">Upload</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEditFunding(funding)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button onClick={() => handleDeleteFunding(funding._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
                {isEditMode ? 'Edit Funding' : 'New Funding'}
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
                    value={currentFunding.projectTitle}
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
                    value={currentFunding.pi}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="researchTeam">
                    Research Team
                  </label>
                  <input
                    type="text"
                    id="researchTeam"
                    name="researchTeam"
                    value={currentFunding.researchTeam}
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
                    value={currentFunding.dateOfSubmission}
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
                    value={currentFunding.dateOfApproval}
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
                    value={currentFunding.fundingSource}
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
                    value={currentFunding.pkr}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="team">
                    Team
                  </label>
                  <input
                    type="text"
                    id="team"
                    name="team"
                    value={currentFunding.team}
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
                    value={currentFunding.status}
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
                    value={currentFunding.closingDate}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
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