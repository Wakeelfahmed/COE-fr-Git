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

const InternshipView = () => {
  const [internships, setInternships] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentInternship, setCurrentInternship] = useState({
    year: '',
    duration: '',
    certificateNumber: '',
    applicantName: '',
    officialEmail: '',
    contactNumber: '',
    affiliation: '',
    centerName: '',
    supervisor: '',
    tasksCompleted: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    year: '',
    applicantName: '',
    supervisor: '',
    centerName: ''
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
        sourceType: 'Internships',
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
    fetchInternships();
  }, [showOnlyMine]);

  const fetchInternships = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/internships`, {
        params: { onlyMine: showOnlyMine }
      });
      setInternships(response.data);
    } catch (error) {
      console.error('Error fetching internships:', error);
      alert('Error fetching internships. Please try again.');
    }
  };

  const handleNewInternship = () => {
    setIsEditMode(false);
    setCurrentInternship({
      year: '',
      duration: '',
      certificateNumber: '',
      applicantName: '',
      officialEmail: '',
      contactNumber: '',
      affiliation: '',
      centerName: '',
      supervisor: '',
      tasksCompleted: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditInternship = (internship) => {
    setIsEditMode(true);
    setCurrentInternship(internship);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentInternship(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/internships/${currentInternship._id}`, currentInternship);
      } else {
        await axios.post(`${API_BASE_URL}/internships`, currentInternship);
      }
      setShowModal(false);
      fetchInternships();
    } catch (error) {
      console.error('Error saving internship:', error);
      alert('Error saving internship. Please try again.');
    }
  };

  const handleDeleteInternship = async (internshipId) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await axios.delete(`${API_BASE_URL}/internships/${internshipId}`);
        fetchInternships();
      } catch (error) {
        console.error('Error deleting internship:', error);
        alert('Error deleting internship. Please try again.');
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
      year: '',
      applicantName: '',
      supervisor: '',
      centerName: ''
    });
  };

  const handleFileChange = (event, internshipId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [internshipId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (internshipId) => {
    const file = selectedFiles[internshipId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/internships/${internshipId}`, { fileLink: fileUrl });
      
      setInternships(prevInternships => 
        prevInternships.map(internship => 
          internship._id === internshipId ? { ...internship, fileLink: fileUrl } : internship
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[internshipId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (internshipId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/internships/${internshipId}`, { fileLink: null });
      
      setInternships(prevInternships => 
        prevInternships.map(internship => 
          internship._id === internshipId ? { ...internship, fileLink: null } : internship
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredInternships = internships.filter(internship => {
    return (
      (filterCriteria.year === '' || internship.year.toString().includes(filterCriteria.year)) &&
      internship.applicantName.toLowerCase().includes(filterCriteria.applicantName.toLowerCase()) &&
      internship.supervisor.toLowerCase().includes(filterCriteria.supervisor.toLowerCase()) &&
      internship.centerName.toLowerCase().includes(filterCriteria.centerName.toLowerCase())
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Internships</h2>
        <div>
          <button onClick={handleNewInternship} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Internship
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Internships' : 'My Internships'}
            </button>
          )}
          <button onClick={toggleFilters} className="border border-blue-600 text-blue-600 px-4 py-2 rounded">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <input
              type="number"
              placeholder="Filter by Year"
              name="year"
              value={filterCriteria.year}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Applicant Name"
              name="applicantName"
              value={filterCriteria.applicantName}
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
              placeholder="Filter by Center Name"
              name="centerName"
              value={filterCriteria.centerName}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Official Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInternships.map((internship) => (
              <tr key={internship._id}>
                <td className="px-6 py-4 whitespace-nowrap">{internship.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.certificateNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.applicantName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.officialEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.contactNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.affiliation}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.centerName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.supervisor}</td>
                <td className="px-6 py-4 whitespace-nowrap">{internship.tasksCompleted}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {internship.fileLink ? (
                    <div>
                      <a href={internship.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(internship._id, internship.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, internship._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${internship._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${internship._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[internship._id] && (
                        <button onClick={() => handleFileUpload(internship._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, internship._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${internship._id}`} 
                      />
                      <label htmlFor={`fileUpload-${internship._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[internship._id] && (
                        <button onClick={() => handleFileUpload(internship._id)} className="text-green-600 hover:text-green-900">Upload</button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditInternship(internship)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteInternship(internship._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Internship' : 'New Internship'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={currentInternship.year}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
                  Duration
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={currentInternship.duration}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="certificateNumber">
                  Certificate Number
                </label>
                <input
                  type="text"
                  id="certificateNumber"
                  name="certificateNumber"
                  value={currentInternship.certificateNumber}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="applicantName">
                  Applicant Name
                </label>
                <input
                  type="text"
                  id="applicantName"
                  name="applicantName"
                  value={currentInternship.applicantName}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="officialEmail">
                  Official Email
                </label>
                <input
                  type="email"
                  id="officialEmail"
                  name="officialEmail"
                  value={currentInternship.officialEmail}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactNumber">
                  Contact Number
                </label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={currentInternship.contactNumber}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliation">
                  Affiliation
                </label>
                <input
                  type="text"
                  id="affiliation"
                  name="affiliation"
                  value={currentInternship.affiliation}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="centerName">
                  Center Name
                </label>
                <input
                  type="text"
                  id="centerName"
                  name="centerName"
                  value={currentInternship.centerName}
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
                  value={currentInternship.supervisor}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tasksCompleted">
                  Tasks Completed
                </label>
                <textarea
                  id="tasksCompleted"
                  name="tasksCompleted"
                  value={currentInternship.tasksCompleted}
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

export default InternshipView;