// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';
import { auth } from '../firebaseConfig';


const activityItems = [
  { name: 'Industry/Commercial Projects', path: '/' },
  { name: 'Trainings', path: '/trainings' },
  { name: 'Internships', path: '/internships' },
  // { name: 'Events', path: '/events' },
];

const otherItems = [
  { name: 'Patents', path: '/patents' },
  { name: 'Fundings', path: '/fundings' },
  { name: 'Publications', path: '/publications' },
  // { name: 'Forms', path: '/forms' },
  { name: 'Reports', path: '/reports' },
];

const Sidebar = ({ isOpen }) => {
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);

  const toggleActivities = () => {
    setIsActivitiesOpen(!isActivitiesOpen);
  };

  const handleSignOut = ()=>{
    auth.signOut()
    .then(() => {
      console.log("User signed out.");
      window.location.href = '/login'; // Redirect to login page after logging out
    })
    .catch(error => {
      console.error("Error signing out: ", error);
    });
  }

  return (
    <aside className={`bg-gray-700 text-white w-64 min-h-screen ${isOpen ? 'block' : 'hidden'} transition-all duration-300`}>
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

      { auth.currentUser &&<button className='fixed bottom-10 ml-[20px] border p-3 px-5 rounded-xl hover:bg-black' onClick={handleSignOut}>Sign Out</button>}
    </aside>
  );
};

export default Sidebar;