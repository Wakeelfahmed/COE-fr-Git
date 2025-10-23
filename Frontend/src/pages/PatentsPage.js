import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";
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
    dateTo: '',
    accountFilter: '' // Add account filter
  });
  const [selectedFiles, setSelectedFiles] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);




  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

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
              title: row['Title'] || row['title'] || '',
              inventor: row['Inventor'] || row['inventor'] || '',
              coInventor: row['Co-Inventor'] || row['coInventor'] || '',
              patentOrg: row['Patent Org'] || row['patentOrg'] || '',
              affiliationOfCoInventor: row['Co-Inventor Affiliation'] || row['affiliationOfCoInventor'] || '',
              dateOfSubmission: row['Date of Submission'] || row['dateOfSubmission'] || '',
              scope: row['Scope'] || row['scope'] || '',
              directoryNumber: row['Directory Number'] || row['directoryNumber'] || '',
              patentNumber: row['Patent Number'] || row['patentNumber'] || '',
              dateOfApproval: row['Date of Approval'] || row['dateOfApproval'] || '',
              targetSDG: [],
              fileLink: ''
            };

            // Handle Target SDG parsing (could be comma-separated or multiple columns)
            if (row['Target SDG'] || row['targetSDG'] || row['TargetSDG']) {
              const sdgValue = row['Target SDG'] || row['targetSDG'] || row['TargetSDG'];
              if (typeof sdgValue === 'string' && sdgValue.includes(',')) {
                mappedRow.targetSDG = sdgValue.split(',').map(sdg => sdg.trim());
              } else {
                mappedRow.targetSDG = [sdgValue];
              }
            }

            // Validate required fields
            if (!mappedRow.title || !mappedRow.inventor) {
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
        if (!row.title || !row.inventor) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Title or Inventor)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/patents`, row);
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
      fetchPatents(); // Refresh the data
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
        'Title': 'AI-Powered Medical Diagnostic System',
        'Inventor': 'Dr. Sarah Johnson',
        'Co-Inventor': 'Dr. Ahmed Hassan, Prof. Maria Rodriguez',
        'Patent Org': 'Pakistan Patent Office',
        'Co-Inventor Affiliation': 'MIT AI Lab, University of Barcelona',
        'Date of Submission': '2024-01-15',
        'Scope': 'International',
        'Directory Number': 'AI/ML/2024/001',
        'Patent Number': 'PK-2024-001',
        'Date of Approval': '2024-06-15',
        'Target SDG': 'SDG 3, SDG 9'
      },
      {
        'Title': 'Smart Agriculture Monitoring Device',
        'Inventor': 'Prof. Michael Chen',
        'Co-Inventor': 'Dr. Fatima Khan',
        'Patent Org': 'Pakistan Patent Office',
        'Co-Inventor Affiliation': 'AgriTech Solutions',
        'Date of Submission': '2024-02-01',
        'Scope': 'National',
        'Directory Number': 'IOT/2024/002',
        'Patent Number': 'PK-2024-002',
        'Date of Approval': '2024-07-01',
        'Target SDG': 'SDG 2, SDG 12'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patents');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_patents.xlsx');
  };

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setExcelData([]);
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
      fetchPatents();
    }
  }, [showOnlyMine, user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) 
{        handleNewPatent();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);

  const fetchPatents = async () => {
    if (!user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }

    try {
      console.log('Fetching patents for user:', user.email);
      const response = await axios.get(`${API_BASE_URL}/patents`, {
        params: { onlyMine: showOnlyMine }
      });
      console.log('Patents fetched successfully:', response.data.length);
      setPatents(response.data);
    } catch (error) {
      console.error('Error fetching patents:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed, user may need to login again');
        // Optionally redirect to login or show login prompt
      }
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
      dateTo: '',
      accountFilter: ''
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
           (filterCriteria.dateTo === '' || patent.dateOfSubmission <= filterCriteria.dateTo) &&
           (filterCriteria.accountFilter === '' || (patent.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Patents</h2>
        <div>
          <button onClick={handleNewPatent} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Patent
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
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
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
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

      {showExcelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Upload Patents from Excel
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
                  <strong>Required Excel columns (case-insensitive):</strong><br/>
                  Title, Inventor, Co-Inventor, Patent Org, Date of Submission, Scope<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Title:</strong> Patent title/name<br/>
                  • <strong>Inventor:</strong> Primary inventor name<br/>
                  • <strong>Co-Inventor:</strong> Co-inventors (comma-separated)<br/>
                  • <strong>Patent Org:</strong> Patent organization/office<br/>
                  • <strong>Co-Inventor Affiliation:</strong> Affiliation of co-inventors<br/>
                  • <strong>Date of Submission:</strong> Patent submission date<br/>
                  • <strong>Scope:</strong> National or International<br/>
                  • <strong>Directory Number:</strong> Internal directory number<br/>
                  • <strong>Patent Number:</strong> Official patent number (if approved)<br/>
                  • <strong>Date of Approval:</strong> Approval date (if applicable)<br/>
                  • <strong>Target SDG:</strong> UN Sustainable Development Goals (comma-separated)<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Title: AI-Powered Medical Diagnostic System, Inventor: Dr. Sarah Johnson, Co-Inventor: Dr. Ahmed Hassan, Prof. Maria Rodriguez, Patent Org: Pakistan Patent Office, Co-Inventor Affiliation: MIT AI Lab, University of Barcelona, Date of Submission: 2024-01-15, Scope: International, Directory Number: AI/ML/2024/001, Patent Number: PK-2024-001, Date of Approval: 2024-06-15, Target SDG: SDG 3, SDG 9
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
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Inventor</th>
                          <th className="px-4 py-2 text-left">Patent Org</th>
                          <th className="px-4 py-2 text-left">Scope</th>
                          <th className="px-4 py-2 text-left">Submission Date</th>
                          <th className="px-4 py-2 text-left">Target SDG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.title}</td>
                            <td className="px-4 py-2">{row.inventor}</td>
                            <td className="px-4 py-2">{row.patentOrg}</td>
                            <td className="px-4 py-2">{row.scope}</td>
                            <td className="px-4 py-2">{row.dateOfSubmission}</td>
                            <td className="px-4 py-2">{row.targetSDG.join(', ')}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan="6" className="px-4 py-2 text-center text-gray-600">
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

export default PatentsView;