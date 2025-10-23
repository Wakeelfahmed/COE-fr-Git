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

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState({
    event: '',
    organizer: '',
    date: '',
    participantOfEvent: '',
    participantFromCoEAI: '',
    roleOfParticipantFromCoEAI: '',
    detailsOfAchievement: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // // Debug logging
  // console.log('AchievementsPage Debug:', {
  //   user: user,
  //   userRole: user?.role,
  //   isDirector: user?.role === 'director',
  //   userType: typeof user?.role,
  //   userExists: !!user,
  //   hasRole: !!user?.role
  // });

  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    event: '',
    organizer: '',
    participantOfEvent: '',
    participantFromCoEAI: '',
    roleOfParticipantFromCoEAI: '',
    accountFilter: '' // Add account filter
  });

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, [showOnlyMine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) 
{        handleNewAchievement();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);

  const fetchAchievements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/achievements`, {
        params: { onlyMine: showOnlyMine }
      });
      setAchievements(response.data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      alert('Error fetching achievements. Please try again.');
    }
  };

  const handleNewAchievement = () => {
    setIsEditMode(false);
    setCurrentAchievement({
      event: '',
      organizer: '',
      date: '',
      participantOfEvent: '',
      participantFromCoEAI: '',
      roleOfParticipantFromCoEAI: '',
      detailsOfAchievement: ''
    });
    setShowModal(true);
  };

  const handleEditAchievement = (achievement) => {
    setIsEditMode(true);
    setCurrentAchievement({
      ...achievement,
      date: achievement.date ? new Date(achievement.date).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAchievement(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/achievements/${currentAchievement._id}`, currentAchievement);
      } else {
        await axios.post(`${API_BASE_URL}/achievements`, currentAchievement);
      }
      setShowModal(false);
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      alert('Error saving achievement. Please try again.');
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/achievements/${achievementId}`);
        fetchAchievements();
      } catch (error) {
        console.error('Error deleting achievement:', error);
        alert('Error deleting achievement. Please try again.');
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
      event: '',
      organizer: '',
      participantOfEvent: '',
      participantFromCoEAI: '',
      roleOfParticipantFromCoEAI: '',
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
        sourceType: 'Achievements',
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
            const mappedRow = {
              event: row['Event'] || row['event'] || '',
              organizer: row['Organizer'] || row['organizer'] || '',
              date: row['Date'] || row['date'] || '',
              participantOfEvent: row['Participant of Event'] || row['participantOfEvent'] || row['ParticipantOfEvent'] || '',
              participantFromCoEAI: row['Participant from CoE-AI'] || row['participantFromCoEAI'] || row['ParticipantFromCoEAI'] || '',
              roleOfParticipantFromCoEAI: row['Role of Participant from CoE-AI'] || row['roleOfParticipantFromCoEAI'] || row['RoleOfParticipantFromCoEAI'] || '',
              detailsOfAchievement: row['Details of Achievement'] || row['detailsOfAchievement'] || row['DetailsOfAchievement'] || ''
            };

            // Validate required fields
            if (!mappedRow.event || !mappedRow.organizer) {
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
        if (!row.event || !row.organizer) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Event or Organizer)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/achievements`, row);
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
      fetchAchievements(); // Refresh the data
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
        'Event': 'AI Innovation Competition 2024',
        'Organizer': 'Tech University',
        'Date': '2024-01-15',
        'Participant of Event': 'Students',
        'Participant from CoE-AI': 'Dr. Sarah Johnson',
        'Role of Participant from CoE-AI': 'Judge',
        'Details of Achievement': 'Led judging panel for AI innovation competition, awarded 3 prizes to CoE-AI students'
      },
      {
        'Event': 'National Research Symposium',
        'Organizer': 'Higher Education Commission',
        'Date': '2024-02-20',
        'Participant of Event': 'Faculty',
        'Participant from CoE-AI': 'Prof. Ahmed Hassan',
        'Role of Participant from CoE-AI': 'Keynote Speaker',
        'Details of Achievement': 'Delivered keynote on AI applications in healthcare, received best speaker award'
      },
      {
        'Event': 'International Conference on Machine Learning',
        'Organizer': 'IEEE',
        'Date': '2024-03-10',
        'Participant of Event': 'Researchers',
        'Participant from CoE-AI': 'Dr. Maria Rodriguez',
        'Role of Participant from CoE-AI': 'Presenter',
        'Details of Achievement': 'Presented research paper on deep learning algorithms, paper accepted for publication in conference proceedings'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Achievements');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_achievements.xlsx');
  };

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setExcelData([]);
  };

  const filteredAchievements = achievements.filter(achievement => {
    return (achievement.event || '').toLowerCase().includes(filterCriteria.event.toLowerCase()) &&
           (achievement.organizer || '').toLowerCase().includes(filterCriteria.organizer.toLowerCase()) &&
           (achievement.participantOfEvent || '').toLowerCase().includes(filterCriteria.participantOfEvent.toLowerCase()) &&
           (achievement.participantFromCoEAI || '').toLowerCase().includes(filterCriteria.participantFromCoEAI.toLowerCase()) &&
           (achievement.roleOfParticipantFromCoEAI || '').toLowerCase().includes(filterCriteria.roleOfParticipantFromCoEAI.toLowerCase()) &&
           (filterCriteria.accountFilter === '' || (achievement.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Achievements</h2>
        <div>
          <button onClick={handleNewAchievement} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Achievement
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
            {user?.role && user.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Achievements' : 'My Achievements'}
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
              placeholder="Filter by Event"
              name="event"
              value={filterCriteria.event}
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
              placeholder="Filter by Participant of Event"
              name="participantOfEvent"
              value={filterCriteria.participantOfEvent}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Participant from CoE-AI"
              name="participantFromCoEAI"
              value={filterCriteria.participantFromCoEAI}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Role"
              name="roleOfParticipantFromCoEAI"
              value={filterCriteria.roleOfParticipantFromCoEAI}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            {/* Debug: Check if director condition is met */}
            {(() => {
              console.log('Director check in render:', {
                userRole: user?.role,
                isDirector: user?.role === 'director',
                conditionResult: user?.role === 'director',
                hasRole: !!user?.role
              });
              return null;
            })()}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant of Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant from CoE-AI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details of Achievement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAchievements.map((achievement, index) => (
              <tr key={achievement._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.event}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.organizer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(achievement.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.participantOfEvent}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.participantFromCoEAI}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.roleOfParticipantFromCoEAI}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.detailsOfAchievement}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditAchievement(achievement)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteAchievement(achievement._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Achievement' : 'New Achievement'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event">
                    Event
                  </label>
                  <input
                    type="text"
                    id="event"
                    name="event"
                    value={currentAchievement.event}
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
                    value={currentAchievement.organizer}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={currentAchievement.date}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participantOfEvent">
                    Participant of Event <span className="text-gray-500 font-normal">(Student, Faculty, Industry etc)</span>
                  </label>
                  <input
                    type="text"
                    id="participantOfEvent"
                    name="participantOfEvent"
                    value={currentAchievement.participantOfEvent}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participantFromCoEAI">
                    Participant from CoE-AI
                  </label>
                  <input
                    type="text"
                    id="participantFromCoEAI"
                    name="participantFromCoEAI"
                    value={currentAchievement.participantFromCoEAI}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roleOfParticipantFromCoEAI">
                    Role of Participant from CoE-AI <span className="text-gray-500 font-normal">(e.g., Competitor, Organizer)</span>
                  </label>
                  <input
                    type="text"
                    id="roleOfParticipantFromCoEAI"
                    name="roleOfParticipantFromCoEAI"
                    value={currentAchievement.roleOfParticipantFromCoEAI}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailsOfAchievement">
                  Details of Achievement
                </label>
                <textarea
                  id="detailsOfAchievement"
                  name="detailsOfAchievement"
                  value={currentAchievement.detailsOfAchievement}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
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

      {showExcelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Upload Achievements from Excel
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
                  Event, Organizer, Date, Participant of Event, Participant from CoE-AI, Role of Participant from CoE-AI, Details of Achievement<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Event:</strong> Name of the event/competition<br/>
                  • <strong>Organizer:</strong> Event organizer/host<br/>
                  • <strong>Date:</strong> Event date (YYYY-MM-DD or readable format)<br/>
                  • <strong>Participant of Event:</strong> Type of participants (Students, Faculty, etc.)<br/>
                  • <strong>Participant from CoE-AI:</strong> Name of CoE-AI participant<br/>
                  • <strong>Role of Participant from CoE-AI:</strong> Role (Judge, Speaker, Competitor, etc.)<br/>
                  • <strong>Details of Achievement:</strong> Description of the achievement<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Event: AI Innovation Competition 2024, Organizer: Tech University, Date: 2024-01-15, Participant of Event: Students, Participant from CoE-AI: Dr. Sarah Johnson, Role of Participant from CoE-AI: Judge, Details of Achievement: Led judging panel for AI innovation competition, awarded 3 prizes to CoE-AI students
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
                          <th className="px-4 py-2 text-left">Event</th>
                          <th className="px-4 py-2 text-left">Organizer</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Participant</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Achievement Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.event}</td>
                            <td className="px-4 py-2">{row.organizer}</td>
                            <td className="px-4 py-2">{row.date}</td>
                            <td className="px-4 py-2">{row.participantFromCoEAI}</td>
                            <td className="px-4 py-2">{row.roleOfParticipantFromCoEAI}</td>
                            <td className="px-4 py-2">{row.detailsOfAchievement}</td>
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

export default AchievementsPage;
