import React from 'react';
import { FaTemperatureHigh, FaTint, FaMapMarkerAlt, FaRegClock } from 'react-icons/fa';
import { formatTemperature, formatHumidity } from '../utils/weatherIcons';

const WeatherCard = ({ title, icon: Icon, value, unit, color, location, time, isHighlighted }) => {
  return (
    <div className={`weather-card ${isHighlighted ? 'ring-2 ring-blue-500' : ''} hover:transform hover:scale-105 transition-all duration-300`}>
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <Icon className={`weather-icon ${color}`} />
          <h3 className="text-xl font-medium ml-2">{title}</h3>
        </div>
        
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-gray-500 ml-1">{unit}</span>
        </div>
        
        {location && (
          <div className="flex items-center mb-2 text-gray-600">
            <FaMapMarkerAlt className="mr-1" />
            <span>{location}</span>
          </div>
        )}
        
        {time && (
          <div className="flex items-center text-gray-600 text-sm">
            <FaRegClock className="mr-1" />
            <span>Mise à jour: {time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant spécifique pour la température
export const TemperatureCard = ({ temperature, location, time, isHighlighted }) => {
  return (
    <WeatherCard 
      title="Température"
      icon={FaTemperatureHigh}
      value={formatTemperature(temperature)}
      unit=""
      color="text-orange-500"
      location={location}
      time={time}
      isHighlighted={isHighlighted}
    />
  );
};

// Composant spécifique pour l'humidité
export const HumidityCard = ({ humidity, location, time, isHighlighted }) => {
  return (
    <WeatherCard 
      title="Humidité"
      icon={FaTint}
      value={formatHumidity(humidity)}
      unit=""
      color="text-blue-500"
      location={location}
      time={time}
      isHighlighted={isHighlighted}
    />
  );
};

export default WeatherCard; 