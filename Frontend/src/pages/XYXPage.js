import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { FaInfoCircle } from 'react-icons/fa';
import Select from 'react-select';

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

const XYXPage = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCollaboration, setCurrentCollaboration] = useState({
    memberOfCoE: '',
    collaboratingForeignResearcher: '',
    foreignCollaboratingInstitute: '',
    collaboratingCountry: '',
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
    foreignResearcher: '',
    country: '',
    status: ''
  });

  useEffect(() => {
    fetchCollaborations();
  }, [showOnlyMine]);

  const fetchCollaborations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/collaborations`, {
        params: { onlyMine: showOnlyMine }
      });
      setCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      alert('Error fetching collaborations. Please try again.');
    }
  };

  const handleNewCollaboration = () => {
    setIsEditMode(false);
    setCurrentCollaboration({
      memberOfCoE: '',
      collaboratingForeignResearcher: '',
      foreignCollaboratingInstitute: '',
      collaboratingCountry: '',
      typeOfCollaboration: '',
      durationStart: '',
      durationEnd: '',
      currentStatus: '',
      keyOutcomes: '',
      detailsOfOutcome: ''
    });
    setShowModal(true);
  };

  const handleEditCollaboration = (collaboration) => {
    setIsEditMode(true);
    setCurrentCollaboration({
      ...collaboration,
      durationStart: collaboration.durationStart ? new Date(collaboration.durationStart).toISOString().split('T')[0] : '',
      durationEnd: collaboration.durationEnd ? new Date(collaboration.durationEnd).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCollaboration(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/collaborations/${currentCollaboration._id}`, currentCollaboration);
      } else {
        await axios.post(`${API_BASE_URL}/collaborations`, currentCollaboration);
      }
      setShowModal(false);
      fetchCollaborations();
    } catch (error) {
      console.error('Error saving collaboration:', error);
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
      foreignResearcher: '',
      country: '',
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

  const filteredCollaborations = collaborations.filter(collab => {
    return collab.memberOfCoE.toLowerCase().includes(filterCriteria.memberOfCoE.toLowerCase()) &&
           collab.collaboratingForeignResearcher.toLowerCase().includes(filterCriteria.foreignResearcher.toLowerCase()) &&
           collab.collaboratingCountry.toLowerCase().includes(filterCriteria.country.toLowerCase()) &&
           collab.currentStatus.toLowerCase().includes(filterCriteria.status.toLowerCase());
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">International Collaborations</h2>
        <div>
          <button onClick={handleNewCollaboration} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Collaboration
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
              placeholder="Filter by Foreign Researcher"
              name="foreignResearcher"
              value={filterCriteria.foreignResearcher}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Country"
              name="country"
              value={filterCriteria.country}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foreign Researcher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foreign Institute</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                <td className="px-6 py-4 whitespace-nowrap">{collab.collaboratingCountry}</td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.typeOfCollaboration}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(collab.durationStart).toLocaleDateString()} - {collab.durationEnd ? new Date(collab.durationEnd).toLocaleDateString() : 'Ongoing'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{collab.currentStatus}</td>
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
                    Collaborating Foreign Researcher
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
                    Foreign Collaborating Institute
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
                    <option value="Joint Supervision (PhD/MS)">Joint Supervision (PhD/MS)</option>
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
    </div>
  );
};

export default XYXPage;
