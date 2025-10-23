import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import ProjectsPage from './pages/ProjectsPage';
import TrainingsPage from './pages/TalkTrainingConferencePage';
import InternshipView from './pages/InternshipsPage';
import EventsPage from './pages/EventsPage';
import PatentsView from './pages/PatentsPage';
import FundingsView from './pages/FundingsPage';
import FundingProposalsPage from './pages/FundingProposalsPage';
import PublicationsPage from './pages/PublicationsPage';
import ReportsPage from './pages/ReportsPage';
import CollaborationPage from './pages/ForeignCollaborationPage';
import AchievementsPage from './pages/AchievementsPage';
import TrainingsConductedPage from './pages/TrainingsConductedPage';
import CompetitionsPage from './pages/CompetitionsPage';
import AccountReportsPage from './pages/AccountReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
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
      '/analytics': 'Data Analytics - CoE AI CMS',
      '/login': 'Login - CoE AI CMS',
      '/signup': 'Sign Up - CoE AI CMS'
    };

    document.title = pathToTitle[location.pathname] || 'CoE AI CMS';
  }, [location]);

  return null;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, setUser } = useUser();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <TitleManager />
      {/* Removed AuthRedirect - authentication is handled in Login component */}
      <div className="flex h-screen bg-gray-100">
        {loading ? (
          <Loading />
        ) : user ? (
          <>
            <Sidebar isOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0">
              <Header toggleSidebar={toggleSidebar} />
              <main className="flex-1 overflow-x-hidden overflow-auto bg-gray-200">
                <Routes>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/TalkTrainingConference" element={<TrainingsPage />} />
                  <Route path="/internships" element={<InternshipView />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/trainings-conducted" element={<TrainingsConductedPage />} />
                  <Route path="/collaborations" element={<CollaborationPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/patents" element={<PatentsView />} />
                  <Route path="/fundings" element={<FundingsView />} />
                  <Route path="/funding-proposals" element={<FundingProposalsPage />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route path="/competitions" element={<CompetitionsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/account-reports" element={<AccountReportsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
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