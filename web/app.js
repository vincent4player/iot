// Configuration MQTT
const mqttConfig = {
    host: 'broker.emqx.io',
    port: 8083,
    clientId: 'web_' + Math.random().toString(16).substr(2, 8),
    topic: 'ynovbdxb2/meteo'
};

// Configuration des stations virtuelles
const virtualStations = [
    { 
        name: 'Munich',
        lat: 48.1351,
        lon: 11.5820,
        baseTemp: 15,
        baseHumidity: 65
    },
    {
        name: 'Milan',
        lat: 45.4642,
        lon: 9.1900,
        baseTemp: 18,
        baseHumidity: 60
    }
];

// Configuration OpenWeatherMap
const weatherConfig = {
    apiKey: 'c21a75b667d6f7abb81f118dcf8d4611',  // Clé API OpenWeatherMap
    cities: [
        { name: 'Paris', lat: 48.8566, lon: 2.3522 },
        { name: 'Lyon', lat: 45.75, lon: 4.85 },
        { name: 'Nantes', lat: 47.2184, lon: -1.5536 },
        { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
        { name: 'Toulouse', lat: 43.6045, lon: 1.4442 },
        { name: 'Bourges', lat: 47.0833, lon: 2.4 },
        { name: 'Nancy', lat: 48.6921, lon: 6.1844 }
    ],
    tempThreshold: 25 // Seuil de température (en °C) à partir duquel le cercle devient rouge
};

// Variables globales
let map;
let mqttClient;
let temperatureChart;
let humidityChart;
let virtualStationsInterval; // Pour stocker l'intervalle de mise à jour
// Charger la position sauvegardée ou utiliser Bordeaux par défaut
let stationPosition = JSON.parse(localStorage.getItem('stationPosition')) || { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 };
let db;
let markers = []; // Pour stocker les références aux marqueurs

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initialisation de l'application...");
    
    // Initialiser IndexedDB
    await initDatabase();
    console.log("Base de données IndexedDB initialisée");
    
    // Initialiser la carte
    initMap();
    console.log("Carte initialisée");
    
    // Initialiser les graphiques
    initCharts();
    console.log("Graphiques initialisés");
    
    // Charger les données historiques et mettre à jour les graphiques
    const historicalData = await getHistoricalData();
    console.log("Données historiques chargées:", historicalData.length, "entrées");
    updateCharts(historicalData);
    
    // Connecter au broker MQTT
    connectMqtt();
    console.log("Connexion MQTT établie");
    
    // Charger les données météo des villes
    fetchWeatherData();
    console.log("Données météo des villes chargées");
    
    // Gérer le formulaire de nom de station
    document.getElementById('saveStationName').addEventListener('click', saveStationName);
    
    // Mettre à jour le champ de saisie avec le nom de la ville actuelle
    const nameInput = document.getElementById('stationName');
    if (nameInput) {
        nameInput.value = stationPosition.name;
    }
    
    // Démarrer la mise à jour des stations virtuelles
    updateVirtualStations(); // Première mise à jour immédiate
    virtualStationsInterval = setInterval(updateVirtualStations, 5000); // Mise à jour toutes les 5 secondes
});

// Initialisation de la base de données IndexedDB
async function initDatabase() {
    try {
        db = await idb.openDB('meteoApp', 1, {
            upgrade(db) {
                console.log("Création/mise à jour de la base de données IndexedDB");
                const store = db.createObjectStore('meteoData', { 
                    keyPath: 'timestamp'
                });
                store.createIndex('timestamp', 'timestamp');
            }
        });
        console.log("Base de données IndexedDB prête");
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de données:", error);
    }
}

// Sauvegarde des données dans IndexedDB
async function saveDataToDb(data) {
    try {
        data.timestamp = new Date().getTime();
        await db.add('meteoData', data);
        console.log("Données sauvegardées dans IndexedDB:", data);
        
        // Nettoyer les anciennes données (garder seulement les 24 dernières heures)
        const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
        const allData = await db.getAll('meteoData');
        
        // Supprimer les données plus anciennes qu'un jour
        const keysToDelete = allData
            .filter(item => item.timestamp < oneDayAgo)
            .map(item => item.timestamp);
            
        for (const key of keysToDelete) {
            await db.delete('meteoData', key);
        }
        
        if (keysToDelete.length > 0) {
            console.log("Nettoyage de la base de données:", keysToDelete.length, "entrées supprimées");
        }
        
        // Suppression de la limite de 100 entrées pour conserver l'historique complet
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
}

// Récupération des données historiques
async function getHistoricalData() {
    try {
        const allData = await db.getAll('meteoData');
        console.log("Récupération de", allData.length, "entrées depuis IndexedDB");
        return allData.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error('Erreur lors de la récupération des données historiques:', error);
        return [];
    }
}

// Initialisation de la carte
function initMap() {
    map = L.map('map').setView([46.603354, 1.888334], 6); // Vue centrée sur la France
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Ajouter le marqueur de notre station
    addStationMarker();
}

// Ajout du marqueur de notre station
function addStationMarker() {
    // Créer un marqueur personnalisé qui combine le cercle et la température
    const customIcon = L.divIcon({
        html: `
            <div class="custom-marker" style="
                width: 40px;
                height: 40px;
                background-color: #2ecc71;
                border: 2px solid #27ae60;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;">
                --°
            </div>
        `,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
    
    // Créer le marqueur unique
    const marker = L.marker([stationPosition.lat, stationPosition.lon], {
        icon: customIcon,
        interactive: true
    }).addTo(map);
    
    // Créer le contenu du popup
    const popupContent = `<div class="popup-content"><b>${stationPosition.name}</b><br>Chargement des données...</div>`;
    
    // Ajouter le popup au marqueur
    marker.bindPopup(popupContent, {
        closeButton: true,
        autoClose: false,
        maxWidth: 200
    });
    
    // Stocker le marqueur
    markers.push({
        type: 'station',
        marker: marker,
        position: [stationPosition.lat, stationPosition.lon]
    });
}

// Mise à jour du popup et de la couleur de notre station
function updateStationMarker(temperature, humidity, light) {
    // Trouver le marqueur de notre station
    const stationMarker = markers.find(m => m.type === 'station');
    if (stationMarker) {
        // Supprimer l'ancien marqueur
        stationMarker.marker.remove();
        
        // Déterminer la couleur en fonction de la température
        const tempValue = parseFloat(temperature);
        const fillColor = tempValue >= weatherConfig.tempThreshold ? '#e74c3c' : '#2ecc71';
        const color = tempValue >= weatherConfig.tempThreshold ? '#c0392b' : '#27ae60';
        
        // Créer un marqueur personnalisé qui combine le cercle et la température
        const customIcon = L.divIcon({
            html: `
                <div class="custom-marker" style="
                    width: 40px;
                    height: 40px;
                    background-color: ${fillColor};
                    border: 2px solid ${color};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;">
                    ${temperature}°
                </div>
            `,
            className: 'custom-marker-container',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        // Créer le nouveau marqueur
        const marker = L.marker([stationPosition.lat, stationPosition.lon], {
            icon: customIcon,
            interactive: true
        }).addTo(map);
        
        // Créer le contenu du popup avec la luminosité
        const popupContent = `
            <div class="popup-content">
                <b>${stationPosition.name}</b><br>
                Température: ${temperature}°C<br>
                Humidité: ${humidity}%<br>
                Luminosité: ${light} lux
            </div>`;
        
        // Ajouter le popup au marqueur
        marker.bindPopup(popupContent, {
            closeButton: true,
            autoClose: false,
            maxWidth: 200
        });
        
        // Mettre à jour le marqueur dans le tableau
        stationMarker.marker = marker;
    }
}

// Enregistrement du nom de la station
async function saveStationName() {
    const nameInput = document.getElementById('stationName');
    const cityName = nameInput.value || 'Bordeaux';
    
    try {
        // Utiliser l'API de géocodage d'OpenWeatherMap pour obtenir les coordonnées
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${weatherConfig.apiKey}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Mettre à jour la position et le nom de la station
            stationPosition = {
                name: cityName,
                lat: data[0].lat,
                lon: data[0].lon
            };
            
            // Sauvegarder la position dans le localStorage
            localStorage.setItem('stationPosition', JSON.stringify(stationPosition));
            
            // Recréer la carte pour mettre à jour le marqueur
            map.remove();
            markers = []; // Réinitialiser les marqueurs
            initMap();
            
            // Recharger les données météo
            fetchWeatherData();
            
            // Mettre à jour le statut
            const statusMessage = document.getElementById('status-message');
            if (statusMessage) {
                statusMessage.textContent = `Station déplacée à ${cityName}`;
                statusMessage.className = 'status success';
                setTimeout(() => {
                    statusMessage.className = 'status';
                }, 3000);
            }

            // Mettre à jour la valeur du champ de saisie
            nameInput.value = cityName;
        } else {
            throw new Error('Ville non trouvée');
        }
    } catch (error) {
        console.error('Erreur lors de la géolocalisation:', error);
        // Afficher un message d'erreur
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = `Erreur: impossible de trouver la ville "${cityName}"`;
            statusMessage.className = 'status error';
            setTimeout(() => {
                statusMessage.className = 'status';
            }, 3000);
        }
    }
}

// Connexion au broker MQTT
function connectMqtt() {
    const connectUrl = `ws://${mqttConfig.host}:${mqttConfig.port}/mqtt`;
    
    mqttClient = mqtt.connect(connectUrl, {
        clientId: mqttConfig.clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000
    });
    
    mqttClient.on('connect', () => {
        console.log('Connecté au broker MQTT');
        mqttClient.subscribe(mqttConfig.topic, (err) => {
            if (!err) {
                console.log(`Abonné au topic: ${mqttConfig.topic}`);
            }
        });
    });
    
    mqttClient.on('message', (topic, message) => {
        if (topic === mqttConfig.topic) {
            try {
                const payload = JSON.parse(message.toString());
                const temperature = parseFloat(payload.temperature).toFixed(1);
                const humidity = parseFloat(payload.humidity).toFixed(1);
                const light = parseFloat(payload.light).toFixed(0); // Ajout de la luminosité
                
                console.log("Message MQTT reçu:", { temperature, humidity, light });
                
                // Mettre à jour l'interface
                document.getElementById('mqtt-temperature').textContent = `${temperature} °C`;
                document.getElementById('mqtt-humidity').textContent = `${humidity} %`;
                document.getElementById('mqtt-light').textContent = `${light} lux`; // Ajout de l'affichage de la luminosité
                document.getElementById('mqtt-last-update').textContent = new Date().toLocaleTimeString();
                
                // Mettre à jour le marqueur sur la carte avec la luminosité
                updateStationMarker(temperature, humidity, light);
                
                // Sauvegarder les données dans la base de données
                saveDataToDb({
                    temperature: parseFloat(temperature),
                    humidity: parseFloat(humidity),
                    light: parseFloat(light) // Ajout de la luminosité dans la sauvegarde
                }).then(() => {
                    // Mettre à jour les graphiques avec les nouvelles données
                    getHistoricalData().then(data => {
                        updateCharts(data);
                    });
                });
            } catch (error) {
                console.error('Erreur lors du traitement du message MQTT:', error);
            }
        }
    });
    
    mqttClient.on('error', (error) => {
        console.error('Erreur MQTT:', error);
    });
}

// Initialisation des graphiques
function initCharts() {
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const humCtx = document.getElementById('humidityChart').getContext('2d');
    
    // Configuration commune pour les graphiques
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0 // Désactiver les animations pour une meilleure performance
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14
                },
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    title: function(tooltipItems) {
                        return `Heure: ${tooltipItems[0].label}`;
                    },
                    label: function(context) {
                        if (context.parsed.y === null) return null;
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value}${context.dataset.label.includes('Température') ? '°C' : '%'}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 12
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        elements: {
            point: {
                radius: 3,
                hoverRadius: 5
            },
            line: {
                tension: 0.3,
                spanGaps: true // Permet de connecter les points même s'il y a des valeurs nulles
            }
        }
    };
    
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Température (°C)',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Température (°C)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                }
            }
        }
    });
    
    humidityChart = new Chart(humCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidité (%)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    beginAtZero: false,
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Humidité (%)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Mise à jour des graphiques
function updateCharts(data) {
    if (!data || data.length === 0) return;
    
    // Regrouper les données par heure et limiter à 24 dernières heures
    const groupedData = groupDataByHour(data);
    const last24Hours = groupedData.slice(-24);
    
    // Extraire les labels et les valeurs moyennes
    const labels = last24Hours.map(item => item.hour);
    const temperatures = last24Hours.map(item => item.avgTemp);
    const humidities = last24Hours.map(item => item.avgHumidity);
    
    // Mettre à jour le graphique de température
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temperatures;
    
    // Calculer les limites min/max pour l'axe Y de la température
    const tempMin = Math.min(...temperatures) - 2;
    const tempMax = Math.max(...temperatures) + 2;
    temperatureChart.options.scales.y.min = Math.floor(tempMin);
    temperatureChart.options.scales.y.max = Math.ceil(tempMax);
    
    temperatureChart.update('none'); // 'none' pour une mise à jour plus fluide
    
    // Mettre à jour le graphique d'humidité
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = humidities;
    humidityChart.update('none');
}

// Fonction pour regrouper les données par heure
function groupDataByHour(data) {
    // Obtenir l'heure il y a 24 heures
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Filtrer les données des dernières 24 heures
    const recentData = data.filter(item => item.timestamp >= twentyFourHoursAgo.getTime());
    
    // Créer un objet pour stocker les données regroupées
    const groupedByHour = {};
    
    // Initialiser toutes les heures des dernières 24h avec des valeurs vides
    for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setHours(date.getHours() - i);
        const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
        groupedByHour[hourKey] = {
            sumTemp: 0,
            sumHumidity: 0,
            count: 0
        };
    }
    
    // Parcourir les données récentes et les regrouper par heure
    recentData.forEach(item => {
        const date = new Date(item.timestamp);
        const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
        
        groupedByHour[hourKey].sumTemp += item.temperature;
        groupedByHour[hourKey].sumHumidity += item.humidity;
        groupedByHour[hourKey].count++;
    });
    
    // Convertir l'objet en tableau et calculer les moyennes
    const result = Object.entries(groupedByHour).map(([hour, group]) => ({
        hour: hour,
        avgTemp: group.count > 0 ? (group.sumTemp / group.count).toFixed(1) : null,
        avgHumidity: group.count > 0 ? (group.sumHumidity / group.count).toFixed(1) : null
    }));
    
    // Trier par heure
    return result.sort((a, b) => {
        const hourA = parseInt(a.hour);
        const hourB = parseInt(b.hour);
        return hourA - hourB;
    });
}

// Récupération des données météo des villes via OpenWeatherMap
function fetchWeatherData() {
    // Supprimer les marqueurs de villes existants
    markers.filter(m => m.type === 'city').forEach(m => {
        if (m.circle) m.circle.remove();
    });
    
    // Filtrer les marqueurs pour ne garder que celui de la station
    markers = markers.filter(m => m.type === 'station');
    
    weatherConfig.cities.forEach(city => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${weatherConfig.apiKey}`)
            .then(response => response.json())
            .then(data => {
                const temperature = data.main.temp.toFixed(1);
                const humidity = data.main.humidity.toFixed(1);
                
                // Utiliser une couleur bleue pour toutes les villes
                const fillColor = '#3498db'; // Bleu clair
                const color = '#2980b9';     // Bleu foncé pour la bordure
                
                // Créer un marqueur personnalisé qui combine le cercle et la température
                const customIcon = L.divIcon({
                    html: `
                        <div class="custom-marker" style="
                            width: 40px;
                            height: 40px;
                            background-color: ${fillColor};
                            border: 2px solid ${color};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 14px;">
                            ${temperature}°
                        </div>
                    `,
                    className: 'custom-marker-container',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, -20]
                });
                
                // Créer le marqueur unique
                const marker = L.marker([city.lat, city.lon], {
                    icon: customIcon,
                    interactive: true
                }).addTo(map);
                
                // Créer le contenu du popup
                const popupContent = `<div class="popup-content"><b>${city.name}</b><br>Température: ${temperature}°C<br>Humidité: ${humidity}%</div>`;
                
                // Ajouter le popup au marqueur
                marker.bindPopup(popupContent, {
                    closeButton: true,
                    autoClose: false,
                    maxWidth: 200
                });
                
                // Stocker le marqueur
                markers.push({
                    type: 'city',
                    name: city.name,
                    circle: marker,
                    position: [city.lat, city.lon]
                });
            })
            .catch(error => {
                console.error(`Erreur lors de la récupération des données pour ${city.name}:`, error);
            });
    });
}

// Fonction pour générer des données sinusoïdales
function generateSinusoidalData(baseValue, amplitude = 2, period = 3600000) {
    const now = Date.now();
    const variation = amplitude * Math.sin((2 * Math.PI * now) / period);
    return (baseValue + variation).toFixed(1);
}

// Fonction pour mettre à jour les stations virtuelles
function updateVirtualStations() {
    virtualStations.forEach(station => {
        const temperature = generateSinusoidalData(station.baseTemp);
        const humidity = generateSinusoidalData(station.baseHumidity);
        
        // Créer un marqueur personnalisé pour la station virtuelle
        const customIcon = L.divIcon({
            html: `
                <div class="custom-marker" style="
                    width: 40px;
                    height: 40px;
                    background-color: #9b59b6;
                    border: 2px solid #8e44ad;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;">
                    ${temperature}°
                </div>
            `,
            className: 'custom-marker-container',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });

        // Trouver le marqueur existant ou en créer un nouveau
        let existingMarker = markers.find(m => m.type === 'virtual' && m.name === station.name);
        
        if (existingMarker) {
            existingMarker.marker.remove();
        }

        // Créer le nouveau marqueur
        const marker = L.marker([station.lat, station.lon], {
            icon: customIcon,
            interactive: true
        }).addTo(map);

        // Créer le contenu du popup
        const popupContent = `
            <div class="popup-content">
                <b>${station.name}</b>Station météo<br>
                Température: ${temperature}°C<br>
                Humidité: ${humidity}%
            </div>`;

        // Ajouter le popup au marqueur
        marker.bindPopup(popupContent, {
            closeButton: true,
            autoClose: false,
            maxWidth: 200
        });

        // Mettre à jour ou ajouter le marqueur dans le tableau
        if (existingMarker) {
            existingMarker.marker = marker;
        } else {
            markers.push({
                type: 'virtual',
                name: station.name,
                marker: marker,
                position: [station.lat, station.lon]
            });
        }
    });
}

// Nettoyage lors de la fermeture de l'application
window.addEventListener('beforeunload', () => {
    if (virtualStationsInterval) {
        clearInterval(virtualStationsInterval);
    }
}); 