import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import ProjectsPage from './pages/ProjectsPage';
import TrainingsPage from './pages/TrainingsPage';
import InternshipsPage from './pages/InternshipsPage';
import EventsPage from './pages/EventsPage';
import PatentsPage from './pages/PatentsPage';
import FundingsPage from './pages/FundingsPage';
import PublicationsPage from './pages/PublicationsPage';
import ReportsPage from './pages/ReportsPage';
import AuthRedirect from './authRedirect';
import { UserProvider, useUser } from './context/UserContext';
import Loading from './components/Loading';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser } = useUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const API_BASE_URL = process.env.REACT_APP_BACKEND;

  

  const handleAuthChecked = useCallback(() => {
    // console.log('App: handleAuthChecked called');
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    // console.log('App: Auth check effect triggered', { authChecked, user });
    if (authChecked && user && !userDataFetched) {
      const fetchUserData = async () => {
        // console.log('App: Fetching user data');
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile`);
          console.log('App: User data fetched', response.data);
          setUser(prevUser => ({ ...prevUser, ...response.data }));
        } catch (err) {
          // console.error('App: Failed to fetch user data', err);
          setError('Failed to load user data');
        } finally {
          setUserDataFetched(true);
          setLoading(false);
        }
      };
      fetchUserData();
    } else if (authChecked && !user) {
      setLoading(false);
    }
  }, [authChecked, user, setUser, userDataFetched]);

  // console.log('App: Rendering', { authChecked, loading, user, userDataFetched });

  return (
    <Router>
      <AuthRedirect onAuthChecked={handleAuthChecked} />
      <div className="flex h-screen bg-gray-100">
        {!authChecked || loading ? (
          <Loading />
        ) : user ? (
          <>
            <Sidebar isOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header toggleSidebar={toggleSidebar} />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
                <Routes>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/trainings" element={<TrainingsPage />} />
                  <Route path="/internships" element={<InternshipsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/patents" element={<PatentsPage />} />
                  <Route path="/fundings" element={<FundingsPage />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/" element={<Navigate to="/projects" replace />} />
                </Routes>
              </main>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

function AppWrapper() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

export default AppWrapper;