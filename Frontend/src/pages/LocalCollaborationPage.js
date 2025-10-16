import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FaInfoCircle } from 'react-icons/fa';

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const LocalCollaborationPage = () => {
  const [localCollaborations, setLocalCollaborations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentLocalCollaboration, setCurrentLocalCollaboration] = useState({
    memberOfCoE: '',
    collaboratingLocalResearcher: '',
    localCollaboratingInstitute: '',
    typeOfCollaboration: '',
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
  const [filterCriteria, setFilterCriteria] = useState({
    memberOfCoE: '',
    localResearcher: '',
    institute: '',
    status: ''
  });

  useEffect(() => {
    fetchLocalCollaborations();
  }, [showOnlyMine]);

  const fetchLocalCollaborations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/local-collaborations`, {
        params: { onlyMine: showOnlyMine }
      });
      setLocalCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching local collaborations:', error);
      alert('Error fetching local collaborations. Please try again.');
    }
  };

  const handleNewLocalCollaboration = () => {
    setIsEditMode(false);
    setCurrentLocalCollaboration({
      memberOfCoE: '',
      collaboratingLocalResearcher: '',
      localCollaboratingInstitute: '',
      typeOfCollaboration: '',
      durationStart: '',
      durationEnd: '',
      currentStatus: '',
      keyOutcomes: '',
      detailsOfOutcome: ''
    });
    setShowModal(true);
  };

  const handleEditLocalCollaboration = (localCollaboration) => {
    setIsEditMode(true);
    setCurrentLocalCollaboration({
      ...localCollaboration,
      durationStart: localCollaboration.durationStart ? new Date(localCollaboration.durationStart).toISOString().split('T')[0] : '',
      durationEnd: localCollaboration.durationEnd ? new Date(localCollaboration.durationEnd).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLocalCollaboration(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/local-collaborations/${currentLocalCollaboration._id}`, currentLocalCollaboration);
      } else {
        await axios.post(`${API_BASE_URL}/local-collaborations`, currentLocalCollaboration);
      }
      setShowModal(false);
      fetchLocalCollaborations();
    } catch (error) {
      console.error('Error saving local collaboration:', error);
      alert('Error saving local collaboration. Please try again.');
    }
  };

  const handleDeleteLocalCollaboration = async (localCollaborationId) => {
    if (window.confirm('Are you sure you want to delete this local collaboration?')) {
      try {
        await axios.delete(`${API_BASE_URL}/local-collaborations/${localCollaborationId}`);
        fetchLocalCollaborations();
      } catch (error) {
        console.error('Error deleting local collaboration:', error);
        alert('Error deleting local collaboration. Please try again.');
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
      localResearcher: '',
      institute: '',
      status: ''
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
        sourceType: 'LocalCollaborations',
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

  const filteredLocalCollaborations = localCollaborations.filter(collab => {
    return collab.memberOfCoE.toLowerCase().includes(filterCriteria.memberOfCoE.toLowerCase()) &&
           collab.collaboratingLocalResearcher.toLowerCase().includes(filterCriteria.localResearcher.toLowerCase()) &&
           collab.localCollaboratingInstitute.toLowerCase().includes(filterCriteria.institute.toLowerCase()) &&
           collab.currentStatus.toLowerCase().includes(filterCriteria.status.toLowerCase());
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Local Collaborations</h2>
        <div>
          <button onClick={handleNewLocalCollaboration} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Local Collaboration
          </button>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              {showOnlyMine ? 'All Local Collaborations' : 'My Local Collaborations'}
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
              placeholder="Filter by Member of CoE"
              name="memberOfCoE"
              value={filterCriteria.memberOfCoE}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Local Researcher"
              name="localResearcher"
              value={filterCriteria.localResearcher}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Institute"
              name="institute"
              value={filterCriteria.institute}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Status"
              name="status"
              value={filterCriteria.status}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Researcher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Institute</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLocalCollaborations.map((collab, index) => (
              <tr key={collab._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.memberOfCoE}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.collaboratingLocalResearcher}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.localCollaboratingInstitute}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.typeOfCollaboration}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(collab.durationStart).toLocaleDateString()} - {collab.durationEnd ? new Date(collab.durationEnd).toLocaleDateString() : 'Ongoing'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.currentStatus}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEditLocalCollaboration(collab)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onClick={() => handleDeleteLocalCollaboration(collab._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              {isEditMode ? 'Edit Local Collaboration' : 'New Local Collaboration'}
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
                    value={currentLocalCollaboration.memberOfCoE}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collaboratingLocalResearcher">
                    Collaborating Local Researcher
                  </label>
                  <input
                    type="text"
                    id="collaboratingLocalResearcher"
                    name="collaboratingLocalResearcher"
                    value={currentLocalCollaboration.collaboratingLocalResearcher}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="localCollaboratingInstitute">
                    Local Collaborating Institute
                  </label>
                  <input
                    type="text"
                    id="localCollaboratingInstitute"
                    name="localCollaboratingInstitute"
                    value={currentLocalCollaboration.localCollaboratingInstitute}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="typeOfCollaboration">
                    Type of Collaboration
                  </label>
                  <select
                    id="typeOfCollaboration"
                    name="typeOfCollaboration"
                    value={currentLocalCollaboration.typeOfCollaboration}
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
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentStatus">
                    Current Status
                  </label>
                  <select
                    id="currentStatus"
                    name="currentStatus"
                    value={currentLocalCollaboration.currentStatus}
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
                    value={currentLocalCollaboration.durationStart}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="durationEnd">
                    Duration End Date {currentLocalCollaboration.currentStatus === 'Ongoing' && <span className="text-gray-500 font-normal">(Optional for Ongoing)</span>}
                  </label>
                  <input
                    type="date"
                    id="durationEnd"
                    name="durationEnd"
                    value={currentLocalCollaboration.durationEnd}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required={currentLocalCollaboration.currentStatus !== 'Ongoing'}
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
                  value={currentLocalCollaboration.keyOutcomes}
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
                  value={currentLocalCollaboration.detailsOfOutcome}
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
    </div>
  );
};

export default LocalCollaborationPage;
