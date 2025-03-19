import React, { useState } from 'react';
import { FaCloud, FaChartLine, FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-blue-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo et titre */}
          <div className="flex items-center">
            <FaCloud className="text-3xl mr-2" />
            <h1 className="text-xl font-bold">Météo France Dashboard</h1>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-6">
            <a href="#dashboard" className="flex items-center hover:text-blue-200 transition-colors">
              <FaChartLine className="mr-1" />
              <span>Tableau de bord</span>
            </a>
            <a 
              href="https://openweathermap.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-200 transition-colors"
            >
              API Météo
            </a>
          </nav>

          {/* Hamburger menu pour mobile */}
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 py-2 space-y-3">
            <a 
              href="#dashboard" 
              className="block py-2 hover:bg-blue-600 px-2 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              <FaChartLine className="inline mr-2" />
              Tableau de bord
            </a>
            <a 
              href="https://openweathermap.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block py-2 hover:bg-blue-600 px-2 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              API Météo
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 