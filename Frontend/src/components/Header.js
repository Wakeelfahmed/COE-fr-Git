// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaUser } from 'react-icons/fa';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="mr-4 focus:outline-none">
          <FaBars className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold">COE Management System</h1>
      </div>
      <Link to="/profile" className="focus:outline-none">
        <FaUser className="w-6 h-6 text-white" />
      </Link>
    </header>
  );
};

export default Header;