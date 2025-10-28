import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import AccountFilter from '../components/AccountFilter';

// Try to import xlsx, fallback to CDN if not available
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  // Fallback: use CDN version
  console.warn('xlsx library not installed. Please run: npm install xlsx');
  console.warn('Or ensure the CDN version is loaded in your HTML');
}

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

// API-based file upload function
const uploadFile = async (file) => {
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('File uploaded successfully:', response.data.file.url);
    return response.data.file.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// API-based file delete function
const deleteFile = async (filename) => {
  try {
    await axios.delete(`${API_BASE_URL}/files/${filename}`);
    console.log('File deleted successfully:', filename);
  } catch (error) {
    console.error('Delete error:', error);
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
    centerName: '',
    accountFilter: '' // Add account filter
  });
  const [selectedFiles, setSelectedFiles] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);



  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);



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

  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setExcelFile(file);
    } else {
      alert('Please select an Excel file (.xlsx or .xls)');
      e.target.value = null;
    }
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!XLSX) {
        reject(new Error('XLSX library not available. Please install xlsx package: npm install xlsx'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map Excel columns to database fields
          const mappedData = jsonData.map((row, index) => {
            const mappedRow = {
              year: row['Year'] || row['year'] || '',
              duration: row['Duration'] || row['duration'] || '',
              certificateNumber: row['Certificate Number'] || row['certificateNumber'] || row['CertificateNumber'] || '',
              applicantName: row['Applicant Name'] || row['applicantName'] || row['ApplicantName'] || '',
              officialEmail: row['Official Email'] || row['officialEmail'] || row['OfficialEmail'] || '',
              contactNumber: row['Contact Number'] || row['contactNumber'] || row['ContactNumber'] || '',
              affiliation: row['Affiliation'] || row['affiliation'] || '',
              centerName: row['Center Name'] || row['centerName'] || row['CenterName'] || '',
              supervisor: row['Supervisor'] || row['supervisor'] || '',
              tasksCompleted: row['Tasks Completed'] || row['tasksCompleted'] || row['TasksCompleted'] || ''
            };

            // Validate required fields
            if (!mappedRow.year || !mappedRow.applicantName) {
              console.warn(`Row ${index + 1} missing required fields:`, row);
            }

            return mappedRow;
          });

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExcelPreview = async () => {
    if (!excelFile) {
      alert('Please select an Excel file first');
      return;
    }

    try {
      const parsedData = await parseExcelFile(excelFile);
      setExcelData(parsedData);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error parsing Excel file. Please make sure the file format is correct.');
    }
  };

  const handleExcelUpload = async () => {
    if (excelData.length === 0) {
      alert('No data to upload. Please preview the Excel file first.');
      return;
    }

    setUploadingExcel(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];

        // Skip rows with missing required fields
        if (!row.year || !row.applicantName) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Year or Applicant Name)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/internships`, row);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${error.response?.data?.error || error.message}`);
        }
      }

      // Show results
      let message = `Upload completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}`;
      if (errors.length > 0) {
        message += `\n\nErrors:\n${errors.slice(0, 10).join('\n')}`;
        if (errors.length > 10) {
          message += `\n... and ${errors.length - 10} more errors`;
        }
      }

      alert(message);
      setShowExcelModal(false);
      setExcelFile(null);
      setExcelData([]);
      fetchInternships(); // Refresh the data
    } catch (error) {
      console.error('Error uploading Excel data:', error);
      alert('Error uploading data. Please try again.');
    } finally {
      setUploadingExcel(false);
    }
  };

  const downloadSampleExcel = () => {
    if (!XLSX) {
      alert('XLSX library not available. Please install xlsx package first: npm install xlsx');
      return;
    }

    // Create sample data
    const sampleData = [
      {
        'Year': 2024,
        'Duration': '6 months',
        'Certificate Number': 'CERT-2024-001',
        'Applicant Name': 'John Doe',
        'Official Email': 'john.doe@university.edu',
        'Contact Number': '+1-234-567-8900',
        'Affiliation': 'University of Technology',
        'Center Name': 'AI Research Center',
        'Supervisor': 'Dr. Sarah Johnson',
        'Tasks Completed': 'Developed machine learning models for data analysis'
      },
      {
        'Year': 2024,
        'Duration': '6 weeks',
        'Certificate Number': 'CERT-2024-002',
        'Applicant Name': 'Jane Smith',
        'Official Email': 'jane.smith@company.com',
        'Contact Number': '+1-234-567-8901',
        'Affiliation': 'Tech Solutions Inc.',
        'Center Name': 'Innovation Hub',
        'Supervisor': 'Dr. Sumaira Kasur',
        'Tasks Completed': 'Implemented web application for project management'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Internships');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_internships.xlsx');
  };






  // Helper function to check if user can edit/delete an internship
  const canEditInternship = (internship) => {
    if (!user) return false;
    // Director can edit/delete everything
    if (user.role === 'director') return true;
    // Creator can edit/delete their own internships
    const creatorId = internship.createdBy?.id || internship.createdBy;
    // Compare with user.id (MongoDB _id) not user.uid (Firebase UID)
    return creatorId?.toString() === user.id?.toString();
  };

  const fetchInternships = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/internships`, {
        params: { onlyMine: showOnlyMine }
      });
      setInternships(response.data);
    } catch (error) {
      console.error('Error fetching internships:', error);
      alert('Error fetching internships. Please try again.');
    }
  }, [showOnlyMine]);

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setExcelData([]);
  };

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) {
        handleNewInternship();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);

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
      centerName: '',
      accountFilter: ''
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
      console.log('Uploading file to local storage...');
      const fileUrl = await uploadFile(file);
      console.log('File URL received:', fileUrl);

      console.log('Updating internship with file URL...');
      await axios.put(`${API_BASE_URL}/internships/${internshipId}`, { fileLink: fileUrl });
      console.log('Internship updated successfully');

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

  const handleFileDelete = async (internshipId, fileName) => {
    try {
      console.log('Deleting file:', fileName);
      await deleteFile(fileName);
      console.log('File deleted from storage');

      await axios.put(`${API_BASE_URL}/internships/${internshipId}`, { fileLink: null });
      console.log('Internship updated - file link removed');

      setInternships(prevInternships =>
        prevInternships.map(internship =>
          internship._id === internshipId ? { ...internship, fileLink: null } : internship
        )
      );

      console.log('File deletion completed successfully');
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
      internship.centerName.toLowerCase().includes(filterCriteria.centerName.toLowerCase()) &&
      (filterCriteria.accountFilter === '' || (internship.createdBy?.id === filterCriteria.accountFilter))
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
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mb-2">
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
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
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
                      {canEditInternship(internship) && (
                        <>
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
                        </>
                      )}
                    </div>
                  ) : (
                    canEditInternship(internship) ? (
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
                    ) : (
                      <span className="text-gray-400">No file</span>
                    )
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {canEditInternship(internship) ? (
                    <>
                      <button onClick={() => handleEditInternship(internship)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                      <button onClick={() => handleDeleteInternship(internship._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </>
                  ) : (
                    <span className="text-gray-400">No access</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal JSX expressions - moved inside the main return statement */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditMode ? 'Edit Internship' : 'New Internship'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {showExcelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Upload Internships from Excel
            </h3>

            <div className="mb-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Excel File (.xlsx, .xls)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleExcel}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                  >
                    📥 Download Sample Excel
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Required Excel columns (case-insensitive):</strong><br />
                  Year, Duration, Certificate Number, Applicant Name, Official Email, Contact Number, Affiliation, Center Name, Supervisor, Tasks Completed<br />
                  <br />
                  <strong>Column Details:</strong><br />
                  • <strong>Year:</strong> Year of internship (number)<br />
                  • <strong>Duration:</strong> Internship duration (e.g., "6 months", "3 months")<br />
                  • <strong>Certificate Number:</strong> Certificate ID number<br />
                  • <strong>Applicant Name:</strong> Full name of the intern<br />
                  • <strong>Official Email:</strong> Email address of the intern<br />
                  • <strong>Contact Number:</strong> Phone number of the intern<br />
                  • <strong>Affiliation:</strong> University, company, or organization<br />
                  • <strong>Center Name:</strong> Name of the center where internship took place<br />
                  • <strong>Supervisor:</strong> Name of the supervisor<br />
                  • <strong>Tasks Completed:</strong> Description of work completed<br />
                  <br />
                  <strong>Sample first row:</strong><br />
                  Year: 2024, Duration: 6 months, Certificate Number: CERT-2024-001, Applicant Name: John Doe, Official Email: john.doe@university.edu, Contact Number: +1-234-567-8900, Affiliation: University of Technology, Center Name: AI Research Center, Supervisor: Dr. Sarah Johnson, Tasks Completed: Developed machine learning models for data analysis
                </p>
              </div>

              {excelFile && (
                <div className="mb-4">
                  <button
                    onClick={handleExcelPreview}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Preview Data
                  </button>
                </div>
              )}

              {excelData.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium mb-2">Preview Data ({excelData.length} records)</h4>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Year</th>
                          <th className="px-4 py-2 text-left">Duration</th>
                          <th className="px-4 py-2 text-left">Certificate Number</th>
                          <th className="px-4 py-2 text-left">Applicant Name</th>
                          <th className="px-4 py-2 text-left">Official Email</th>
                          <th className="px-4 py-2 text-left">Contact Number</th>
                          <th className="px-4 py-2 text-left">Affiliation</th>
                          <th className="px-4 py-2 text-left">Center Name</th>
                          <th className="px-4 py-2 text-left">Supervisor</th>
                          <th className="px-4 py-2 text-left">Tasks Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.year}</td>
                            <td className="px-4 py-2">{row.duration}</td>
                            <td className="px-4 py-2">{row.certificateNumber}</td>
                            <td className="px-4 py-2">{row.applicantName}</td>
                            <td className="px-4 py-2">{row.officialEmail}</td>
                            <td className="px-4 py-2">{row.contactNumber}</td>
                            <td className="px-4 py-2">{row.affiliation}</td>
                            <td className="px-4 py-2">{row.centerName}</td>
                            <td className="px-4 py-2">{row.supervisor}</td>
                            <td className="px-4 py-2">{row.tasksCompleted}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan="10" className="px-4 py-2 text-center text-gray-600">
                              ... and {excelData.length - 10} more records
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Ready to upload {excelData.length} records
                    </div>
                    <div>
                      <button
                        onClick={handleExcelUpload}
                        disabled={uploadingExcel}
                        className="bg-green-500 text-white px-4 py-2 rounded mr-2 disabled:bg-gray-400"
                      >
                        {uploadingExcel ? 'Uploading...' : 'Upload All Records'}
                      </button>
                      <button
                        onClick={handleCloseExcelModal}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleCloseExcelModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InternshipView;