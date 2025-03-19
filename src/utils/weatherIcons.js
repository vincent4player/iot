// Fonction pour obtenir l'URL de l'icône OpenWeatherMap
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// Fonction pour formater la température
export const formatTemperature = (temp) => {
  return `${Math.round(temp)}°C`;
};

// Fonction pour formater l'humidité
export const formatHumidity = (humidity) => {
  return `${Math.round(humidity)}%`;
};

// Fonction pour formater la date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fonction pour obtenir la description du temps en français
export const getWeatherDescription = (weatherCode) => {
  const descriptions = {
    200: 'Orage avec pluie légère',
    201: 'Orage avec pluie',
    202: 'Orage avec fortes précipitations',
    210: 'Orage léger',
    211: 'Orage',
    212: 'Orage violent',
    221: 'Orage irrégulier',
    230: 'Orage avec bruine légère',
    231: 'Orage avec bruine',
    232: 'Orage avec forte bruine',
    300: 'Bruine légère',
    301: 'Bruine',
    302: 'Forte bruine',
    310: 'Pluie légère et bruine',
    311: 'Pluie et bruine',
    312: 'Forte pluie et bruine',
    313: 'Averses et bruine',
    314: 'Fortes averses et bruine',
    321: 'Bruine d\'averses',
    500: 'Pluie légère',
    501: 'Pluie modérée',
    502: 'Pluie intense',
    503: 'Pluie très intense',
    504: 'Pluie extrême',
    511: 'Pluie verglaçante',
    520: 'Averses de pluie légère',
    521: 'Averses de pluie',
    522: 'Averses de pluie intense',
    531: 'Averses de pluie irrégulières',
    600: 'Neige légère',
    601: 'Neige',
    602: 'Fortes chutes de neige',
    611: 'Neige fondue',
    612: 'Averses de neige fondue',
    613: 'Fortes averses de neige fondue',
    615: 'Pluie légère et neige',
    616: 'Pluie et neige',
    620: 'Averses de neige légères',
    621: 'Averses de neige',
    622: 'Fortes averses de neige',
    701: 'Brouillard',
    711: 'Brume',
    721: 'Brume',
    731: 'Tourbillons de sable/poussière',
    741: 'Brouillard',
    751: 'Sable',
    761: 'Poussière',
    762: 'Cendres volcaniques',
    771: 'Rafales',
    781: 'Tornade',
    800: 'Ciel dégagé',
    801: 'Quelques nuages',
    802: 'Nuages épars',
    803: 'Nuages fragmentés',
    804: 'Ciel couvert'
  };
  
  return descriptions[weatherCode] || 'Information non disponible';
}; 