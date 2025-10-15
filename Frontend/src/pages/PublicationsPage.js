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

const PublicationsView = () => {
  const [publications, setPublications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPublication, setCurrentPublication] = useState({
    author: '',
    publicationDetails: '',
    typeOfPublication: '',
    lastKnownImpactFactor: '',
    dateOfPublication: '',
    hecCategory: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    author: '',
    typeOfPublication: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [fileOperations, setFileOperations] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };


  

  useEffect(() => {
    fetchPublications();
  }, [showOnlyMine]);

  const fetchPublications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/publications`, {
        params: { onlyMine: showOnlyMine }
      });
      setPublications(response.data);
    } catch (error) {
      console.error('Error fetching publications:', error);
      alert('Error fetching publications. Please try again.');
    }
  };

  const handleNewPublication = () => {
    setIsEditMode(false);
    setCurrentPublication({
      author: '',
      publicationDetails: '',
      typeOfPublication: '',
      lastKnownImpactFactor: '',
      dateOfPublication: '',
      hecCategory: '',
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditPublication = (publication) => {
    setIsEditMode(true);
    setCurrentPublication(publication);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPublication(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const publicationData = {
      ...currentPublication,
      lastKnownImpactFactor: parseFloat(currentPublication.lastKnownImpactFactor)
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/publications/${currentPublication._id}`, publicationData);
      } else {
        await axios.post(`${API_BASE_URL}/publications`, publicationData);
      }
      setShowModal(false);
      fetchPublications();
    } catch (error) {
      console.error('Error saving publication:', error);
      alert('Error saving publication. Please try again.');
    }
  };

  const handleDeletePublication = async (publicationId) => {
    if (window.confirm('Are you sure you want to delete this publication?')) {
      try {
        await axios.delete(`${API_BASE_URL}/publications/${publicationId}`);
        fetchPublications();
      } catch (error) {
        console.error('Error deleting publication:', error);
        alert('Error deleting publication. Please try again.');
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
      author: '',
      typeOfPublication: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFileChange = (event, publicationId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [publicationId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (publicationId) => {
    const file = selectedFiles[publicationId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    setFileOperations(prev => ({ ...prev, [publicationId]: { loading: true, operation: 'upload' } }));
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/publications/${publicationId}`, { fileLink: fileUrl });
      
      setPublications(prevPublications => 
        prevPublications.map(publication => 
          publication._id === publicationId ? { ...publication, fileLink: fileUrl } : publication
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[publicationId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setFileOperations(prev => ({ ...prev, [publicationId]: { loading: false, operation: null } }));
    }
  };

  const handleFileDelete = async (publicationId, fileName) => {
    setFileOperations(prev => ({ ...prev, [publicationId]: { loading: true, operation: 'delete' } }));
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/publications/${publicationId}`, { fileLink: null });
      
      setPublications(prevPublications => 
        prevPublications.map(publication => 
          publication._id === publicationId ? { ...publication, fileLink: null } : publication
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    } finally {
      setFileOperations(prev => ({ ...prev, [publicationId]: { loading: false, operation: null } }));
    }
  };

  const filteredPublications = publications.filter(publication => {
    return publication.author.toLowerCase().includes(filterCriteria.author.toLowerCase()) &&
           publication.typeOfPublication.toLowerCase().includes(filterCriteria.typeOfPublication.toLowerCase()) &&
           (filterCriteria.dateFrom === '' || publication.dateOfPublication >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || publication.dateOfPublication <= filterCriteria.dateTo);
  });




  const handleSaveReport = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, {
        title: reportTitle,
        sourceType: 'Publications',
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




  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Publications</h2>
        <div>
          <button onClick={handleNewPublication} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Publication
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Publications' : 'My Publications'}
            </button>
          )}
          <button onClick={toggleFilters} className="border border-blue-600 text-blue-600 px-4 py-2 rounded">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
            <input
              type="text"
              placeholder="Filter by Author"
              name="author"
              value={filterCriteria.author}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Type of Publication"
              name="typeOfPublication"
              value={filterCriteria.typeOfPublication}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateFrom">From Date of Publication:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateTo">From Date of Publication:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type of Publication</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Known Impact Factor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Publication</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HEC Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPublications.map((publication, index) => (
              <tr key={publication._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.author}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.publicationDetails}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.typeOfPublication}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.lastKnownImpactFactor}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.dateOfPublication}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publication.hecCategory}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {fileOperations[publication._id]?.loading ? (
                    <span>Loading... ({fileOperations[publication._id].operation})</span>
                  ) : publication.fileLink ? (
                    <div>
                      <a href={publication.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(publication._id, publication.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, publication._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${publication._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${publication._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[publication._id] && (
                        <button onClick={() => handleFileUpload(publication._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, publication._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${publication._id}`} 
                      />
                      <label htmlFor={`fileUpload-${publication._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[publication._id] && (
                        <button onClick={() => handleFileUpload(publication._id)} className="text-green-600 hover:text-green-900">Upload</button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditPublication(publication)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeletePublication(publication._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Publication' : 'New Publication'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="author">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={currentPublication.author}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="publicationDetails">
                  Publication Details (APA Format)
                </label>
                <textarea
                  id="publicationDetails"
                  name="publicationDetails"
                  value={currentPublication.publicationDetails}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="typeOfPublication">
                  Type of Publication
                </label>
                <input
                  type="text"
                  id="typeOfPublication"
                  name="typeOfPublication"
                  value={currentPublication.typeOfPublication}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastKnownImpactFactor">
                  Last Known Impact Factor
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="lastKnownImpactFactor"
                  name="lastKnownImpactFactor"
                  value={currentPublication.lastKnownImpactFactor}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfPublication">
                  Date of Publication
                </label>
                <input
                  type="date"
                  id="dateOfPublication"
                  name="dateOfPublication"
                  value={currentPublication.dateOfPublication}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hecCategory">
                  HEC Category
                </label>
                <input
                  type="text"
                  id="hecCategory"
                  name="hecCategory"
                  value={currentPublication.hecCategory}
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

export default PublicationsView;