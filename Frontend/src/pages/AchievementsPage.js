import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import AccountFilter from '../components/AccountFilter';

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

  useEffect(() => {
    fetchAchievements();
  }, [showOnlyMine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
   } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal) 
{        handleNewAchievement();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal]);

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
    </div>
  );
};

export default AchievementsPage;
