// Configuration MQTT
const mqttConfig = {
    host: 'broker.emqx.io',
    port: 8083,
    clientId: 'web_' + Math.random().toString(16).substr(2, 8),
    topic: 'ynovbdxb2/meteo'
};

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
let stationPosition = { name: 'Ma Station', lat: 44.8378, lon: -0.5792 }; // Position par défaut (Bordeaux)
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
    // Créer un cercle vert pour notre station avec une zone interactive plus grande
    const circle = L.circleMarker([stationPosition.lat, stationPosition.lon], {
        radius: 20,
        fillColor: '#2ecc71', // Vert par défaut pour notre station
        color: '#27ae60',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        interactive: true, // S'assurer que le cercle est interactif
        bubblingMouseEvents: true // Permettre aux événements de souris de se propager
    }).addTo(map);
    
    // Créer le contenu du popup
    const popupContent = `<div class="popup-content"><b>${stationPosition.name}</b><br>Chargement des données...</div>`;
    
    // Ajouter le popup au cercle
    circle.bindPopup(popupContent, {
        closeButton: true,
        autoClose: false,
        maxWidth: 200
    });
    
    // Ajouter un événement de clic sur toute la zone du cercle
    circle.on('click', function(e) {
        console.log("Clic sur le marqueur de station");
        this.openPopup();
    });
    
    // Stocker le marqueur
    markers.push({
        type: 'station',
        circle: circle,
        position: [stationPosition.lat, stationPosition.lon]
    });
}

// Mise à jour du popup et de la couleur de notre station
function updateStationMarker(temperature, humidity) {
    // Trouver le marqueur de notre station
    const stationMarker = markers.find(m => m.type === 'station');
    if (stationMarker) {
        // Supprimer l'ancien marqueur
        stationMarker.circle.remove();
        
        // Déterminer la couleur en fonction de la température
        const tempValue = parseFloat(temperature);
        const fillColor = tempValue >= weatherConfig.tempThreshold ? '#e74c3c' : '#2ecc71';
        const color = tempValue >= weatherConfig.tempThreshold ? '#c0392b' : '#27ae60';
        
        // Créer un nouveau cercle avec la bonne couleur
        const circle = L.circleMarker([stationPosition.lat, stationPosition.lon], {
            radius: 20,
            fillColor: fillColor,
            color: color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
            interactive: true, // S'assurer que le cercle est interactif
            bubblingMouseEvents: true // Permettre aux événements de souris de se propager
        }).addTo(map);
        
        // Ajouter le texte de température au centre du cercle
        const icon = L.divIcon({
            html: `<div style="color:white; font-weight:bold; font-size:14px;">${temperature}°</div>`,
            className: 'temp-label',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        const label = L.marker([stationPosition.lat, stationPosition.lon], {
            icon: icon,
            interactive: false // Le label ne doit pas être interactif pour éviter les conflits
        }).addTo(map);
        
        // Créer le contenu du popup
        const popupContent = `<div class="popup-content"><b>${stationPosition.name}</b><br>Température: ${temperature}°C<br>Humidité: ${humidity}%</div>`;
        
        // Ajouter le popup au cercle
        circle.bindPopup(popupContent, {
            closeButton: true,
            autoClose: false,
            maxWidth: 200
        });
        
        // Ajouter un événement de clic sur toute la zone du cercle
        circle.on('click', function(e) {
            console.log("Clic sur le marqueur de station mis à jour");
            this.openPopup();
        });
        
        // Mettre à jour le marqueur dans le tableau
        stationMarker.circle = circle;
        stationMarker.label = label;
    }
}

// Enregistrement du nom de la station
function saveStationName() {
    const nameInput = document.getElementById('stationName');
    stationPosition.name = nameInput.value || 'Ma Station';
    
    // Recréer la carte pour mettre à jour le marqueur
    map.remove();
    markers = []; // Réinitialiser les marqueurs
    initMap();
    
    // Recharger les données météo
    fetchWeatherData();
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
                
                console.log("Message MQTT reçu:", { temperature, humidity });
                
                // Mettre à jour l'interface
                document.getElementById('mqtt-temperature').textContent = `${temperature} °C`;
                document.getElementById('mqtt-humidity').textContent = `${humidity} %`;
                document.getElementById('mqtt-last-update').textContent = new Date().toLocaleTimeString();
                
                // Mettre à jour le marqueur sur la carte
                updateStationMarker(temperature, humidity);
                
                // Sauvegarder les données dans la base de données
                saveDataToDb({
                    temperature: parseFloat(temperature),
                    humidity: parseFloat(humidity)
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
                radius: 4,
                hoverRadius: 6
            },
            line: {
                tension: 0.3
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
    
    // Regrouper les données par heure
    const groupedData = groupDataByHour(data);
    
    // Extraire les labels et les valeurs moyennes
    const labels = groupedData.map(item => item.hour);
    const temperatures = groupedData.map(item => item.avgTemp);
    const humidities = groupedData.map(item => item.avgHumidity);
    
    // Mettre à jour le graphique de température
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temperatures;
    temperatureChart.update();
    
    // Mettre à jour le graphique d'humidité
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = humidities;
    humidityChart.update();
}

// Fonction pour regrouper les données par heure
function groupDataByHour(data) {
    // Trier les données par timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // Créer un objet pour stocker les données regroupées
    const groupedByHour = {};
    
    // Parcourir toutes les données et les regrouper par heure
    sortedData.forEach(item => {
        const date = new Date(item.timestamp);
        const hourKey = `${date.getHours()}:00`;
        
        if (!groupedByHour[hourKey]) {
            groupedByHour[hourKey] = {
                sumTemp: 0,
                sumHumidity: 0,
                count: 0
            };
        }
        
        groupedByHour[hourKey].sumTemp += item.temperature;
        groupedByHour[hourKey].sumHumidity += item.humidity;
        groupedByHour[hourKey].count++;
    });
    
    // Convertir l'objet en tableau et calculer les moyennes
    const result = Object.keys(groupedByHour).map(hour => {
        const group = groupedByHour[hour];
        return {
            hour: hour,
            avgTemp: (group.sumTemp / group.count).toFixed(1),
            avgHumidity: (group.sumHumidity / group.count).toFixed(1)
        };
    });
    
    // Trier par heure
    return result.sort((a, b) => {
        const hourA = parseInt(a.hour.split(':')[0]);
        const hourB = parseInt(b.hour.split(':')[0]);
        return hourA - hourB;
    });
}

// Récupération des données météo des villes via OpenWeatherMap
function fetchWeatherData() {
    // Supprimer les marqueurs de villes existants
    markers.filter(m => m.type === 'city').forEach(m => {
        if (m.circle) m.circle.remove();
        if (m.label) m.label.remove();
    });
    
    // Filtrer les marqueurs pour ne garder que celui de la station
    markers = markers.filter(m => m.type === 'station');
    
    weatherConfig.cities.forEach(city => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${weatherConfig.apiKey}`)
            .then(response => response.json())
            .then(data => {
                const temperature = data.main.temp.toFixed(1);
                const humidity = data.main.humidity.toFixed(1);
                
                // Déterminer la couleur en fonction de la température
                const tempValue = parseFloat(temperature);
                const fillColor = tempValue >= weatherConfig.tempThreshold ? '#e74c3c' : '#2ecc71';
                const color = tempValue >= weatherConfig.tempThreshold ? '#c0392b' : '#27ae60';
                
                // Créer un cercle pour la ville avec une zone interactive plus grande
                const circle = L.circleMarker([city.lat, city.lon], {
                    radius: 20,
                    fillColor: fillColor,
                    color: color,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                    interactive: true, // S'assurer que le cercle est interactif
                    bubblingMouseEvents: true // Permettre aux événements de souris de se propager
                }).addTo(map);
                
                // Ajouter le texte de température au centre du cercle
                const icon = L.divIcon({
                    html: `<div style="color:white; font-weight:bold; font-size:14px;">${temperature}°</div>`,
                    className: 'temp-label',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                
                const label = L.marker([city.lat, city.lon], {
                    icon: icon,
                    interactive: false // Le label ne doit pas être interactif pour éviter les conflits
                }).addTo(map);
                
                // Créer le contenu du popup
                const popupContent = `<div class="popup-content"><b>${city.name}</b><br>Température: ${temperature}°C<br>Humidité: ${humidity}%</div>`;
                
                // Ajouter le popup au cercle
                circle.bindPopup(popupContent, {
                    closeButton: true,
                    autoClose: false,
                    maxWidth: 200
                });
                
                // Ajouter un événement de clic sur toute la zone du cercle
                circle.on('click', function(e) {
                    console.log(`Clic sur le marqueur de ${city.name}`);
                    this.openPopup();
                });
                
                // Stocker le marqueur
                markers.push({
                    type: 'city',
                    name: city.name,
                    circle: circle,
                    label: label,
                    position: [city.lat, city.lon]
                });
            })
            .catch(error => {
                console.error(`Erreur lors de la récupération des données pour ${city.name}:`, error);
            });
    });
} 