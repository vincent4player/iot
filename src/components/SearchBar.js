import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaSearch, FaTimes, FaUndo, FaThermometerHalf, FaTint } from 'react-icons/fa';
import { WeatherContext } from '../context/WeatherContext';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const { sensorData, selectedLocation, setSelectedLocation, resetSelection } = useContext(WeatherContext);
  const searchRef = useRef(null);

  // Filtrer les villes en fonction du terme de recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities([]);
      return;
    }

    const filtered = sensorData.filter(city =>
      city.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [searchTerm, sensorData]);

  // Gérer le clic en dehors du champ de recherche pour le fermer
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (filteredCities.length > 0) {
      setSelectedLocation(filteredCities[0]);
      setSearchTerm(filteredCities[0].location);
      setIsOpen(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedLocation(city);
    setSearchTerm(city.location);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredCities([]);
  };

  const handleResetSelection = () => {
    resetSelection();
    setSearchTerm('');
    setFilteredCities([]);
  };

  return (
    <div className="relative mb-3 z-30" ref={searchRef}>
      <div className="flex">
        <form onSubmit={handleSearch} className="flex flex-grow">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Rechercher une ville..."
              className="w-full py-2 px-4 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            Rechercher
          </button>
        </form>
        
        {selectedLocation && (
          <button
            type="button"
            onClick={handleResetSelection}
            className="ml-2 flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors shadow-sm"
            title="Réinitialiser la sélection"
          >
            <FaUndo className="mr-1" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        )}
      </div>

      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%', marginTop: '4px' }}>
          <div className="bg-blue-50 p-2 border-b border-gray-200">
            <p className="text-sm text-blue-800 font-medium">
              {filteredCities.length} résultat{filteredCities.length > 1 ? 's' : ''} trouvé{filteredCities.length > 1 ? 's' : ''}
            </p>
          </div>
          <ul>
            {filteredCities.map((city) => (
              <li
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{city.location}</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-orange-500">
                      <FaThermometerHalf className="mr-1" />
                      <span>{Math.round(city.temperature)}°C</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                      <FaTint className="mr-1" />
                      <span>{Math.round(city.humidity)}%</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 