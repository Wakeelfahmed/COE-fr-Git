import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const uploadPdf = async (file, userId) => {
  if (!file) return;
  try {
    const fileRef = ref(storage, `pdfs/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log("File uploaded successfully. Download URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const deletePdf = async (userId, fileName) => {
  try {
    const fileRef = ref(storage, `pdfs/${userId}/${fileName}`);
    try {
      await getMetadata(fileRef);
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log("File doesn't exist, skipping delete operation");
        return;
      }
      throw error;
    }
    await deleteObject(fileRef);
    console.log("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

const EventsView = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    type: '',
    title: '',
    participants: '',
    date: '',
    agenda: '',
    followUpActivity: '',
    resourcePerson: '',
    venue: '',
    totalRevenue: '',
    fileLink: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    type: '',
    title: '',
    resourcePerson: '',
    venue: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedFiles, setSelectedFiles] = useState({});

  const { user } = useUser();
  const [showOnlyMine, setShowOnlyMine] = useState(false);




  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleSaveReport = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, {
        title: reportTitle,
        sourceType: 'Trainings',
        filterCriteria
      });
      console.log('Report saved:', response.data);
      setShowReportModal(false);
      setReportTitle('');
      // Optionally, show a success message to the user
    } catch (error) {
      console.error('Error saving report:', error);
      // Optionally, show an error message to the user
    }
  };







  useEffect(() => {
    fetchEvents();
  }, [showOnlyMine]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, {
        params: { onlyMine: showOnlyMine }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Error fetching events. Please try again.');
    }
  };

  const handleNewEvent = () => {
    setIsEditMode(false);
    setCurrentEvent({
      type: '',
      title: '',
      participants: '',
      date: '',
      agenda: '',
      followUpActivity: '',
      resourcePerson: '',
      venue: '',
      totalRevenue: '',
      fileLink: ''
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
    const eventData = {
      ...currentEvent,
      totalRevenue: parseFloat(currentEvent.totalRevenue)
    };

    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/events/${currentEvent._id}`, eventData);
      } else {
        await axios.post(`${API_BASE_URL}/events`, eventData);
      }
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
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
      type: '',
      title: '',
      resourcePerson: '',
      venue: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFileChange = (event, eventId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFiles(prev => ({ ...prev, [eventId]: file }));
    } else {
      alert('Please select a PDF file');
      event.target.value = null;
    }
  };

  const handleFileUpload = async (eventId) => {
    const file = selectedFiles[eventId];
    if (!file) {
      alert('Please select a file first');
      return;
    }
    try {
      const fileUrl = await uploadPdf(file, user?.id);
      await axios.put(`${API_BASE_URL}/events/${eventId}`, { fileLink: fileUrl });
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, fileLink: fileUrl } : event
        )
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[eventId];
        return newState;
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileDelete = async (eventId, fileName) => {
    try {
      await deletePdf(user?.id, fileName);
      await axios.put(`${API_BASE_URL}/events/${eventId}`, { fileLink: null });
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, fileLink: null } : event
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const filteredEvents = events.filter(event => {
    return event.type.toLowerCase().includes(filterCriteria.type.toLowerCase()) &&
           event.title.toLowerCase().includes(filterCriteria.title.toLowerCase()) &&
           event.resourcePerson.toLowerCase().includes(filterCriteria.resourcePerson.toLowerCase()) &&
           event.venue.toLowerCase().includes(filterCriteria.venue.toLowerCase()) &&
           (filterCriteria.dateFrom === '' || event.date >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || event.date <= filterCriteria.dateTo);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Events/Trainings</h2>
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
            <select
              name="type"
              value={filterCriteria.type}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            >
              <option value="">All Types</option>
              <option value="Activity">Activity</option>
              <option value="Training">Training</option>
            </select>
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
              placeholder="Filter by Resource Person"
              name="resourcePerson"
              value={filterCriteria.resourcePerson}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Filter by Venue"
              name="venue"
              value={filterCriteria.venue}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateFrom">From Event Date:</label>
            <input
              type="date"
              placeholder="From Date"
              name="dateFrom"
              value={filterCriteria.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
            />
            <label for="dateFrom">To Event Date:</label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((event, index) => (
              <tr key={event._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.resourcePerson}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.participants}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.venue}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{event.totalRevenue ? event.totalRevenue.toLocaleString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {event.fileLink ? (
                    <div>
                      <a href={event.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-2">View File</a>
                      <button onClick={() => handleFileDelete(event._id, event.fileLink.split('/').pop())} className="text-red-600 hover:text-red-900 mr-2">Delete</button>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, event._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpdate-${event._id}`} 
                      />
                      <label htmlFor={`fileUpdate-${event._id}`} className="text-green-600 hover:text-green-900 cursor-pointer">Update</label>
                      {selectedFiles[event._id] && (
                        <button onClick={() => handleFileUpload(event._id)} className="text-blue-600 hover:text-blue-900 ml-2">Confirm Update</button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, event._id)} 
                        accept=".pdf" 
                        className="hidden" 
                        id={`fileUpload-${event._id}`} 
                      />
                      <label htmlFor={`fileUpload-${event._id}`} className="text-blue-600 hover:text-blue-900 cursor-pointer mr-2">Select File</label>
                      {selectedFiles[event._id] && (
                        <button onClick={() => handleFileUpload(event._id)} className="text-green-600 hover:text-green-900">Upload</button>
                        )}
                      </div>
                    )}
                  </td>
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
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={currentEvent.type}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Activity">Activity</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={currentEvent.title}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="participants">
                    Participants
                  </label>
                  <input
                    type="text"
                    id="participants"
                    name="participants"
                    value={currentEvent.participants}
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
                    value={currentEvent.date}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="agenda">
                    Agenda/Details
                  </label>
                  <textarea
                    id="agenda"
                    name="agenda"
                    value={currentEvent.agenda}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="3"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="followUpActivity">
                    Follow Up Activity
                  </label>
                  <input
                    type="text"
                    id="followUpActivity"
                    name="followUpActivity"
                    value={currentEvent.followUpActivity}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="venue">
                    Venue
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={currentEvent.venue}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalRevenue">
                    Total Revenue
                  </label>
                  <input
                    type="number"
                    id="totalRevenue"
                    name="totalRevenue"
                    value={currentEvent.totalRevenue}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
  
  export default EventsView;