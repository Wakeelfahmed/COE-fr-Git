
import React, { useState, useEffect } from 'react';
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

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    activity: '',
    organizer: '',
    resourcePerson: '',
    role: '',
    otherRole: '',
    type: '',
    participantsOfEvent: '',
    nameOfAttendee: '',
    date: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    activity: '',
    organizer: '',
    resourcePerson: '',
    role: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    accountFilter: '' // Add account filter
  });

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Helper function to format dates for display (dd-mm-year format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function to format dates for HTML date inputs (YYYY-MM-DD format)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [showOnlyMine, user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) {
        handleNewEvent();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);

  const fetchEvents = async () => {
    if (!user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }

    try {
      console.log('Fetching events for user:', user.email);
      const response = await axios.get(`${API_BASE_URL}/events`, {
        params: { onlyMine: showOnlyMine }
      });
      console.log('Events fetched successfully:', response.data.length);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed, user may need to login again');
        // Optionally redirect to login or show login prompt
      }
      alert('Error fetching events. Please try again.');
    }
  };

  const handleNewEvent = () => {
    setIsEditMode(false);
    setCurrentEvent({
      activity: '',
      organizer: '',
      resourcePerson: '',
      role: '',
      otherRole: '',
      type: '',
      participantsOfEvent: '',
      nameOfAttendee: '',
      date: ''
    });
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setIsEditMode(true);
    setCurrentEvent({
      ...event,
      date: formatDateForInput(event.date)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('=== EVENT SUBMIT DEBUG ===');
    // console.log('Is Edit Mode:', isEditMode);
    // console.log('Event Data:', currentEvent);
    // console.log('API URL:', `${API_BASE_URL}/events${isEditMode ? '/' + currentEvent._id : ''}`);

    try {
      let response;
      if (isEditMode) {
        console.log('Sending PUT request...');
        response = await axios.put(`${API_BASE_URL}/events/${currentEvent._id}`, currentEvent);
      } else {
        console.log('Sending POST request...');
        response = await axios.post(`${API_BASE_URL}/events`, currentEvent);
      }
      console.log('Response:', response.data);
      console.log('Event saved successfully!');
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('=== ERROR SAVING EVENT ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      alert('Error saving event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${API_BASE_URL}/events/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
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
      activity: '',
      organizer: '',
      resourcePerson: '',
      role: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      accountFilter: ''
    });
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a report title');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, {
        title: reportTitle,
        sourceType: 'Events',
        filterCriteria
      });
      console.log('Report saved:', response.data);
      alert('Report saved successfully!');
      setShowReportModal(false);
      setReportTitle('');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
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
            // Handle role field with special parsing for "Other: xyz role" format
            let role = row['Role'] || row['role'] || '';
            let otherRole = row['Other Role'] || row['otherRole'] || row['OtherRole'] || '';

            // If role contains "Other:" format, extract the role name and set otherRole
            if (typeof role === 'string' && role.toLowerCase().includes('other:')) {
              const roleParts = role.split(':');
              if (roleParts.length > 1) {
                otherRole = roleParts[1].trim();
                role = 'other';
              }
            }

            const mappedRow = {
              activity: row['Activity'] || row['activity'] || '',
              organizer: row['Organizer'] || row['organizer'] || '',
              resourcePerson: row['Resource Person'] || row['resourcePerson'] || row['ResourcePerson'] || '',
              role: role,
              otherRole: otherRole,
              type: row['Type'] || row['type'] || '',
              participantsOfEvent: row['Participants of Event'] || row['participantsOfEvent'] || row['ParticipantsOfEvent'] || '',
              nameOfAttendee: row['Name of Attendee'] || row['nameOfAttendee'] || row['NameOfAttendee'] || '',
              date: row['Date'] || row['date'] || ''
            };

            // Validate required fields
            if (!mappedRow.activity || !mappedRow.organizer) {
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
        if (!row.activity || !row.organizer) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Activity or Organizer)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/events`, row);
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
        'Activity': 'AI Conference 2024',
        'Organizer': 'Tech University',
        'Resource Person': 'Dr. Sarah Johnson',
        'Role': 'participant',
        'Type': 'Conference',
        'Participants of Event': 'Students, Faculty',
        'Date': '2024-01-15',
        'Name of Attendee': 'John Doe'
      },
      {
        'Activity': 'Machine Learning Workshop',
        'Organizer': 'AI Research Center',
        'Resource Person': 'Prof. Michael Chen',
        'Role': 'attendee',
        'Type': 'Workshop',
        'Participants of Event': 'Graduate Students',
        'Date': '2024-02-20',
        'Name of Attendee': 'Jane Smith'
      },
      {
        'Activity': 'Data Science Competition',
        'Organizer': 'Computer Science Department',
        'Resource Person': 'Dr. Ahmed Hassan',
        'Role': 'judge',
        'Type': 'Competition',
        'Participants of Event': 'Undergraduate Students',
        'Date': '2024-03-10',
        'Name of Attendee': 'Bob Wilson'
      },
      {
        'Activity': 'Blockchain Technology Seminar',
        'Organizer': 'FinTech Institute',
        'Resource Person': 'Prof. Maria Rodriguez',
        'Role': 'Other: Keynote Speaker',
        'Type': 'Seminar',
        'Participants of Event': 'Industry Professionals',
        'Date': '2024-04-05',
        'Name of Attendee': 'Alice Brown'
      },
      {
        'Activity': 'Cybersecurity Training Program',
        'Organizer': 'National Security Agency',
        'Resource Person': 'Dr. Robert Wilson',
        'Role': 'other',
        'Other Role': 'Security Consultant',
        'Type': 'Training',
        'Participants of Event': 'Government Officials',
        'Date': '2024-05-12',
        'Name of Attendee': 'Charlie Davis'
      },
      {
        'Activity': 'IoT Innovation Expo',
        'Organizer': 'Tech Expo Center',
        'Resource Person': 'Eng. Fatima Khan',
        'Role': 'participant',
        'Type': 'Exhibition',
        'Participants of Event': 'Researchers, Industry',
        'Date': '2024-06-18',
        'Name of Attendee': 'Diana Prince'
      },
      {
        'Activity': 'Cloud Computing Symposium',
        'Organizer': 'CloudTech Solutions',
        'Resource Person': 'Dr. James Miller',
        'Role': 'Other: Panel Moderator',
        'Type': 'Symposium',
        'Participants of Event': 'IT Professionals',
        'Date': '2024-07-25',
        'Name of Attendee': 'Eve Johnson'
      },
      {
        'Activity': 'Robotics Competition 2024',
        'Organizer': 'Engineering College',
        'Resource Person': 'Prof. David Brown',
        'Role': 'judge',
        'Type': 'Competition',
        'Participants of Event': 'Engineering Students',
        'Date': '2024-08-30',
        'Name of Attendee': 'Frank Castle'
      },
      {
        'Activity': 'Digital Marketing Workshop',
        'Organizer': 'Business School',
        'Resource Person': 'Ms. Lisa Thompson',
        'Role': 'attendee',
        'Type': 'Workshop',
        'Participants of Event': 'Marketing Students',
        'Date': '2024-09-14',
        'Name of Attendee': 'Grace Lee'
      },
      {
        'Activity': 'AI Ethics Conference',
        'Organizer': 'Ethics Research Institute',
        'Resource Person': 'Dr. Kevin Smith',
        'Role': 'Other: Session Chair',
        'Type': 'Conference',
        'Participants of Event': 'Researchers, Policy Makers',
        'Date': '2024-10-22',
        'Name of Attendee': 'Henry Ford'
      },
      {
        'Activity': 'Big Data Analytics Training',
        'Organizer': 'Data Science Academy',
        'Resource Person': 'Prof. Nancy Wilson',
        'Role': 'participant',
        'Type': 'Training',
        'Participants of Event': 'Data Scientists',
        'Date': '2024-11-08',
        'Name of Attendee': 'Iris West'
      },
      {
        'Activity': 'Mobile App Development Seminar',
        'Organizer': 'Mobile Tech Hub',
        'Resource Person': 'Eng. Omar Hassan',
        'Role': 'other',
        'Other Role': 'Technical Advisor',
        'Type': 'Seminar',
        'Participants of Event': 'App Developers',
        'Date': '2024-12-01',
        'Name of Attendee': 'Jack Ryan'
      },
      {
        'Activity': 'Sustainable Technology Expo',
        'Organizer': 'Green Tech Foundation',
        'Resource Person': 'Dr. Emma Watson',
        'Role': 'Other: Guest Speaker',
        'Type': 'Exhibition',
        'Participants of Event': 'Environmental Scientists',
        'Date': '2024-12-15',
        'Name of Attendee': 'Kelly Clarkson'
      },
      {
        'Activity': 'Quantum Computing Workshop',
        'Organizer': 'Physics Research Lab',
        'Resource Person': 'Prof. Stephen Hawking',
        'Role': 'attendee',
        'Type': 'Workshop',
        'Participants of Event': 'Physics Researchers',
        'Date': '2024-12-28',
        'Name of Attendee': 'Luna Lovegood'
      },
      {
        'Activity': 'Startup Pitch Competition',
        'Organizer': 'Entrepreneurship Center',
        'Resource Person': 'Ms. Oprah Winfrey',
        'Role': 'judge',
        'Type': 'Competition',
        'Participants of Event': 'Startup Founders',
        'Date': '2024-12-31',
        'Name of Attendee': 'Mike Ross'
      },
      {
        'Activity': 'Web Development Bootcamp',
        'Organizer': 'Coding Academy',
        'Resource Person': 'Eng. Mark Zuckerberg',
        'Role': 'Other: Lead Instructor',
        'Type': 'Training',
        'Participants of Event': 'Web Developers',
        'Date': '2024-12-20',
        'Name of Attendee': 'Nina Dobrev'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_events.xlsx');
  };

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setExcelData([]);
  };

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const fromDate = filterCriteria.dateFrom ? new Date(filterCriteria.dateFrom) : null;
    const toDate = filterCriteria.dateTo ? new Date(filterCriteria.dateTo) : null;

    return (event.activity || '').toLowerCase().includes((filterCriteria.activity || '').toLowerCase()) &&
      (event.organizer || '').toLowerCase().includes((filterCriteria.organizer || '').toLowerCase()) &&
      (event.resourcePerson || '').toLowerCase().includes((filterCriteria.resourcePerson || '').toLowerCase()) &&
      (event.role || '').toLowerCase().includes((filterCriteria.role || '').toLowerCase()) &&
      (event.type || '').toLowerCase().includes((filterCriteria.type || '').toLowerCase()) &&
      (filterCriteria.accountFilter === '' || (event.createdBy?.id === filterCriteria.accountFilter)) &&
      (!fromDate || eventDate >= fromDate) &&
      (!toDate || eventDate <= toDate);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Events</h2>
        <div>
          <button onClick={handleNewEvent} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Event
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Events' : 'My Events'}
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
              placeholder="Filter by Activity"
              name="activity"
              value={filterCriteria.activity}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Organizer"
              name="organizer"
              value={filterCriteria.organizer}
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
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Roles</option>
              <option value="attendee">Attendee</option>
              <option value="judge">Judge</option>
              <option value="participant">Participant</option>
              <option value="other">Other</option>
            </select>
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
            <input
              type="text"
              placeholder="Filter by Type"
              name="type"
              value={filterCriteria.type}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label htmlFor="dateFrom">From Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label htmlFor="dateTo">To Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((event, index) => (
              <tr key={event._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.activity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.organizer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.resourcePerson}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {event.role === 'other' ? event.otherRole : event.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.participantsOfEvent}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(event.date)}</td>
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditMode ? 'Edit Event' : 'New Event'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="activity">
                  Activity
                </label>
                <input
                  type="text"
                  id="activity"
                  name="activity"
                  value={currentEvent.activity}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="organizer">
                  Organizer
                </label>
                <input
                  type="text"
                  id="organizer"
                  name="organizer"
                  value={currentEvent.organizer}
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
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={currentEvent.role}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="attendee">Attendee</option>
                  <option value="judge">Judge</option>
                  <option value="participant">Participant</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {currentEvent.role === 'other' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherRole">
                    Specify Other Role
                  </label>
                  <input
                    type="text"
                    id="otherRole"
                    name="otherRole"
                    value={currentEvent.otherRole}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                  Event Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={currentEvent.type}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Event Type</option>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Training">Training</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Symposium">Symposium</option>
                  <option value="Competition">Competition</option>
                  <option value="Exhibition">Exhibition</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participantsOfEvent">
                  Participants of Event <span className="text-gray-500 font-normal">(Student, Faculty, Industry etc)</span>
                </label>
                <input
                  type="text"
                  id="participantsOfEvent"
                  name="participantsOfEvent"
                  value={currentEvent.participantsOfEvent}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                  Event Date
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameOfAttendee">
                  Name of Attendee
                </label>
                <input
                  type="text"
                  id="nameOfAttendee"
                  name="nameOfAttendee"
                  value={currentEvent.nameOfAttendee}
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
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              >
                Save Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
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
              Upload Events from Excel
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
                  Activity, Organizer, Resource Person, Role, Type, Participants of Event, Date, Name of Attendee<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Activity:</strong> Name/description of the event activity<br/>
                  • <strong>Organizer:</strong> Organization hosting the event<br/>
                  • <strong>Resource Person:</strong> Speaker or main person<br/>
                  • <strong>Role:</strong> Your role (attendee, judge, participant, other)<br/>
                  • <strong>Type:</strong> Event type (Conference, Workshop, Seminar, etc.)<br/>
                  • <strong>Participants of Event:</strong> Who attended (Student, Faculty, etc.)<br/>
                  • <strong>Date:</strong> Event date (YYYY-MM-DD or readable format)<br/>
                  • <strong>Name of Attendee:</strong> Your name as attendee<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Activity: AI Conference 2024, Organizer: Tech University, Resource Person: Dr. Sarah Johnson, Role: participant, Type: Conference, Participants of Event: Students, Faculty, Date: 2024-01-15, Name of Attendee: John Doe
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
                          <th className="px-4 py-2 text-left">Activity</th>
                          <th className="px-4 py-2 text-left">Organizer</th>
                          <th className="px-4 py-2 text-left">Resource Person</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Participants</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Attendee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.activity}</td>
                            <td className="px-4 py-2">{row.organizer}</td>
                            <td className="px-4 py-2">{row.resourcePerson}</td>
                            <td className="px-4 py-2">{row.role}</td>
                            <td className="px-4 py-2">{row.type}</td>
                            <td className="px-4 py-2">{row.participantsOfEvent}</td>
                            <td className="px-4 py-2">{row.date}</td>
                            <td className="px-4 py-2">{row.nameOfAttendee}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan="8" className="px-4 py-2 text-center text-gray-600">
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

export default EventsPage;