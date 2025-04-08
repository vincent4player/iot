/**
 * Application principale
 */
class App {
    constructor() {
        this.mqttHandler = mqttHandler;
        this.mapHandler = mapHandler;
        this.chartHandler = chartHandler;
        this.updateInterval = null;
    }
    
    /**
     * Initialise l'application
     */
    init() {
        // Initialiser la carte
        this.mapHandler.init();
        
        // Initialiser les graphiques
        this.chartHandler.init();
        
        // Connecter au broker MQTT
        this.mqttHandler.connect();
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Configurer l'intervalle de mise à jour
        this.setupUpdateInterval();
        
        console.log('Application initialisée');
        
        return this;
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouter les événements MQTT
        this.mqttHandler.addListener((event, data) => {
            this.handleMqttEvent(event, data);
        });
        
        // Écouter le bouton de mise à jour de la station
        document.getElementById('update-station').addEventListener('click', () => {
            const stationName = document.getElementById('station-name').value;
            const stationCity = document.getElementById('station-city').value;
            
            if (!stationName || !stationCity) {
                alert('Veuillez entrer un nom et une ville pour la station');
                return;
            }
            
            // Mettre à jour les données si disponibles
            const lastData = this.mqttHandler.getLastData();
            if (lastData) {
                this.mapHandler.updateMqttMarker(lastData);
            }
        });
    }
    
    /**
     * Configure l'intervalle de mise à jour des données
     */
    setupUpdateInterval() {
        // Vérifier et afficher les dernières données toutes les minutes
        this.updateInterval = setInterval(() => {
            this.refreshDisplay();
        }, CONFIG.refreshInterval);
    }
    
    /**
     * Gère les événements MQTT
     */
    handleMqttEvent(event, data) {
        switch (event) {
            case 'connect':
                console.log('Connecté au broker MQTT');
                this.showStatus('Connecté au broker MQTT', false);
                break;
                
            case 'disconnect':
                console.log('Déconnecté du broker MQTT');
                this.showStatus('Déconnecté du broker MQTT', true);
                break;
                
            case 'error':
                console.error('Erreur MQTT:', data.error);
                this.showStatus(data.error, true);
                break;
                
            case 'message':
                console.log('Message MQTT reçu:', data);
                
                // Mettre à jour les données affichées
                this.updateDisplay(data.data, data.timestamp);
                break;
        }
    }
    
    /**
     * Actualise l'affichage avec les dernières données disponibles
     */
    refreshDisplay() {
        const lastData = this.mqttHandler.getLastData();
        const lastUpdate = this.mqttHandler.getLastUpdate();
        
        if (lastData && lastUpdate) {
            this.updateDisplay(lastData, lastUpdate);
        }
    }
    
    /**
     * Met à jour l'affichage avec de nouvelles données
     */
    updateDisplay(data, timestamp) {
        // Mettre à jour le marqueur sur la carte
        this.mapHandler.updateMqttMarker(data);
        
        // Ajouter un point de données aux graphiques
        this.chartHandler.addMqttDataPoint(data);
        
        // Mettre à jour les valeurs affichées
        document.getElementById('mqtt-temperature').textContent = data.temperature.toFixed(1);
        document.getElementById('mqtt-humidity').textContent = data.humidity.toFixed(1);
        document.getElementById('mqtt-last-update').textContent = timestamp.toLocaleTimeString();
    }
    
    /**
     * Affiche un message de statut
     */
    showStatus(message, isError = false) {
        // Créer ou obtenir l'élément de statut
        let statusElement = document.getElementById('status-message');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'status-message';
            document.querySelector('.container').prepend(statusElement);
        }
        
        // Mettre à jour le message et la classe
        statusElement.textContent = message;
        statusElement.className = isError ? 'status error' : 'status success';
        
        // Afficher le message
        statusElement.style.display = 'block';
        
        // Masquer le message après 5 secondes
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Créer et initialiser l'application
    const app = new App();
    app.init();
}); 