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

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentCompetition, setCurrentCompetition] = useState({
    organizer: '',
    title: '',
    date: '',
    participants: '',
    scope: 'National',
    scopeOther: '',
    participantsFromBU: '',
    prizeMoney: '',
    details: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    organizer: '',
    title: '',
    participants: '',
    scope: '',
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

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

    // Keyboard shortcuts
  useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && showModal) {
          setShowModal(false);
     } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) 
{          handleNewCompetition();
        } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
          setShowExcelModal(true);
        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showModal, showReportModal, showExcelModal]);


  const fetchCompetitions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions`, {
        params: { onlyMine: showOnlyMine }
      });
      setCompetitions(response.data);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      alert('Error fetching competitions. Please try again.');
    }
  }, [showOnlyMine]);

  const handleNewCompetition = () => {
    setIsEditMode(false);
    setCurrentCompetition({
      organizer: '',
      title: '',
      date: '',
      participants: '',
      scope: 'National',
      scopeOther: '',
      participantsFromBU: '',
      prizeMoney: '',
      details: ''
    });
    setShowModal(true);
  };

  const handleEditCompetition = (competition) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentCompetition({
      ...competition,
      date: formatDateForInput(competition.date)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCompetition(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Handle scope field - if scope is 'Other', use the scopeOther field
    const competitionData = { ...currentCompetition };
    if (competitionData.scope === 'Other' && competitionData.scopeOther) {
      competitionData.scope = competitionData.scopeOther;
    }
    delete competitionData.scopeOther; // Remove scopeOther from the data

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/competitions/${currentCompetition._id}`, competitionData);
      } else {
        await axios.post(`${API_BASE_URL}/competitions`, competitionData);
      }
      setShowModal(false);
      fetchCompetitions();
    } catch (error) {
      console.error('Error saving competition:', error);
      alert('Error saving competition. Please try again.');
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        await axios.delete(`${API_BASE_URL}/competitions/${competitionId}`);
        fetchCompetitions();
      } catch (error) {
        console.error('Error deleting competition:', error);
        alert('Error deleting competition. Please try again.');
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
      organizer: '',
      title: '',
      participants: '',
      scope: '',
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
        sourceType: 'Competitions',
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
              organizer: row['Organizer'] || row['organizer'] || '',
              title: row['Title'] || row['title'] || '',
              date: row['Date'] || row['date'] || '',
              participants: row['Participants'] || row['participants'] || '',
              scope: row['Scope'] || row['scope'] || 'National',
              scopeOther: row['Scope Other'] || row['scopeOther'] || row['ScopeOther'] || '',
              participantsFromBU: row['Participants from BU'] || row['participantsFromBU'] || row['ParticipantsFromBU'] || '',
              prizeMoney: row['Prize Money'] || row['prizeMoney'] || row['PrizeMoney'] || '',
              details: row['Details'] || row['details'] || ''
            };

            // Validate required fields
            if (!mappedRow.organizer || !mappedRow.title) {
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
        if (!row.organizer || !row.title) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Organizer or Title)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/competitions`, row);
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
      fetchCompetitions(); // Refresh the data
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
        'Organizer': 'Tech University',
        'Title': 'AI Innovation Challenge 2024',
        'Date': '2024-01-15',
        'Participants': 'Students, Startups, Industry',
        'Scope': 'National',
        'Participants from BU': 'Computer Science, Engineering',
        'Prize Money': 100000,
        'Details': 'Annual AI innovation competition for students and startups'
      },
      {
        'Organizer': 'Innovation Hub',
        'Title': 'Sustainable Technology Competition',
        'Date': '2024-02-20',
        'Participants': 'Researchers, Entrepreneurs',
        'Scope': 'International',
        'Participants from BU': 'Environmental Science, Engineering',
        'Prize Money': 75000,
        'Details': 'Competition focused on sustainable technology solutions'
      },
      {
        'Organizer': 'Business School',
        'Title': 'Startup Pitch Competition',
        'Date': '2024-03-10',
        'Participants': 'MBA Students, Entrepreneurs',
        'Scope': 'Regional',
        'Participants from BU': 'Business Administration',
        'Prize Money': 50000,
        'Details': 'Platform for startups to pitch innovative business ideas'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Competitions');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_competitions.xlsx');
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

  const filteredCompetitions = competitions.filter(competition => {
    return (competition.organizer || '').toLowerCase().includes((filterCriteria.organizer || '').toLowerCase()) &&
           (competition.title || '').toLowerCase().includes((filterCriteria.title || '').toLowerCase()) &&
           (competition.participants || '').toLowerCase().includes((filterCriteria.participants || '').toLowerCase()) &&
           (competition.scope || '').toLowerCase().includes((filterCriteria.scope || '').toLowerCase()) &&
           (filterCriteria.dateFrom === '' || competition.date >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || competition.date <= filterCriteria.dateTo) &&
           (filterCriteria.accountFilter === '' || (competition.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Competitions</h2>
        <div>
          <button onClick={handleNewCompetition} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Competition
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Competitions' : 'My Competitions'}
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
              placeholder="Filter by Title"
              name="title"
              value={filterCriteria.title}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Participants"
              name="participants"
              value={filterCriteria.participants}
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
              <option value="Regional">Regional</option>
              <option value="International">International</option>
              <option value="Other">Other</option>
            </select>
            {user?.role && user.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants from BU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prize Money (PKR)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompetitions.map((competition, index) => (
              <tr key={competition._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.organizer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(competition.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.participants}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.scope}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.participantsFromBU}</td>
                <td className="px-6 py-4 whitespace-nowrap">Rs. {competition.prizeMoney?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{competition.details}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditCompetition(competition)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteCompetition(competition._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Competition' : 'New Competition'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="organizer">
                  Organizer
                </label>
                <input
                  type="text"
                  id="organizer"
                  name="organizer"
                  value={currentCompetition.organizer}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Project/Product/Prototype Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentCompetition.title}
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
                  value={currentCompetition.date}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participants">
                  Participants (e.g. students, startups, industry, faculty etc.)
                </label>
                <input
                  type="text"
                  id="participants"
                  name="participants"
                  value={currentCompetition.participants}
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
                  value={currentCompetition.scope}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="National">National</option>
                  <option value="Regional">Regional</option>
                  <option value="International">International</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {currentCompetition.scope === 'Other' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scopeOther">
                    Specify Other Scope
                  </label>
                  <input
                    type="text"
                    id="scopeOther"
                    name="scopeOther"
                    value={currentCompetition.scopeOther}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter custom scope"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participantsFromBU">
                  Participants from BU
                </label>
                <input
                  type="text"
                  id="participantsFromBU"
                  name="participantsFromBU"
                  value={currentCompetition.participantsFromBU}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prizeMoney">
                  Prize Money (PKR)
                </label>
                <input
                  type="number"
                  id="prizeMoney"
                  name="prizeMoney"
                  value={currentCompetition.prizeMoney}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
                  Competition Details
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={currentCompetition.details}
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
              Upload Competitions from Excel
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
                  Organizer, Title, Date, Participants, Scope<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Organizer:</strong> Competition organizer/host<br/>
                  • <strong>Title:</strong> Competition/project title<br/>
                  • <strong>Date:</strong> Competition date (YYYY-MM-DD or readable format)<br/>
                  • <strong>Participants:</strong> Who participated (Students, Startups, etc.)<br/>
                  • <strong>Scope:</strong> National, Regional, International, or Other<br/>
                  • <strong>Participants from BU:</strong> Participants from your university/department<br/>
                  • <strong>Prize Money:</strong> Total prize money in PKR<br/>
                  • <strong>Details:</strong> Additional competition details<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Organizer: Tech University, Title: AI Innovation Challenge 2024, Date: 2024-01-15, Participants: Students, Startups, Industry, Scope: National, Participants from BU: Computer Science, Engineering, Prize Money: 100000, Details: Annual AI innovation competition for students and startups
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
                          <th className="px-4 py-2 text-left">Organizer</th>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Participants</th>
                          <th className="px-4 py-2 text-left">Scope</th>
                          <th className="px-4 py-2 text-left">Prize Money</th>
                          <th className="px-4 py-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.organizer}</td>
                            <td className="px-4 py-2">{row.title}</td>
                            <td className="px-4 py-2">{row.date}</td>
                            <td className="px-4 py-2">{row.participants}</td>
                            <td className="px-4 py-2">{row.scope}</td>
                            <td className="px-4 py-2">{row.prizeMoney}</td>
                            <td className="px-4 py-2">{row.details}</td>
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

export default CompetitionsPage;
