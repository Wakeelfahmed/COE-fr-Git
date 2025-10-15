import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState({
    title: '',
    category: '',
    description: '',
    achievedBy: '',
    dateAchieved: '',
    awardingBody: '',
    significance: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    title: '',
    category: '',
    achievedBy: '',
    significance: ''
  });

  useEffect(() => {
    fetchAchievements();
  }, [showOnlyMine]);

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
      title: '',
      category: '',
      description: '',
      achievedBy: '',
      dateAchieved: '',
      awardingBody: '',
      significance: ''
    });
    setShowModal(true);
  };

  const handleEditAchievement = (achievement) => {
    setIsEditMode(true);
    setCurrentAchievement({
      ...achievement,
      dateAchieved: achievement.dateAchieved ? new Date(achievement.dateAchieved).toISOString().split('T')[0] : ''
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
      title: '',
      category: '',
      achievedBy: '',
      significance: ''
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
    return achievement.title.toLowerCase().includes(filterCriteria.title.toLowerCase()) &&
           achievement.category.toLowerCase().includes(filterCriteria.category.toLowerCase()) &&
           achievement.achievedBy.toLowerCase().includes(filterCriteria.achievedBy.toLowerCase()) &&
           (filterCriteria.significance === '' || achievement.significance === filterCriteria.significance);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Achievements</h2>
        <div>
          <button onClick={handleNewAchievement} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Achievement
          </button>
          {user?.role === 'director' && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
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
              placeholder="Filter by Category"
              name="category"
              value={filterCriteria.category}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Achieved By"
              name="achievedBy"
              value={filterCriteria.achievedBy}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <select
              name="significance"
              value={filterCriteria.significance}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Significance</option>
              <option value="International">International</option>
              <option value="National">National</option>
              <option value="Regional">Regional</option>
              <option value="Institutional">Institutional</option>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achieved By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awarding Body</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Significance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAchievements.map((achievement, index) => (
              <tr key={achievement._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.achievedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(achievement.dateAchieved).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.awardingBody || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{achievement.significance || '-'}</td>
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {isEditMode ? 'Edit Achievement' : 'New Achievement'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentAchievement.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={currentAchievement.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Award">Award</option>
                  <option value="Recognition">Recognition</option>
                  <option value="Milestone">Milestone</option>
                  <option value="Competition Win">Competition Win</option>
                  <option value="Grant Received">Grant Received</option>
                  <option value="Publication Milestone">Publication Milestone</option>
                  <option value="Technology Transfer">Technology Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="achievedBy">
                  Achieved By
                </label>
                <input
                  type="text"
                  id="achievedBy"
                  name="achievedBy"
                  value={currentAchievement.achievedBy}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateAchieved">
                  Date Achieved
                </label>
                <input
                  type="date"
                  id="dateAchieved"
                  name="dateAchieved"
                  value={currentAchievement.dateAchieved}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="awardingBody">
                  Awarding Body (Optional)
                </label>
                <input
                  type="text"
                  id="awardingBody"
                  name="awardingBody"
                  value={currentAchievement.awardingBody}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="significance">
                  Significance (Optional)
                </label>
                <select
                  id="significance"
                  name="significance"
                  value={currentAchievement.significance}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Significance</option>
                  <option value="International">International</option>
                  <option value="National">National</option>
                  <option value="Regional">Regional</option>
                  <option value="Institutional">Institutional</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentAchievement.description}
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

export default AchievementsPage;
