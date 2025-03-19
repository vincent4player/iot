import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Création du contexte
export const WeatherContext = createContext();

// Données fictives pour le développement
const MOCK_SENSOR_DATA = [
  { id: 1, location: 'Paris', lat: 48.8566, lng: 2.3522, temperature: 15.2, humidity: 70 },
  { id: 2, location: 'Lyon', lat: 45.7640, lng: 4.8357, temperature: 18.5, humidity: 65 },
  { id: 3, location: 'Marseille', lat: 43.2965, lng: 5.3698, temperature: 22.3, humidity: 58 },
  { id: 4, location: 'Bordeaux', lat: 44.8378, lng: -0.5792, temperature: 17.8, humidity: 68 },
  { id: 5, location: 'Lille', lat: 50.6292, lng: 3.0573, temperature: 13.9, humidity: 75 },
  { id: 6, location: 'Strasbourg', lat: 48.5734, lng: 7.7521, temperature: 16.4, humidity: 62 },
  { id: 7, location: 'Nice', lat: 43.7102, lng: 7.2620, temperature: 21.6, humidity: 55 },
  { id: 8, location: 'Nantes', lat: 47.2184, lng: -1.5536, temperature: 16.9, humidity: 73 }
];

const MOCK_HISTORICAL_DATA = {
  temperature: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: 15 + Math.random() * 10
  })),
  humidity: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: 50 + Math.random() * 30
  }))
};

export const WeatherProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(MOCK_SENSOR_DATA);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [historicalData, setHistoricalData] = useState(MOCK_HISTORICAL_DATA);
  const [forecastData, setForecastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fonction pour réinitialiser la sélection
  const resetSelection = useCallback(() => {
    setSelectedLocation(null);
    setForecastData([]);
  }, []);

  // Fonction pour récupérer les prévisions météo
  const fetchForecast = useCallback(async (lat, lng) => {
    setIsLoading(true);
    try {
      // En production, remplacer par un appel à l'API OpenWeatherMap
      // Example: const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`);
      
      // Données fictives pour le développement
      const mockForecast = Array.from({ length: 8 }, (_, i) => ({
        dt: Math.floor(Date.now() / 1000) + i * 3600 * 3,
        main: {
          temp: Math.round(15 + Math.random() * 10),
          temp_max: Math.round(15 + Math.random() * 10),
          humidity: Math.round(50 + Math.random() * 30)
        },
        weather: [{
          id: 800,
          main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
          description: 'Clear sky',
          icon: ['01d', '02d', '10d'][Math.floor(Math.random() * 3)]
        }],
        dt_txt: new Date(Date.now() + i * 3600000 * 3).toISOString()
      }));
      
      // Délai artificiel pour simuler une requête API
      setTimeout(() => {
        setForecastData(mockForecast);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      setError('Erreur lors de la récupération des prévisions');
      setIsLoading(false);
      console.error('Forecast error:', err);
    }
  }, []);

  // Effet pour simuler les mises à jour en temps réel des capteurs
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setSensorData(prevData => 
        prevData.map(sensor => ({
          ...sensor,
          temperature: parseFloat((sensor.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          humidity: Math.min(100, Math.max(0, Math.round(sensor.humidity + (Math.random() * 6 - 3))))
        }))
      );

      // Mise à jour des données historiques
      setHistoricalData(prevData => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          temperature: [
            ...prevData.temperature.slice(1),
            { time: currentTime, value: 15 + Math.random() * 10 }
          ],
          humidity: [
            ...prevData.humidity.slice(1),
            { time: currentTime, value: 50 + Math.random() * 30 }
          ]
        };
      });
    }, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(updateInterval);
  }, []);

  // Effet pour initialiser la connexion WebSocket (simulée ici)
  useEffect(() => {
    // En production: const socket = io('http://votre-serveur-api.com');
    // socket.on('sensorUpdate', (data) => {
    //   setSensorData(prevData => updateSensorData(prevData, data));
    // });
    
    // return () => socket.disconnect();
    
    // Pour le développement, nous utilisons l'effet de mise à jour ci-dessus
  }, []);

  // Effet pour charger les prévisions lorsqu'une localisation est sélectionnée
  useEffect(() => {
    if (selectedLocation) {
      fetchForecast(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, fetchForecast]);

  // Valeur du contexte à fournir aux composants enfants
  const contextValue = {
    sensorData,
    selectedLocation,
    setSelectedLocation,
    resetSelection,
    historicalData,
    forecastData,
    isLoading,
    error
  };

  return (
    <WeatherContext.Provider value={contextValue}>
      {children}
    </WeatherContext.Provider>
  );
}; 