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

const TrainingsConductedPage = () => {
  const [trainings, setTrainings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentTraining, setCurrentTraining] = useState({
    attendees: '',
    numberOfAttendees: '',
    organizer: '',
    resourcePersons: '',
    date: '',
    targetSDG: [],
    totalRevenueGenerated: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    attendees: '',
    numberOfAttendees: '',
    organizer: '',
    resourcePersons: '',
    targetSDG: '',
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
    fetchTrainings();
  }, [showOnlyMine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) 
{        handleNewTraining();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);

  const fetchTrainings = async () => {
    // console.log('=== FETCHING TRAININGS CONDUCTED ===');
    // console.log('Show Only Mine:', showOnlyMine);
    // console.log('API URL:', `${API_BASE_URL}/trainings-conducted`);
    try {
      const response = await axios.get(`${API_BASE_URL}/trainings-conducted`, {
        params: { onlyMine: showOnlyMine }
      });
      // console.log('Trainings conducted fetched:', response.data.length, 'records');
      // console.log('Trainings conducted data:', response.data);
      setTrainings(response.data);
    } catch (error) {
      console.error('=== ERROR FETCHING TRAININGS CONDUCTED ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      alert('Error fetching trainings conducted. Please try again.');
    }
  };

  const handleNewTraining = () => {
    setIsEditMode(false);
    setCurrentTraining({
      attendees: '',
      numberOfAttendees: '',
      organizer: '',
      resourcePersons: '',
      date: '',
      targetSDG: [],
      totalRevenueGenerated: ''
    });
    setShowModal(true);
  };

  const handleEditTraining = (training) => {
    setIsEditMode(true);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    };

    setCurrentTraining({
      ...training,
      date: formatDateForInput(training.date)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetSDG') {
      // Handle multiple selections for SDGs
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentTraining(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setCurrentTraining(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('=== TRAINING CONDUCTED SUBMIT DEBUG ===');
    // console.log('Is Edit Mode:', isEditMode);
    // console.log('Training Data:', currentTraining);
    // console.log('API URL:', `${API_BASE_URL}/trainings-conducted${isEditMode ? '/' + currentTraining._id : ''}`);

    try {
      let response;
      if (isEditMode) {
        console.log('Sending PUT request...');
        response = await axios.put(`${API_BASE_URL}/trainings-conducted/${currentTraining._id}`, currentTraining);
      } else {
        console.log('Sending POST request...');
        response = await axios.post(`${API_BASE_URL}/trainings-conducted`, currentTraining);
      }
      console.log('Response:', response.data);
      console.log('Training conducted saved successfully!');
      setShowModal(false);
      fetchTrainings();
    } catch (error) {
      console.error('=== ERROR SAVING TRAINING CONDUCTED ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      alert('Error saving training conducted. Please try again.');
    }
  };

  const handleDeleteTraining = async (trainingId) => {
    if (window.confirm('Are you sure you want to delete this training conducted?')) {
      try {
        await axios.delete(`${API_BASE_URL}/trainings-conducted/${trainingId}`);
        fetchTrainings();
      } catch (error) {
        console.error('Error deleting training conducted:', error);
        alert('Error deleting training conducted. Please try again.');
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
      attendees: '',
      numberOfAttendees: '',
      organizer: '',
      resourcePersons: '',
      targetSDG: '',
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
        sourceType: 'Trainings',
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
              attendees: row['Attendees'] || row['attendees'] || '',
              numberOfAttendees: row['Number of Attendees'] || row['numberOfAttendees'] || row['NumberOfAttendees'] || '',
              organizer: row['Organizer'] || row['organizer'] || '',
              resourcePersons: row['Resource Persons'] || row['resourcePersons'] || row['ResourcePersons'] || '',
              date: row['Date'] || row['date'] || '',
              targetSDG: [],
              totalRevenueGenerated: row['Total Revenue Generated'] || row['totalRevenueGenerated'] || row['TotalRevenueGenerated'] || ''
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
            if (!mappedRow.attendees || !mappedRow.organizer) {
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
        if (!row.attendees || !row.organizer) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Attendees or Organizer)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/trainings-conducted`, row);
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
      fetchTrainings(); // Refresh the data
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
        'Attendees': 'Faculty, Students',
        'Number of Attendees': 50,
        'Organizer': 'AI Research Center',
        'Resource Persons': 'Dr. Sarah Johnson, Prof. Michael Chen',
        'Date': '2024-01-15',
        'Target SDG': 'SDG 4, SDG 9',
        'Total Revenue Generated': 50000
      },
      {
        'Attendees': 'Industry Professionals',
        'Number of Attendees': 25,
        'Organizer': 'Tech Solutions Inc.',
        'Resource Persons': 'Dr. Ahmed Hassan',
        'Date': '2024-02-20',
        'Target SDG': 'SDG 8, SDG 17',
        'Total Revenue Generated': 75000
      },
      {
        'Attendees': 'Graduate Students',
        'Number of Attendees': 30,
        'Organizer': 'Computer Science Department',
        'Resource Persons': 'Dr. Maria Rodriguez',
        'Date': '2024-03-10',
        'Target SDG': 'SDG 4, SDG 9',
        'Total Revenue Generated': 30000
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainings_Conducted');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_trainings_conducted.xlsx');
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

  const filteredTrainings = trainings.filter(training => {
    const numberOfAttendeesMatch = !filterCriteria.numberOfAttendees ||
      (training.numberOfAttendees && training.numberOfAttendees.toString().includes(filterCriteria.numberOfAttendees.toString()));

    const trainingDate = training.date ? new Date(training.date) : null;
    const hasFrom = !!filterCriteria.dateFrom;
    const hasTo = !!filterCriteria.dateTo;
    const fromDate = hasFrom ? new Date(filterCriteria.dateFrom) : null;
    const toDate = hasTo ? new Date(filterCriteria.dateTo) : null;

    const passDateFilters = (!hasFrom || (trainingDate && trainingDate >= fromDate)) &&
                           (!hasTo || (trainingDate && trainingDate <= toDate));

    const targetSDGMatch = !filterCriteria.targetSDG ||
      (training.targetSDG && training.targetSDG.some(sdg => sdg.toLowerCase().includes(filterCriteria.targetSDG.toLowerCase())));

    return (training.attendees || '').toLowerCase().includes((filterCriteria.attendees || '').toLowerCase()) &&
           numberOfAttendeesMatch &&
           (training.organizer || '').toLowerCase().includes((filterCriteria.organizer || '').toLowerCase()) &&
           (training.resourcePersons || '').toLowerCase().includes((filterCriteria.resourcePersons || '').toLowerCase()) &&
           targetSDGMatch &&
           passDateFilters &&
           (filterCriteria.accountFilter === '' || (training.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Trainings Conducted</h2>
        <div>
          <button onClick={handleNewTraining} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Training Conducted
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Trainings' : 'My Trainings'}
            </button>
          )}
          <button onClick={toggleFilters} className="border border-blue-600 text-blue-600 px-4 py-2 rounded">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 mb-2">
            <input
              type="text"
              placeholder="Filter by Attendees"
              name="attendees"
              value={filterCriteria.attendees}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Filter by # of Attendees"
              name="numberOfAttendees"
              value={filterCriteria.numberOfAttendees}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              min="0"
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
              placeholder="Filter by Resource Persons"
              name="resourcePersons"
              value={filterCriteria.resourcePersons}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
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
            <select
              name="targetSDG"
              value={filterCriteria.targetSDG}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All SDGs</option>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># of Attendees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Persons</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target SDG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue Generated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTrainings.map((training, index) => (
              <tr key={training._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{training.attendees}</td>
                <td className="px-6 py-4 whitespace-nowrap">{training.numberOfAttendees || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{training.organizer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{training.resourcePersons}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(training.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{training.targetSDG ? training.targetSDG.join(', ') : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">Rs. {training.totalRevenueGenerated?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditTraining(training)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteTraining(training._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Training Conducted' : 'New Training Conducted'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attendees">
                    Attendees <span className="text-gray-500 font-normal">(Faculty, Students, etc.)</span>
                  </label>
                  <input
                    type="text"
                    id="attendees"
                    name="attendees"
                    value={currentTraining.attendees}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfAttendees">
                    # of Attendees
                  </label>
                  <input
                    type="number"
                    id="numberOfAttendees"
                    name="numberOfAttendees"
                    value={currentTraining.numberOfAttendees}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
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
                    value={currentTraining.organizer}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resourcePersons">
                    Resource Persons <span className="text-gray-500 font-normal">(Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    id="resourcePersons"
                    name="resourcePersons"
                    value={currentTraining.resourcePersons}
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
                    value={currentTraining.date}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalRevenueGenerated">
                    Total Revenue Generated <span className="text-gray-500 font-normal">(Optional, if applicable)</span>
                  </label>
                  <input
                    type="number"
                    id="totalRevenueGenerated"
                    name="totalRevenueGenerated"
                    value={currentTraining.totalRevenueGenerated}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    step="0.01"
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
                  value={currentTraining.targetSDG}
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
              Upload Trainings Conducted from Excel
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
                  Attendees, Organizer, Resource Persons, Date, Target SDG<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Attendees:</strong> Who attended (Faculty, Students, etc.)<br/>
                  • <strong>Organizer:</strong> Organization hosting the training<br/>
                  • <strong>Resource Persons:</strong> Speakers/trainers (comma-separated)<br/>
                  • <strong>Date:</strong> Training date (YYYY-MM-DD or readable format)<br/>
                  • <strong>Target SDG:</strong> SDG goals (can be comma-separated)<br/>
                  • <strong>Number of Attendees:</strong> Total number of attendees<br/>
                  • <strong>Total Revenue Generated:</strong> Revenue generated (optional)<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Attendees: Faculty, Students, Organizer: AI Research Center, Resource Persons: Dr. Sarah Johnson, Prof. Michael Chen, Date: 2024-01-15, Target SDG: SDG 4, SDG 9, Number of Attendees: 50, Total Revenue Generated: 50000
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
                          <th className="px-4 py-2 text-left">Attendees</th>
                          <th className="px-4 py-2 text-left"># Attendees</th>
                          <th className="px-4 py-2 text-left">Organizer</th>
                          <th className="px-4 py-2 text-left">Resource Persons</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Target SDG</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.attendees}</td>
                            <td className="px-4 py-2">{row.numberOfAttendees}</td>
                            <td className="px-4 py-2">{row.organizer}</td>
                            <td className="px-4 py-2">{row.resourcePersons}</td>
                            <td className="px-4 py-2">{row.date}</td>
                            <td className="px-4 py-2">{row.targetSDG.join(', ')}</td>
                            <td className="px-4 py-2">{row.totalRevenueGenerated}</td>
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

export default TrainingsConductedPage;
