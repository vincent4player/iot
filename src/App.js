import React, { useContext, useEffect, useState } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import { TemperatureCard, HumidityCard } from './components/WeatherCard';
import { TemperatureChart, HumidityChart } from './components/WeatherChart';
import Forecast from './components/Forecast';
import { WeatherContext } from './context/WeatherContext';

function App() {
  const { 
    sensorData, 
    selectedLocation, 
    historicalData, 
    forecastData, 
    isLoading 
  } = useContext(WeatherContext);
  
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Mise à jour de l'heure actuelle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000); // Mise à jour toutes les minutes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold mb-2 md:mb-0">Carte météorologique de la France</h2>
            {selectedLocation && (
              <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
                Ville sélectionnée: {selectedLocation.location}
              </div>
            )}
          </div>
          
          <div className="relative">
            <SearchBar />
            <Map />
          </div>
        </section>
        
        <section id="dashboard" className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Conditions météorologiques actuelles</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {selectedLocation ? (
              // Affichage des données pour la localisation sélectionnée
              <>
                <TemperatureCard 
                  temperature={selectedLocation.temperature} 
                  location={selectedLocation.location} 
                  time={currentTime}
                  isHighlighted={true}
                />
                <HumidityCard 
                  humidity={selectedLocation.humidity} 
                  location={selectedLocation.location} 
                  time={currentTime}
                  isHighlighted={true}
                />
              </>
            ) : (
              // Affichage des villes principales si aucune localisation n'est sélectionnée
              sensorData.slice(0, 4).map(city => (
                <TemperatureCard 
                  key={city.id}
                  temperature={city.temperature} 
                  location={city.location} 
                  time={currentTime}
                />
              ))
            )}
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {selectedLocation 
              ? `Prévisions pour ${selectedLocation.location}` 
              : "Prévisions météorologiques"}
          </h2>
          <Forecast forecasts={forecastData} isLoading={isLoading} />
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Historique des dernières 24 heures</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TemperatureChart data={historicalData.temperature} />
            <HumidityChart data={historicalData.humidity} />
          </div>
        </section>
      </main>
      
      <footer className="bg-blue-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Météo France Dashboard | Données météorologiques en temps réel</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 