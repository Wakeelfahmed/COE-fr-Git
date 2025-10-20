
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import AccountFilter from '../components/AccountFilter';

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
    nameOfAttendee: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    activity: '',
    organizer: '',
    resourcePerson: '',
    role: '',
    type: '',
    accountFilter: '' // Add account filter
  });

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [showOnlyMine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      } else if ((e.key === '~' || e.key === '`') && e.shiftKey && !showModal && !showReportModal) {
        handleNewEvent();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showReportModal]);

  const fetchEvents = async () => {
    console.log('=== FETCHING EVENTS ===');
    console.log('Show Only Mine:', showOnlyMine);
    console.log('API URL:', `${API_BASE_URL}/events`);
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, {
        params: { onlyMine: showOnlyMine }
      });
      console.log('Events fetched:', response.data.length, 'records');
      console.log('Events data:', response.data);
      setEvents(response.data);
    } catch (error) {
      console.error('=== ERROR FETCHING EVENTS ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
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
      nameOfAttendee: ''
    });
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setIsEditMode(true);
    setCurrentEvent(event);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== EVENT SUBMIT DEBUG ===');
    console.log('Is Edit Mode:', isEditMode);
    console.log('Event Data:', currentEvent);
    console.log('API URL:', `${API_BASE_URL}/events${isEditMode ? '/' + currentEvent._id : ''}`);

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

  const filteredEvents = events.filter(event => {
    return (event.activity || '').toLowerCase().includes((filterCriteria.activity || '').toLowerCase()) &&
      (event.organizer || '').toLowerCase().includes((filterCriteria.organizer || '').toLowerCase()) &&
      (event.resourcePerson || '').toLowerCase().includes((filterCriteria.resourcePerson || '').toLowerCase()) &&
      (event.role || '').toLowerCase().includes((filterCriteria.role || '').toLowerCase()) &&
      (event.type || '').toLowerCase().includes((filterCriteria.type || '').toLowerCase()) &&
      (filterCriteria.accountFilter === '' || (event.createdBy?.id === filterCriteria.accountFilter));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Events</h2>
        <div>
          <button onClick={handleNewEvent} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Event
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Name</th>
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
                <td className="px-6 py-4 whitespace-nowrap">{event.nameOfAttendee}</td>
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
                  Type
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={currentEvent.type}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
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
    </div>
  );
};

export default EventsPage;