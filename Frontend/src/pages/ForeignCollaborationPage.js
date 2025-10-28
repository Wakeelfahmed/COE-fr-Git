import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FaInfoCircle } from 'react-icons/fa';
import Select from 'react-select';
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

const countries = [
  { value: "Afghanistan", label: "Afghanistan" },
  { value: "Albania", label: "Albania" },
  { value: "Algeria", label: "Algeria" },
  { value: "Andorra", label: "Andorra" },
  { value: "Angola", label: "Angola" },
  { value: "Argentina", label: "Argentina" },
  { value: "Armenia", label: "Armenia" },
  { value: "Australia", label: "Australia" },
  { value: "Austria", label: "Austria" },
  { value: "Azerbaijan", label: "Azerbaijan" },
  { value: "Bahamas", label: "Bahamas" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "Barbados", label: "Barbados" },
  { value: "Belarus", label: "Belarus" },
  { value: "Belgium", label: "Belgium" },
  { value: "Belize", label: "Belize" },
  { value: "Benin", label: "Benin" },
  { value: "Bhutan", label: "Bhutan" },
  { value: "Bolivia", label: "Bolivia" },
  { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
  { value: "Botswana", label: "Botswana" },
  { value: "Brazil", label: "Brazil" },
  { value: "Brunei", label: "Brunei" },
  { value: "Bulgaria", label: "Bulgaria" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cambodia", label: "Cambodia" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Canada", label: "Canada" },
  { value: "Chad", label: "Chad" },
  { value: "Chile", label: "Chile" },
  { value: "China", label: "China" },
  { value: "Colombia", label: "Colombia" },
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "Croatia", label: "Croatia" },
  { value: "Cuba", label: "Cuba" },
  { value: "Cyprus", label: "Cyprus" },
  { value: "Czech Republic", label: "Czech Republic" },
  { value: "Denmark", label: "Denmark" },
  { value: "Dominican Republic", label: "Dominican Republic" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Egypt", label: "Egypt" },
  { value: "El Salvador", label: "El Salvador" },
  { value: "Estonia", label: "Estonia" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Fiji", label: "Fiji" },
  { value: "Finland", label: "Finland" },
  { value: "France", label: "France" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Georgia", label: "Georgia" },
  { value: "Germany", label: "Germany" },
  { value: "Ghana", label: "Ghana" },
  { value: "Greece", label: "Greece" },
  { value: "Guatemala", label: "Guatemala" },
  { value: "Guinea", label: "Guinea" },
  { value: "Haiti", label: "Haiti" },
  { value: "Honduras", label: "Honduras" },
  { value: "Hungary", label: "Hungary" },
  { value: "Iceland", label: "Iceland" },
  { value: "India", label: "India" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Iran", label: "Iran" },
  { value: "Iraq", label: "Iraq" },
  { value: "Ireland", label: "Ireland" },
  { value: "Israel", label: "Israel" },
  { value: "Italy", label: "Italy" },
  { value: "Jamaica", label: "Jamaica" },
  { value: "Japan", label: "Japan" },
  { value: "Jordan", label: "Jordan" },
  { value: "Kazakhstan", label: "Kazakhstan" },
  { value: "Kenya", label: "Kenya" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Kyrgyzstan", label: "Kyrgyzstan" },
  { value: "Laos", label: "Laos" },
  { value: "Latvia", label: "Latvia" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Lithuania", label: "Lithuania" },
  { value: "Luxembourg", label: "Luxembourg" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Maldives", label: "Maldives" },
  { value: "Mali", label: "Mali" },
  { value: "Malta", label: "Malta" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Mexico", label: "Mexico" },
  { value: "Moldova", label: "Moldova" },
  { value: "Monaco", label: "Monaco" },
  { value: "Mongolia", label: "Mongolia" },
  { value: "Montenegro", label: "Montenegro" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Myanmar", label: "Myanmar" },
  { value: "Namibia", label: "Namibia" },
  { value: "Nepal", label: "Nepal" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Nicaragua", label: "Nicaragua" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "North Korea", label: "North Korea" },
  { value: "North Macedonia", label: "North Macedonia" },
  { value: "Norway", label: "Norway" },
  { value: "Oman", label: "Oman" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "Palestine", label: "Palestine" },
  { value: "Panama", label: "Panama" },
  { value: "Papua New Guinea", label: "Papua New Guinea" },
  { value: "Paraguay", label: "Paraguay" },
  { value: "Peru", label: "Peru" },
  { value: "Philippines", label: "Philippines" },
  { value: "Poland", label: "Poland" },
  { value: "Portugal", label: "Portugal" },
  { value: "Qatar", label: "Qatar" },
  { value: "Romania", label: "Romania" },
  { value: "Russia", label: "Russia" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Senegal", label: "Senegal" },
  { value: "Serbia", label: "Serbia" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Singapore", label: "Singapore" },
  { value: "Slovakia", label: "Slovakia" },
  { value: "Slovenia", label: "Slovenia" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Korea", label: "South Korea" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Spain", label: "Spain" },
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "Sudan", label: "Sudan" },
  { value: "Suriname", label: "Suriname" },
  { value: "Sweden", label: "Sweden" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Syria", label: "Syria" },
  { value: "Taiwan", label: "Taiwan" },
  { value: "Tajikistan", label: "Tajikistan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Thailand", label: "Thailand" },
  { value: "Togo", label: "Togo" },
  { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Turkey", label: "Turkey" },
  { value: "Turkmenistan", label: "Turkmenistan" },
  { value: "Uganda", label: "Uganda" },
  { value: "Ukraine", label: "Ukraine" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
  { value: "Uruguay", label: "Uruguay" },
  { value: "Uzbekistan", label: "Uzbekistan" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Yemen", label: "Yemen" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" }
];

const CollaborationPage = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCollaboration, setCurrentCollaboration] = useState({
    memberOfCoE: '',
    collaboratingForeignResearcher: '',
    foreignCollaboratingInstitute: '',
    collaboratingCountry: '',
    collaborationScope: 'local',
    typeOfCollaboration: '',
    otherTypeDescription: '',
    durationStart: '',
    durationEnd: '',
    currentStatus: '',
    keyOutcomes: '',
    detailsOfOutcome: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showKeyOutcomesHint, setShowKeyOutcomesHint] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    memberOfCoE: '',
    collaboratingForeignResearcher: '', // Changed from 'foreignResearcher'
    collaboratingCountry: '', // Changed from 'country'
    currentStatus: '', // Changed from 'status'
    collaborationScope: '',
    accountFilter: '', // Add account filter
    dateFrom: '',
    dateTo: ''
  });

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    fetchCollaborations();
  }, [showOnlyMine, filterCriteria]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal && !showExcelModal) 
{        handleNewCollaboration();
      } else if (e.key === 'E' && e.ctrlKey && !showModal && !showReportModal && !showExcelModal) {
        setShowExcelModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal, showExcelModal]);
  const fetchCollaborations = async () => {
    try {
      const params = { onlyMine: showOnlyMine };

      // Add filter parameters if they have values
      if (filterCriteria.memberOfCoE) params.memberOfCoE = filterCriteria.memberOfCoE;
      if (filterCriteria.collaboratingForeignResearcher) params.collaboratingForeignResearcher = filterCriteria.collaboratingForeignResearcher;
      if (filterCriteria.collaboratingCountry) params.collaboratingCountry = filterCriteria.collaboratingCountry;
      if (filterCriteria.currentStatus) params.currentStatus = filterCriteria.currentStatus;
      if (filterCriteria.collaborationScope) params.collaborationScope = filterCriteria.collaborationScope;
      if (filterCriteria.accountFilter) params.accountFilter = filterCriteria.accountFilter;
      if (filterCriteria.dateFrom) params.dateFrom = filterCriteria.dateFrom;
      if (filterCriteria.dateTo) params.dateTo = filterCriteria.dateTo;

      const response = await axios.get(`${API_BASE_URL}/collaborations`, { params });
      setCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      alert('Error fetching collaborations. Please try again.');
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/accounts`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleNewCollaboration = () => {
    setIsEditMode(false);
    setCurrentCollaboration({
      memberOfCoE: '',
      collaboratingForeignResearcher: '',
      foreignCollaboratingInstitute: '',
      collaboratingCountry: '',
      collaborationScope: 'local', // Default to local
      typeOfCollaboration: '',
      otherTypeDescription: '',
      durationStart: '',
      durationEnd: '',
      currentStatus: '',
      keyOutcomes: '',
      detailsOfOutcome: ''
    });
    setShowModal(true);
  };

  const handleEditCollaboration = (collaboration) => {
    console.log('=== EDIT COLLABORATION STARTED ===');
    console.log('Original collaboration data:', collaboration);
    console.log('Collaboration ID:', collaboration._id);
    console.log('Collaboration scope:', collaboration.collaborationScope);
    console.log('Collaborating country:', collaboration.collaboratingCountry);
    console.log('Duration start:', collaboration.durationStart);
    console.log('Duration end:', collaboration.durationEnd);
    
    setIsEditMode(true);
    
    const formattedCollaboration = {
      ...collaboration,
      // Set default collaborationScope if not present (for backward compatibility)
      collaborationScope: collaboration.collaborationScope || 'foreign',
      durationStart: collaboration.durationStart ? new Date(collaboration.durationStart).toISOString().split('T')[0] : '',
      durationEnd: collaboration.durationEnd ? new Date(collaboration.durationEnd).toISOString().split('T')[0] : ''
    };
    
    console.log('Formatted collaboration for editing:', formattedCollaboration);
    setCurrentCollaboration(formattedCollaboration);
    setShowModal(true);
    console.log('Edit modal opened');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed - ${name}:`, value);

    if (name === 'collaborationScope' && value === 'local') {
      // Clear country when switching to local
      console.log('Switching to local collaboration - clearing country field');
      setCurrentCollaboration(prev => ({
        ...prev,
        [name]: value,
        collaboratingCountry: '' // Clear country field
      }));
    } else {
      setCurrentCollaboration(prev => {
        const updated = { ...prev, [name]: value };
        console.log('Updated collaboration state:', updated);
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== SUBMIT COLLABORATION ===');
    console.log('Is Edit Mode:', isEditMode);
    console.log('Current collaboration state:', currentCollaboration);

    // Prepare the data based on collaboration scope
    const submissionData = {
      ...currentCollaboration
    };

    // Remove country field if it's a local collaboration
    if (currentCollaboration.collaborationScope === 'local') {
      console.log('Local collaboration - removing country field');
      delete submissionData.collaboratingCountry;
    }

    console.log('Submission data prepared:', submissionData);

    try {
      if (isEditMode) {
        console.log('Updating collaboration with ID:', currentCollaboration._id);
        console.log('API endpoint:', `${API_BASE_URL}/collaborations/${currentCollaboration._id}`);
        const response = await axios.put(`${API_BASE_URL}/collaborations/${currentCollaboration._id}`, submissionData);
        console.log('Update response:', response.data);
        console.log('Collaboration updated successfully');
      } else {
        console.log('Creating new collaboration');
        console.log('API endpoint:', `${API_BASE_URL}/collaborations`);
        const response = await axios.post(`${API_BASE_URL}/collaborations`, submissionData);
        console.log('Create response:', response.data);
        console.log('Collaboration created successfully');
      }
      setShowModal(false);
      console.log('Modal closed, fetching updated collaborations...');
      fetchCollaborations();
    } catch (error) {
      console.error('=== ERROR SAVING COLLABORATION ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error stack:', error.stack);
      alert('Error saving collaboration. Please try again.');
    }
  };

  const handleDeleteCollaboration = async (collaborationId) => {
    if (window.confirm('Are you sure you want to delete this collaboration?')) {
      try {
        await axios.delete(`${API_BASE_URL}/collaborations/${collaborationId}`);
        fetchCollaborations();
      } catch (error) {
        console.error('Error deleting collaboration:', error);
        alert('Error deleting collaboration. Please try again.');
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
      memberOfCoE: '',
      collaboratingForeignResearcher: '',
      collaboratingCountry: '',
      currentStatus: '',
      collaborationScope: '',
      accountFilter: '',
      dateFrom: '',
      dateTo: ''
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
        sourceType: 'Collaborations',
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
              memberOfCoE: row['Member of CoE-AI'] || row['memberOfCoE'] || '',
              collaboratingForeignResearcher: row['Collaborating Researcher'] || row['collaboratingForeignResearcher'] || '',
              foreignCollaboratingInstitute: row['Collaborating Institute'] || row['foreignCollaboratingInstitute'] || '',
              collaboratingCountry: row['Collaborating Country'] || row['collaboratingCountry'] || '',
              collaborationScope: row['Collaboration Scope'] || row['collaborationScope'] || 'foreign',
              typeOfCollaboration: row['Type of Collaboration'] || row['typeOfCollaboration'] || '',
              otherTypeDescription: row['Other Type Description'] || row['otherTypeDescription'] || '',
              durationStart: row['Duration Start Date'] || row['durationStart'] || '',
              durationEnd: row['Duration End Date'] || row['durationEnd'] || '',
              currentStatus: row['Current Status'] || row['currentStatus'] || '',
              keyOutcomes: row['Key Outcomes'] || row['keyOutcomes'] || '',
              detailsOfOutcome: row['Details of Outcome'] || row['detailsOfOutcome'] || ''
            };

            // Validate required fields
            if (!mappedRow.memberOfCoE || !mappedRow.collaboratingForeignResearcher || !mappedRow.foreignCollaboratingInstitute) {
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
        if (!row.memberOfCoE || !row.collaboratingForeignResearcher || !row.foreignCollaboratingInstitute) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Member of CoE-AI, Collaborating Researcher, or Collaborating Institute)`);
          continue;
        }

        try {
          await axios.post(`${API_BASE_URL}/collaborations`, row);
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
      fetchCollaborations(); // Refresh the data
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
        'Member of CoE-AI': 'Dr. Sarah Johnson',
        'Collaborating Researcher': 'Prof. Michael Chen',
        'Collaborating Institute': 'MIT AI Lab',
        'Collaboration Scope': 'foreign',
        'Collaborating Country': 'United States',
        'Type of Collaboration': 'Joint Publication',
        'Duration Start Date': '2024-01-15',
        'Duration End Date': '2024-12-15',
        'Current Status': 'Ongoing',
        'Key Outcomes': 'Joint research paper on machine learning algorithms',
        'Details of Outcome': 'Published in Nature AI journal, cited 50+ times'
      },
      {
        'Member of CoE-AI': 'Dr. Ahmed Hassan',
        'Collaborating Researcher': 'Dr. Maria Rodriguez',
        'Collaborating Institute': 'University of Barcelona',
        'Collaboration Scope': 'foreign',
        'Collaborating Country': 'Spain',
        'Type of Collaboration': 'Research Grant Proposal',
        'Duration Start Date': '2024-02-01',
        'Duration End Date': '2024-08-01',
        'Current Status': 'Under Review',
        'Key Outcomes': 'Submitted EU Horizon 2024 grant proposal',
        'Details of Outcome': 'Proposal for sustainable AI development in agriculture'
      },
      {
        'Member of CoE-AI': 'Dr. Fatima Khan',
        'Collaborating Researcher': 'Dr. John Smith',
        'Collaborating Institute': 'Stanford University',
        'Collaboration Scope': 'foreign',
        'Collaborating Country': 'United States',
        'Type of Collaboration': 'Technology Development / Prototype',
        'Duration Start Date': '2024-03-01',
        'Duration End Date': '',
        'Current Status': 'Ongoing',
        'Key Outcomes': 'Developing AI-powered healthcare diagnostic tool',
        'Details of Outcome': 'Prototype in development, expected completion Q4 2024'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Collaborations');

    // Generate and download file
    XLSX.writeFile(wb, 'sample_collaborations.xlsx');
  };

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setExcelData([]);
  };

  const filteredCollaborations = collaborations;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Collaboration</h2>
        <div>
          <button onClick={handleNewCollaboration} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Collaboration
          </button>
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            Upload from Excel
          </button>
          {user?.role === 'director' && (
            <button 
              onClick={() => setShowOnlyMine(!showOnlyMine)} 
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Collaborations' : 'My Collaborations'}
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
              placeholder="Filter by Member of CoE"
              name="memberOfCoE"
              value={filterCriteria.memberOfCoE}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Researcher"
              name="collaboratingForeignResearcher"
              value={filterCriteria.collaboratingForeignResearcher}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <select
              name="collaborationScope"
              value={filterCriteria.collaborationScope}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Scopes</option>
              <option value="local">Local</option>
              <option value="foreign">Foreign</option>
            </select>
            <Select
              name="collaboratingCountry"
              value={countries.find(c => c.value === filterCriteria.collaboratingCountry)}
              onChange={(selectedOption) => handleFilterChange({ target: { name: 'collaboratingCountry', value: selectedOption ? selectedOption.value : '' } })}
              options={countries}
              isSearchable={true}
              placeholder="All Countries"
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
            />
            <input
              type="text"
              placeholder="Filter by Status"
              name="currentStatus"
              value={filterCriteria.currentStatus}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            {user?.role === 'director' && (
              <AccountFilter
                value={filterCriteria.accountFilter}
                onChange={handleFilterChange}
              />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member of CoE-AI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Researcher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Outcomes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCollaborations.map((collab, index) => (
              <tr key={collab._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.memberOfCoE}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.collaboratingForeignResearcher}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.foreignCollaboratingInstitute}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (collab.collaborationScope || 'foreign') === 'foreign'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {(collab.collaborationScope || 'foreign') === 'foreign' ? 'Foreign' : 'Local'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.collaboratingCountry || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {collab.typeOfCollaboration === 'Other' && collab.otherTypeDescription
                    ? `Other: ${collab.otherTypeDescription}`
                    : collab.typeOfCollaboration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(collab.durationStart).toLocaleDateString()} - {collab.durationEnd ? new Date(collab.durationEnd).toLocaleDateString() : 'Ongoing'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.currentStatus}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.keyOutcomes || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate" title={collab.detailsOfOutcome}>{collab.detailsOfOutcome || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditCollaboration(collab)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteCollaboration(collab._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Collaboration' : 'New Collaboration'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="memberOfCoE">
                    Member of CoE-AI
                  </label>
                  <input
                    type="text"
                    id="memberOfCoE"
                    name="memberOfCoE"
                    value={currentCollaboration.memberOfCoE}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collaboratingForeignResearcher">
                    Collaborating Researcher
                  </label>
                  <input
                    type="text"
                    id="collaboratingForeignResearcher"
                    name="collaboratingForeignResearcher"
                    value={currentCollaboration.collaboratingForeignResearcher}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foreignCollaboratingInstitute">
                    Collaborating Institute
                  </label>
                  <input
                    type="text"
                    id="foreignCollaboratingInstitute"
                    name="foreignCollaboratingInstitute"
                    value={currentCollaboration.foreignCollaboratingInstitute}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collaborationScope">
                    Collaboration Scope
                  </label>
                  <select
                    id="collaborationScope"
                    name="collaborationScope"
                    value={currentCollaboration.collaborationScope}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="local">Local</option>
                    <option value="foreign">Foreign</option>
                  </select>
                </div>
                {currentCollaboration.collaborationScope === 'foreign' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collaboratingCountry">
                      Collaborating Country
                    </label>
                    <Select
                      id="collaboratingCountry"
                      name="collaboratingCountry"
                      value={countries.find(c => c.value === currentCollaboration.collaboratingCountry)}
                      onChange={(selectedOption) => handleInputChange({ target: { name: 'collaboratingCountry', value: selectedOption ? selectedOption.value : '' } })}
                      options={countries}
                      isSearchable={true}
                      placeholder="Select or search country..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      required={currentCollaboration.collaborationScope === 'foreign'}
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="typeOfCollaboration">
                    Type of Collaboration
                  </label>
                  <select
                    id="typeOfCollaboration"
                    name="typeOfCollaboration"
                    value={currentCollaboration.typeOfCollaboration}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Joint Publication">Joint Publication</option>
                    <option value="Funded Research Project">Funded Research Project</option>
                    <option value="Research Grant Proposal">Research Grant Proposal</option>
                    <option value="Technology Development / Prototype">Technology Development / Prototype</option>
                    <option value="Exchange / Fellowship / Visiting Position">Exchange / Fellowship / Visiting Position</option>
                    <option value="Joint Supervision (PhD/MS/BS)">Joint Supervision (PhD/MS/BS)</option>
                    <option value="Data Sharing">Data Sharing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {currentCollaboration.typeOfCollaboration === 'Other' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherTypeDescription">
                      Please specify the type of collaboration
                    </label>
                    <input
                      type="text"
                      id="otherTypeDescription"
                      name="otherTypeDescription"
                      value={currentCollaboration.otherTypeDescription || ''}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter the specific type of collaboration"
                      required
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentStatus">
                    Current Status
                  </label>
                  <select
                    id="currentStatus"
                    name="currentStatus"
                    value={currentCollaboration.currentStatus}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="durationStart">
                    Duration Start Date
                  </label>
                  <input
                    type="date"
                    id="durationStart"
                    name="durationStart"
                    value={currentCollaboration.durationStart}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="durationEnd">
                    Duration End Date {currentCollaboration.currentStatus === 'Ongoing' && <span className="text-gray-500 font-normal">(Optional for Ongoing)</span>}
                  </label>
                  <input
                    type="date"
                    id="durationEnd"
                    name="durationEnd"
                    value={currentCollaboration.durationEnd}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required={currentCollaboration.currentStatus !== 'Ongoing'}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <label className="block text-gray-700 text-sm font-bold" htmlFor="keyOutcomes">
                    Key Outcomes
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeyOutcomesHint(!showKeyOutcomesHint)}
                    className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                    title="Show examples"
                  >
                    <FaInfoCircle className="w-4 h-4" />
                  </button>
                </div>
                {showKeyOutcomesHint && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Publications (with citation details)</li>
                      <li>Patents / IP filings</li>
                      <li>Developed Prototypes / Solutions</li>
                      <li>Joint Events / Workshops</li>
                      <li>Technology Transfer</li>
                      <li>Student Exchange Programs</li>
                    </ul>
                  </div>
                )}
                <textarea
                  id="keyOutcomes"
                  name="keyOutcomes"
                  value={currentCollaboration.keyOutcomes}
                  onChange={handleInputChange}
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailsOfOutcome">
                  Details of the Outcome
                </label>
                <textarea
                  id="detailsOfOutcome"
                  name="detailsOfOutcome"
                  value={currentCollaboration.detailsOfOutcome}
                  onChange={handleInputChange}
                  rows="3"
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

      {showExcelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Upload Collaborations from Excel
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
                  Member of CoE-AI, Collaborating Researcher, Collaborating Institute, Collaboration Scope, Collaborating Country, Type of Collaboration, Duration Start Date, Duration End Date, Current Status, Key Outcomes, Details of Outcome<br/>
                  <br/>
                  <strong>Column Details:</strong><br/>
                  • <strong>Member of CoE-AI:</strong> Name of CoE-AI member<br/>
                  • <strong>Collaborating Researcher:</strong> Name of collaborating researcher<br/>
                  • <strong>Collaborating Institute:</strong> Institute/organization of collaborator<br/>
                  • <strong>Collaboration Scope:</strong> foreign or local<br/>
                  • <strong>Collaborating Country:</strong> Country (required for foreign scope)<br/>
                  • <strong>Type of Collaboration:</strong> Joint Publication, Funded Research, etc.<br/>
                  • <strong>Duration Start Date:</strong> Start date of collaboration<br/>
                  • <strong>Duration End Date:</strong> End date (optional for ongoing)<br/>
                  • <strong>Current Status:</strong> Ongoing, Completed, Submitted, Under Review<br/>
                  • <strong>Key Outcomes:</strong> Brief description of outcomes<br/>
                  • <strong>Details of Outcome:</strong> Detailed outcome description<br/>
                  <br/>
                  <strong>Sample first row:</strong><br/>
                  Member of CoE-AI: Dr. Sarah Johnson, Collaborating Researcher: Prof. Michael Chen, Collaborating Institute: MIT AI Lab, Collaboration Scope: foreign, Collaborating Country: United States, Type of Collaboration: Joint Publication, Duration Start Date: 2024-01-15, Duration End Date: 2024-12-15, Current Status: Ongoing, Key Outcomes: Joint research paper on machine learning algorithms, Details of Outcome: Published in Nature AI journal, cited 50+ times
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
                          <th className="px-4 py-2 text-left">Member of CoE-AI</th>
                          <th className="px-4 py-2 text-left">Collaborating Researcher</th>
                          <th className="px-4 py-2 text-left">Institute</th>
                          <th className="px-4 py-2 text-left">Scope</th>
                          <th className="px-4 py-2 text-left">Country</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Key Outcomes</th>
                          <th className="px-4 py-2 text-left">Outcome Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{row.memberOfCoE}</td>
                            <td className="px-4 py-2">{row.collaboratingForeignResearcher}</td>
                            <td className="px-4 py-2">{row.foreignCollaboratingInstitute}</td>
                            <td className="px-4 py-2">{row.collaborationScope}</td>
                            <td className="px-4 py-2">{row.collaboratingCountry}</td>
                            <td className="px-4 py-2">{row.typeOfCollaboration}</td>
                            <td className="px-4 py-2">{row.currentStatus}</td>
                            <td className="px-4 py-2">{row.keyOutcomes}</td>
                            <td className="px-4 py-2 max-w-xs truncate" title={row.detailsOfOutcome}>{row.detailsOfOutcome}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan="9" className="px-4 py-2 text-center text-gray-600">
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

export default CollaborationPage;
