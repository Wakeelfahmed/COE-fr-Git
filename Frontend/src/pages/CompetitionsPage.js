import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

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
    dateTo: ''
  });

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  useEffect(() => {
    fetchCompetitions();
  }, [showOnlyMine]);

  // Add Escape key listener to close modals
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showModal) {
          setShowModal(false);
        }
        if (showReportModal) {
          setShowReportModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, showReportModal]);

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions`, {
        params: { onlyMine: showOnlyMine }
      });
      setCompetitions(response.data);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      alert('Error fetching competitions. Please try again.');
    }
  };

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
           (filterCriteria.dateTo === '' || competition.date <= filterCriteria.dateTo);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Competitions</h2>
        <div>
          <button onClick={handleNewCompetition} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Competition
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
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
    </div>
  );
};

export default CompetitionsPage;
