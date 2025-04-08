/**
 * Classe pour gérer la carte et les marqueurs
 */
class MapHandler {
    constructor(config) {
        this.config = config;
        this.map = null;
        this.markers = {};
        this.mqttMarker = null;
    }
    
    /**
     * Initialise la carte
     */
    init() {
        // Créer la carte
        this.map = L.map('map').setView(this.config.center, this.config.zoom);
        
        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: this.config.maxZoom,
            minZoom: this.config.minZoom
        }).addTo(this.map);
        
        // Ajouter des marqueurs pour les villes prédéfinies
        this.addPredefinedMarkers();
        
        return this;
    }
    
    /**
     * Ajoute les marqueurs pour les villes prédéfinies
     */
    addPredefinedMarkers() {
        CONFIG.cities.forEach(city => {
            this.getWeatherData(city.name, city.lat, city.lon);
        });
    }
    
    /**
     * Récupère les données météo pour une ville et ajoute un marqueur
     */
    getWeatherData(city, lat, lon) {
        // Faire une requête AJAX pour récupérer les données météo
        fetch(`../includes/ajax_handler.php?action=get_weather&city=${encodeURIComponent(city)}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Ajouter un marqueur pour cette ville
                this.addWeatherMarker(city, result.data, lat, lon);
            } else {
                console.error(`Erreur lors de la récupération des données pour ${city}:`, result.error);
            }
        })
        .catch(error => {
            console.error(`Erreur de requête pour ${city}:`, error);
        });
    }
    
    /**
     * Ajoute un marqueur météo sur la carte
     */
    addWeatherMarker(city, data, lat, lon) {
        // Créer une icône personnalisée
        const tempColor = data.temperature > 25 ? 'red' : (data.temperature < 10 ? 'blue' : 'orange');
        
        const markerIcon = L.divIcon({
            className: 'weather-marker',
            html: `<div class="marker-inner" style="background-color: ${tempColor};">${Math.round(data.temperature)}°</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
        
        // Créer le marqueur
        const marker = L.marker([lat, lon], {
            icon: markerIcon,
            title: city
        }).addTo(this.map);
        
        // Ajouter un popup
        marker.bindPopup(`
            <div class="popup-content">
                <h3>${city}</h3>
                <p><i class="fas fa-temperature-high"></i> ${data.temperature.toFixed(1)} °C</p>
                <p><i class="fas fa-tint"></i> ${data.humidity.toFixed(1)} %</p>
                <p><i class="fas fa-cloud"></i> ${data.description}</p>
            </div>
        `);
        
        // Stocker le marqueur
        this.markers[city] = marker;
        
        return marker;
    }
    
    /**
     * Ajoute ou met à jour le marqueur MQTT
     */
    updateMqttMarker(data) {
        const stationName = document.getElementById('station-name').value || 'Station YNOV';
        const stationCity = document.getElementById('station-city').value || 'Bordeaux';
        
        // Récupérer les coordonnées de la ville
        this.getCityCoordinates(stationCity, (coordinates) => {
            if (!coordinates) {
                console.error(`Coordonnées non trouvées pour ${stationCity}`);
                return;
            }
            
            // Créer une icône personnalisée
            const tempColor = data.temperature > 25 ? 'red' : (data.temperature < 10 ? 'blue' : 'green');
            
            const markerIcon = L.divIcon({
                className: 'mqtt-marker',
                html: `<div class="marker-inner" style="background-color: ${tempColor};">${Math.round(data.temperature)}°</div>`,
                iconSize: [50, 50],
                iconAnchor: [25, 50],
                popupAnchor: [0, -50]
            });
            
            // Mettre à jour ou créer le marqueur
            if (this.mqttMarker) {
                this.mqttMarker.setLatLng([coordinates.lat, coordinates.lon]);
                this.mqttMarker.setIcon(markerIcon);
            } else {
                this.mqttMarker = L.marker([coordinates.lat, coordinates.lon], {
                    icon: markerIcon,
                    title: stationName
                }).addTo(this.map);
            }
            
            // Mettre à jour le popup
            const timestamp = new Date().toLocaleTimeString();
            
            this.mqttMarker.bindPopup(`
                <div class="popup-content mqtt">
                    <h3>${stationName}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${stationCity}</p>
                    <p><i class="fas fa-temperature-high"></i> ${data.temperature.toFixed(1)} °C</p>
                    <p><i class="fas fa-tint"></i> ${data.humidity.toFixed(1)} %</p>
                    <p class="small"><i class="fas fa-clock"></i> Dernière mise à jour: ${timestamp}</p>
                </div>
            `);
            
            // Centrer la carte sur le marqueur MQTT
            this.map.setView([coordinates.lat, coordinates.lon], 10);
        });
    }
    
    /**
     * Récupère les coordonnées d'une ville
     */
    getCityCoordinates(city, callback) {
        // Vérifier si la ville est dans les villes prédéfinies
        const predefined = CONFIG.cities.find(c => c.name.toLowerCase() === city.toLowerCase());
        
        if (predefined) {
            callback({ lat: predefined.lat, lon: predefined.lon });
            return;
        }
        
        // Sinon, faire une requête AJAX
        fetch(`../includes/ajax_handler.php?action=get_city_coordinates&city=${encodeURIComponent(city)}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                callback(result.data);
            } else {
                console.error(`Erreur lors de la récupération des coordonnées pour ${city}:`, result.error);
                callback(null);
            }
        })
        .catch(error => {
            console.error(`Erreur de requête pour les coordonnées de ${city}:`, error);
            callback(null);
        });
    }
}

// Créer une instance du gestionnaire de carte
const mapHandler = new MapHandler(CONFIG.map); 