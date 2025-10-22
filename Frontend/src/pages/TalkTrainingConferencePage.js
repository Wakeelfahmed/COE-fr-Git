import React, { useState, useEffect, useCallback } from 'react';
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

const EventsView = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    type: '',
    title: '',
    participants: '',
    mode: '',
    date: '',
    agenda: '',
    followUpActivity: '',
    resourcePerson: '',
    targetSDG: [],
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    type: '',
    title: '',
    resourcePerson: '',
    mode: '',
    dateFrom: '',
    dateTo: '',
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
        sourceType: 'TalksTrainingsAttended',
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
              type: row['Type'] || row['type'] || '',
              title: row['Title'] || row['title'] || '',
              resourcePerson: row['Resource Person'] || row['resourcePerson'] || row['ResourcePerson'] || '',
              participants: row['Participants'] || row['participants'] || '',
              mode: row['Mode'] || row['mode'] || '',
              date: row['Date'] || row['date'] || '',
              targetSDG: []
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
            if (!mappedRow.type || !mappedRow.title) {
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
        if (!row.type || !row.title) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Type or Title)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/TalkTrainingConference`, row);
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
      fetchEvents(); // Refresh the data
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
        'Type': 'Training',
        'Title': 'AI Workshop 2024',
        'Resource Person': 'Dr. Sarah Johnson',
        'Participants': 'Computer Science Students',
        'Mode': 'Online',
        'Date': '2024-01-15',
        'Target SDG': 'SDG 4, SDG 9'
      },
      {
        'Type': 'Talk',
        'Title': 'Sustainable Technology Solutions',
        'Resource Person': 'Prof. Michael Chen',
        'Participants': 'Engineering Faculty',
        'Mode': 'Onsite',
        'Date': '2024-02-20',
        'Target SDG': 'SDG 7, SDG 13'
      },
      {
        'Type': 'Conference',
        'Title': 'International AI Summit',
        'Resource Person': 'Dr. Ahmed Hassan',
        'Participants': 'Researchers, Industry Partners',
        'Mode': 'Online',
        'Date': '2024-03-10',
        'Target SDG': 'SDG 9, SDG 17'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Talks_Trainings_Conferences');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_talks_trainings_conferences.xlsx');
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

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/TalkTrainingConference`, {
        params: { onlyMine: showOnlyMine }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      alert('Error fetching Talks/Trainings Attended. Please try again.');
    }
  }, [showOnlyMine]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleNewEvent = () => {
    setIsEditMode(false);
    setCurrentEvent({
      type: '',
      title: '',
      participants: '',
      mode: '',
      date: '',
      agenda: '',
      followUpActivity: '',
      resourcePerson: '',
      targetSDG: [],
      fileLink: ''
    });
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentEvent({
      ...event,
      date: formatDateForInput(event.date)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetSDG') {
      // Handle multiple selections for SDGs
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentEvent(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setCurrentEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eventData = {
      ...currentEvent
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/TalkTrainingConference/${currentEvent._id}`, eventData);
      } else {
        await axios.post(`${API_BASE_URL}/TalkTrainingConference`, eventData);
      }
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving training:', error);
      alert('Error saving training. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${API_BASE_URL}/TalkTrainingConference/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting training:', error);
        alert('Error deleting training. Please try again.');
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
      type: '',
      title: '',
      resourcePerson: '',
      mode: '',
      dateFrom: '',
      dateTo: '',
      accountFilter: ''
    });
  };

  const handleFileChange = (event, eventId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [eventId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (eventId) => {
    const file = selectedFiles[eventId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.uid);
      await axios.put(`${API_BASE_URL}/TalkTrainingConference/${eventId}`, { fileLink: fileUrl });
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, fileLink: fileUrl } : event
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[eventId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (eventId, fileName) => {
    try {
      await deletePdf(user?.uid, fileName);
      await axios.put(`${API_BASE_URL}/TalkTrainingConference/${eventId}`, { fileLink: null });
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, fileLink: null } : event
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredEvents = events.filter(event => {
    const evType = (event.type || '').toLowerCase();
    const evTitle = (event.title || '').toLowerCase();
    const evResource = (event.resourcePerson || '').toLowerCase();
    const evMode = (event.mode || '').toLowerCase();

    const fcType = (filterCriteria.type || '').toLowerCase();
    const fcTitle = (filterCriteria.title || '').toLowerCase();
    const fcResource = (filterCriteria.resourcePerson || '').toLowerCase();
    const fcMode = (filterCriteria.mode || '').toLowerCase();

    const passTextFilters =
      evType.includes(fcType) &&
      evTitle.includes(fcTitle) &&
      evResource.includes(fcResource) &&
      evMode.includes(fcMode);

    // Date filters (handle undefined dates safely)
    const hasFrom = !!filterCriteria.dateFrom;
    const hasTo = !!filterCriteria.dateTo;
    const evDate = event.date ? new Date(event.date) : null;
    const fromDate = hasFrom ? new Date(filterCriteria.dateFrom) : null;
    const toDate = hasTo ? new Date(filterCriteria.dateTo) : null;

    const passFrom = !hasFrom || (evDate && evDate >= fromDate);
    const passTo = !hasTo || (evDate && evDate <= toDate);

    return passTextFilters && passFrom && passTo &&
           (filterCriteria.accountFilter === '' || (event.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Talks/Trainings Attended</h2>
        <div>
          <button onClick={handleNewEvent} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Talks/Trainings/Conferences
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Talks/Trainings/Conferences' : 'My Talks/Trainings/Conferences'}
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
            <select
              name="type"
              value={filterCriteria.type}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Types</option>
              <option value="Talk">Talk</option>
              <option value="Training">Training</option>
              <option value="Conference">Conference</option>
            </select>
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
              placeholder="Filter by Resource Person"
              name="resourcePerson"
              value={filterCriteria.resourcePerson}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <select
              name="mode"
              value={filterCriteria.mode}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Modes</option>
              <option value="Onsite">Onsite</option>
              <option value="Online">Online</option>
            </select>
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
            <label for="dateFrom">From Event Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateFrom">To Event Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target SDG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((event, index) => (
              <tr key={event._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.resourcePerson}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.participants}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.mode}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(event.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.targetSDG ? event.targetSDG.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {event.fileLink ? (
                    <div>
                      <a href={event.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(event._id, event.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, event._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${event._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${event._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[event._id] && (
                        <button onClick={() => handleFileUpload(event._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, event._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${event._id}`} 
                      />
                      <label htmlFor={`fileUpload-${event._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[event._id] && (
                        <button onClick={() => handleFileUpload(event._id)} className="text-green-600 hover:text-green-900">Upload</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEditEvent(event)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button onClick={() => handleDeleteEvent(event._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
                {isEditMode ? 'Edit Talks/Trainings/Conferences' : 'New Talks/Trainings/Conferences'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                      Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={currentEvent.type}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Talk">Talk</option>
                      <option value="Training">Training</option>
                      <option value="Conference">Conference</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={currentEvent.title}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participants">
                      Participants <span className="text-gray-500 font-normal">(Student, Faculty, Industry etc)</span>
                    </label>
                    <input
                      type="text"
                      id="participants"
                      name="participants"
                      value={currentEvent.participants}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mode">
                      Mode
                    </label>
                    <select
                      id="mode"
                      name="mode"
                      value={currentEvent.mode}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Mode</option>
                      <option value="Onsite">Onsite</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={currentEvent.date}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resourcePerson">
                      Resource Person
                    </label>
                    <input
                      type="text"
                      id="resourcePerson"
                      name="resourcePerson"
                      value={currentEvent.resourcePerson}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="agenda">
                      Agenda/Details
                    </label>
                    <textarea
                      id="agenda"
                      name="agenda"
                      value={currentEvent.agenda}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="followUpActivity">
                      Follow Up Activity
                    </label>
                    <input
                      type="text"
                      id="followUpActivity"
                      name="followUpActivity"
                      value={currentEvent.followUpActivity}
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
                    value={currentEvent.targetSDG}
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
              Upload Talks/Trainings/Conferences from Excel
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
                  Type, Title, Resource Person, Participants, Mode, Date, Target SDG<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Type:</strong> Talk, Training, or Conference<br/>
                  • <strong>Title:</strong> Event title/name<br/>
                  • <strong>Resource Person:</strong> Speaker or trainer name<br/>
                  • <strong>Participants:</strong> Who attended (Student, Faculty, etc.)<br/>
                  • <strong>Mode:</strong> Onsite or Online<br/>
                  • <strong>Date:</strong> Event date (YYYY-MM-DD or readable format)<br/>
                  • <strong>Target SDG:</strong> SDG goals (can be comma-separated)<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Type: Training, Title: AI Workshop, Resource Person: Dr. Smith, Participants: Students, Mode: Online, Date: 2024-01-15, Target SDG: SDG 4, SDG 9
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
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Resource Person</th>
                          <th className="px-4 py-2 text-left">Participants</th>
                          <th className="px-4 py-2 text-left">Mode</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Target SDG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.type}</td>
                            <td className="px-4 py-2">{row.title}</td>
                            <td className="px-4 py-2">{row.resourcePerson}</td>
                            <td className="px-4 py-2">{row.participants}</td>
                            <td className="px-4 py-2">{row.mode}</td>
                            <td className="px-4 py-2">{row.date}</td>
                            <td className="px-4 py-2">{row.targetSDG.join(', ')}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan="7" className="px-4 py-2 text-center text-gray-600">
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
  
  export default EventsView;