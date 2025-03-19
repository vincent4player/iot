import React, { useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { WeatherContext } from '../context/WeatherContext';
import 'leaflet/dist/leaflet.css';
import { formatTemperature, formatHumidity } from '../utils/weatherIcons';
import { FaSearchLocation } from 'react-icons/fa';

// Ajustement pour les icônes Leaflet qui ne s'affichent pas par défaut dans React
// Solution au problème des icônes manquantes
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Composant pour centrer la carte lorsque selectedLocation change
const MapCenterComponent = ({ selectedLocation }) => {
  const map = useMap();
  if (selectedLocation) {
    map.flyTo([selectedLocation.lat, selectedLocation.lng], 9, {
      animate: true,
      duration: 1.5
    });
  }
  return null;
};

// Composant pour le bouton de réinitialisation de la vue
const ResetViewButton = ({ defaultPosition, defaultZoom, resetSelection }) => {
  const map = useMap();
  
  const handleClick = () => {
    // Réinitialise la sélection dans le contexte
    resetSelection();
    
    // Réinitialise la vue de la carte
    map.flyTo(defaultPosition, defaultZoom, {
      animate: true,
      duration: 1.5
    });
  };
  
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '60px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button 
          className="flex items-center justify-center w-10 h-10 bg-white text-blue-500 hover:bg-blue-100 transition-colors"
          onClick={handleClick}
          title="Réinitialiser la vue"
        >
          <FaSearchLocation size={20} />
        </button>
      </div>
    </div>
  );
};

const Map = () => {
  const { sensorData, selectedLocation, setSelectedLocation, resetSelection } = useContext(WeatherContext);
  
  // Position par défaut au centre de la France
  const defaultPosition = [46.603354, 1.888334];
  const defaultZoom = 6;

  // Icône personnalisée pour les marqueurs
  const customIcon = (temp) => {
    const tempColor = temp < 10 ? 'blue' : temp < 20 ? 'green' : temp < 30 ? 'orange' : 'red';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${tempColor}; color: white; padding: 5px; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; border: 2px solid white;">${Math.round(temp)}°</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="map-container relative z-20">
      <MapContainer 
        center={defaultPosition} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Désactive le contrôle de zoom par défaut
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {sensorData.map((location) => (
          <Marker 
            key={location.id} 
            position={[location.lat, location.lng]}
            icon={customIcon(location.temperature)}
            eventHandlers={{
              click: () => handleMarkerClick(location),
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <h3 className="font-semibold text-lg mb-2">{location.location}</h3>
                <p className="mb-1">Température: {formatTemperature(location.temperature)}</p>
                <p>Humidité: {formatHumidity(location.humidity)}</p>
                <button 
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => handleMarkerClick(location)}
                >
                  Détails
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Composant pour centrer la carte sur le lieu sélectionné */}
        <MapCenterComponent selectedLocation={selectedLocation} />
        
        {/* Contrôle de zoom positionné en bas à droite */}
        <ZoomControl position="bottomright" />
        
        {/* Bouton de réinitialisation de la vue */}
        <ResetViewButton 
          defaultPosition={defaultPosition} 
          defaultZoom={defaultZoom} 
          resetSelection={resetSelection}
        />
      </MapContainer>
    </div>
  );
};

export default Map; 