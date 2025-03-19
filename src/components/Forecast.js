import React from 'react';
import { FaTemperatureHigh, FaTint } from 'react-icons/fa';
import { formatDate, getWeatherIconUrl } from '../utils/weatherIcons';

const ForecastCard = ({ forecast }) => {
  // Formatage de la date et de l'heure
  const dateTime = formatDate(forecast.dt_txt);
  
  return (
    <div className="weather-card flex flex-col items-center p-4">
      <div className="text-sm text-gray-600 mb-2">{dateTime}</div>
      
      <div className="w-16 h-16 mb-2">
        <img 
          src={getWeatherIconUrl(forecast.weather[0].icon)} 
          alt={forecast.weather[0].description}
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="text-lg font-bold mb-1">{Math.round(forecast.main.temp)}°C</div>
      
      <div className="text-sm text-gray-700 mb-3">
        {forecast.weather[0].main}
      </div>
      
      <div className="flex justify-between w-full text-sm">
        <div className="flex items-center">
          <FaTemperatureHigh className="text-orange-500 mr-1" />
          <span>{Math.round(forecast.main.temp_max)}°</span>
        </div>
        <div className="flex items-center">
          <FaTint className="text-blue-500 mr-1" />
          <span>{forecast.main.humidity}%</span>
        </div>
      </div>
    </div>
  );
};

const Forecast = ({ forecasts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <p className="text-gray-500">
          Sélectionnez une ville sur la carte pour voir les prévisions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Prévisions sur 24h</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {forecasts.map((forecast, index) => (
          <ForecastCard key={index} forecast={forecast} />
        ))}
      </div>
    </div>
  );
};

export default Forecast; 