import { useState, useEffect, useCallback } from 'react';
import { fetchSensorData, fetchForecast } from '../services/api';

/**
 * Hook personnalisé pour gérer les données météorologiques
 * @returns {Object} - Ensemble de données et fonctions pour manipuler les données météo
 */
const useWeatherData = () => {
  const [sensorData, setSensorData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [historicalData, setHistoricalData] = useState({
    temperature: [],
    humidity: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupération initiale des données des capteurs
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSensorData();
        
        setSensorData(data);
        
        // Création des données historiques fictives
        const now = Date.now();
        const tempHistory = Array.from({ length: 24 }, (_, i) => ({
          time: new Date(now - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: 15 + Math.random() * 10
        }));
        
        const humidityHistory = Array.from({ length: 24 }, (_, i) => ({
          time: new Date(now - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: 50 + Math.random() * 30
        }));
        
        setHistoricalData({
          temperature: tempHistory,
          humidity: humidityHistory
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
        console.error(err);
      }
    };
    
    loadInitialData();
  }, []);

  // Récupération des prévisions météo lorsqu'un lieu est sélectionné
  const getForecast = useCallback(async (lat, lng) => {
    try {
      setIsLoading(true);
      // En production, décommentez cette ligne et commentez le bloc de données fictives
      // const data = await fetchForecast(lat, lng);
      // setForecastData(data.list);
      
      // Données fictives pour le développement
      const mockForecast = Array.from({ length: 8 }, (_, i) => ({
        dt: Math.floor(Date.now() / 1000) + i * 3600 * 3,
        main: {
          temp: Math.round(15 + Math.random() * 10),
          temp_max: Math.round(18 + Math.random() * 10),
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
      console.error(err);
    }
  }, []);

  // Effect pour charger les prévisions quand une localisation est sélectionnée
  useEffect(() => {
    if (selectedLocation) {
      getForecast(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, getForecast]);

  // Simulation de mise à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      // Mise à jour des données des capteurs
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

    return () => clearInterval(interval);
  }, []);

  return {
    sensorData,
    selectedLocation,
    setSelectedLocation,
    historicalData,
    forecastData,
    isLoading,
    error
  };
};

export default useWeatherData; 