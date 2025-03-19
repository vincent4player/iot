import axios from 'axios';

// Clé API OpenWeatherMap (utilisation de la variable d'environnement)
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'your_api_key';

// URL de base pour l'API OpenWeatherMap
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Options par défaut pour les requêtes
const DEFAULT_OPTIONS = {
  units: 'metric', // Celsius
  lang: 'fr'       // Français
};

/**
 * Récupère les prévisions météorologiques pour une position donnée
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise} - Promesse contenant les données météo
 */
export const fetchForecast = async (lat, lng) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY,
        ...DEFAULT_OPTIONS
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des prévisions', error);
    throw error;
  }
};

/**
 * Récupère la météo actuelle pour une position donnée
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise} - Promesse contenant les données météo
 */
export const fetchCurrentWeather = async (lat, lng) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY,
        ...DEFAULT_OPTIONS
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la météo actuelle', error);
    throw error;
  }
};

/**
 * Récupère la météo pour plusieurs villes à la fois
 * @param {Array} cities - Tableau d'IDs de villes
 * @returns {Promise} - Promesse contenant les données météo groupées
 */
export const fetchMultipleCitiesWeather = async (cities) => {
  try {
    const idsString = cities.join(',');
    const response = await axios.get(`${BASE_URL}/group`, {
      params: {
        id: idsString,
        appid: API_KEY,
        ...DEFAULT_OPTIONS
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données groupées', error);
    throw error;
  }
};

/**
 * Simule une API pour récupérer les données des capteurs
 * À remplacer par un vrai appel API lorsque disponible
 * @returns {Promise} - Promesse contenant les données simulées des capteurs
 */
export const fetchSensorData = async () => {
  // Simulation d'un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Données fictives simulant des capteurs
  return [
    { id: 1, location: 'Paris', lat: 48.8566, lng: 2.3522, temperature: 15.2, humidity: 70 },
    { id: 2, location: 'Lyon', lat: 45.7640, lng: 4.8357, temperature: 18.5, humidity: 65 },
    { id: 3, location: 'Marseille', lat: 43.2965, lng: 5.3698, temperature: 22.3, humidity: 58 },
    { id: 4, location: 'Bordeaux', lat: 44.8378, lng: -0.5792, temperature: 17.8, humidity: 68 },
    { id: 5, location: 'Lille', lat: 50.6292, lng: 3.0573, temperature: 13.9, humidity: 75 },
    { id: 6, location: 'Strasbourg', lat: 48.5734, lng: 7.7521, temperature: 16.4, humidity: 62 },
    { id: 7, location: 'Nice', lat: 43.7102, lng: 7.2620, temperature: 21.6, humidity: 55 },
    { id: 8, location: 'Nantes', lat: 47.2184, lng: -1.5536, temperature: 16.9, humidity: 73 }
  ];
}; 