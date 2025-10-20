import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import ProjectsPage from './pages/ProjectsPage';
import TrainingsPage from './pages/TalkTrainingConferencePage';
import InternshipsPage from './pages/InternshipsPage';
import EventsPage from './pages/EventsPage';
import PatentsPage from './pages/PatentsPage';
import FundingsPage from './pages/FundingsPage';
import FundingProposalsPage from './pages/FundingProposalsPage';
import PublicationsPage from './pages/PublicationsPage';
import ReportsPage from './pages/ReportsPage';
import CollaborationPage from './pages/ForeignCollaborationPage';
import AchievementsPage from './pages/AchievementsPage';
import TrainingsConductedPage from './pages/TrainingsConductedPage';
import CompetitionsPage from './pages/CompetitionsPage';
import AccountReportsPage from './pages/AccountReportsPage';
import AuthRedirect from './authRedirect';
import { UserProvider, useUser } from './context/UserContext';
import Loading from './components/Loading';

function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const pathToTitle = {
      '/': 'Projects - CoE AI CMS',
      '/profile': 'Profile - CoE AI CMS',
      '/projects': 'Projects - CoE AI CMS',
      '/TalkTrainingConference': 'Talks & Training - CoE AI CMS',
      '/internships': 'Internships - CoE AI CMS',
      '/events': 'Events - CoE AI CMS',
      '/trainings-conducted': 'Trainings Conducted - CoE AI CMS',
      '/collaborations': 'Collaborations - CoE AI CMS',
      '/achievements': 'Achievements - CoE AI CMS',
      '/patents': 'Patents - CoE AI CMS',
      '/fundings': 'Funded Projects - CoE AI CMS',
      '/funding-proposals': 'Funding Proposals - CoE AI CMS',
      '/publications': 'Publications - CoE AI CMS',
      '/competitions': 'Competitions - CoE AI CMS',
      '/reports': 'Reports - CoE AI CMS',
      '/account-reports': 'Account Reports - CoE AI CMS',
      '/login': 'Login - CoE AI CMS',
      '/signup': 'Sign Up - CoE AI CMS'
    };

    document.title = pathToTitle[location.pathname] || 'CoE AI CMS';
  }, [location]);

  return null;
}

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
    // Reset userDataFetched when user changes
    if (user && userDataFetched) {
      setUserDataFetched(false);
    }
  }, [user?.uid, userDataFetched]);

  useEffect(() => {
    // console.log('App: Auth check effect triggered', { authChecked, user });
    if (authChecked && user && !userDataFetched) {
      const fetchUserData = async () => {
        // console.log('App: Fetching user data');
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile`);
          // console.log('App: User data fetched', response.data);
          const currentUser = user; // Store current user before merging
          const mergedUser = { ...currentUser, ...response.data };
          // console.log('App: Merging user data:', { prevUser: currentUser?.email, mergedUser: mergedUser?.email, mergedRole: mergedUser?.role });
          setUser(mergedUser);
          // console.log('App: User after setUser:', mergedUser?.email, mergedUser?.role);
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
  }, [authChecked, user, userDataFetched, API_BASE_URL]);

  // console.log('App: Rendering', { authChecked, loading, user, userDataFetched });

  return (
    <Router>
      <TitleManager />
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
                  <Route path="/TalkTrainingConference" element={<TrainingsPage />} />
                  <Route path="/internships" element={<InternshipsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/trainings-conducted" element={<TrainingsConductedPage />} />
                  <Route path="/collaborations" element={<CollaborationPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/patents" element={<PatentsPage />} />
                  <Route path="/fundings" element={<FundingsPage />} />
                  <Route path="/funding-proposals" element={<FundingProposalsPage />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route path="/competitions" element={<CompetitionsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/account-reports" element={<AccountReportsPage />} />
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