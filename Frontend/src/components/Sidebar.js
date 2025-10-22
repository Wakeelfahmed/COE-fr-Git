// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';
import { auth } from '../firebaseConfig';
import { useUser } from '../context/UserContext';


const activityItems = [
  { name: 'Talks/Training Attended', path: '/TalkTrainingConference' },
  { name: 'Internships', path: '/internships' },
  { name: 'Events', path: '/events' },
  { name: 'Trainings Conducted', path: '/trainings-conducted' },
  { name: 'Competitions', path: '/competitions' },
];

const otherItems = [
  { name: 'Industry/Commercial Projects', path: '/' },
  { name: 'Collaboration', path: '/collaborations' },
  { name: 'Achievements', path: '/achievements' },
  { name: 'Patents', path: '/patents' },
  { name: 'Funded Projects', path: '/fundings' },
  { name: 'Funding Proposals', path: '/funding-proposals' },
  { name: 'Publications', path: '/publications' },
  // { name: 'Forms', path: '/forms' },
  { name: 'Reports', path: '/reports' },
  { name: 'Account Reports', path: '/account-reports' },
];

const Sidebar = ({ isOpen }) => {
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);
  const { user, setUser } = useUser();

  const toggleActivities = () => {
    setIsActivitiesOpen(!isActivitiesOpen);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null); // Clear user context
      console.log("User signed out and context cleared.");
      window.location.href = '/login'; // Redirect to login page after logging out
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <aside className={`bg-gray-700 text-white w-64 min-h-screen overflow-y-auto ${isOpen ? 'block' : 'hidden'} transition-all duration-300`}>
      <nav className="p-0">
        <ul className="space-y-0">
          <li>
            <button 
              onClick={toggleActivities}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-600 focus:outline-none"
            >
              Activities
              {isActivitiesOpen ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
            {isActivitiesOpen && (
              <ul className="bg-gray-800">
                {activityItems.map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="block p-4 pl-8 hover:bg-gray-600">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {otherItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path} className="block p-4 hover:bg-gray-600">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {user && <button className='fixed bottom-10 ml-[20px] border p-3 px-5 rounded-xl hover:bg-black' onClick={handleSignOut}>Sign Out</button>}
    </aside>
  );
};

export default Sidebar;