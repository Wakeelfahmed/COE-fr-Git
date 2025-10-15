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
    pi: '',
    team: '',
    dateOfSubmission: '',
    scope: '',
    directoryNumber: '',
    patentNumber: '',
    dateOfApproval: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    title: '',
    pi: '',
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







  useEffect(() => {
    fetchPatents();
  }, [showOnlyMine]);

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
      pi: '',
      team: '',
      dateOfSubmission: '',
      scope: '',
      directoryNumber: '',
      patentNumber: '',
      dateOfApproval: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditPatent = (patent) => {
    setIsEditMode(true);
    setCurrentPatent({
      ...patent,
      team: patent?.team?.join(', ')
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPatent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patentData = {
      ...currentPatent,
      team: currentPatent?.team?.split(',').map(member => member.trim())
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
      pi: '',
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
    return patent.title.toLowerCase().includes(filterCriteria.title.toLowerCase()) &&
           patent.pi.toLowerCase().includes(filterCriteria.pi.toLowerCase()) &&
           patent.scope.toLowerCase().includes(filterCriteria.scope.toLowerCase()) &&
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
              placeholder="Filter by PI"
              name="pi"
              value={filterCriteria.pi}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directory Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patent Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatents.map((patent, index) => (
              <tr key={patent._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.pi}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {Array.isArray(patent.team) ? patent.team.join(', ') : patent.team || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.dateOfSubmission}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.scope}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.directoryNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.patentNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patent.dateOfApproval}</td>
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
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {isEditMode ? 'Edit Patent' : 'New Patent'}
              </h3>
              <form onSubmit={handleSubmit}>
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
                    PI
                  </label>
                  <input
                    type="text"
                    id="pi"
                    name="pi"
                    value={currentPatent.pi}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="team">
                    Team (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="team"
                    name="team"
                    value={currentPatent.team}
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
                    value={currentPatent.dateOfSubmission}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
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