/**
 * Configuration de l'application météo
 */
const CONFIG = {
    // Configuration MQTT
    mqtt: {
        host: 'broker.emqx.io',
        port: 8083, // Port WebSocket
        clientId: 'web_' + Math.random().toString(16).substr(2, 8),
        topic: 'ynovbdxb2/meteo'
    },
    
    // Configuration de la carte
    map: {
        center: [46.603354, 1.888334], // Centre de la France
        zoom: 5,
        maxZoom: 18,
        minZoom: 3
    },
    
    // Configuration des graphiques
    charts: {
        backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
        ],
        chartHours: 24, // Nombre d'heures d'historique à afficher
        refreshInterval: 60000 // Rafraîchir les graphiques toutes les minutes
    },
    
    // Configuration de l'intervalle de mise à jour des données
    refreshInterval: 60000, // 1 minute
    
    // Points météo prédéfinis (grandes villes françaises)
    cities: [
        { name: 'Paris', lat: 48.8566, lon: 2.3522 },
        { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
        { name: 'Lyon', lat: 45.7578, lon: 4.8320 },
        { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
        { name: 'Nice', lat: 43.7102, lon: 7.2620 },
        { name: 'Nantes', lat: 47.2184, lon: -1.5536 },
        { name: 'Strasbourg', lat: 48.5734, lon: 7.7521 },
        { name: 'Montpellier', lat: 43.6108, lon: 3.8767 },
        { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 }
    ]
}; 