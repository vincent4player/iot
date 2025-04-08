/**
 * Classe pour gérer la connexion MQTT et les données
 */
class MqttHandler {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.connected = false;
        this.listeners = [];
        this.lastData = null;
        this.lastUpdate = null;
    }
    
    /**
     * Se connecte au broker MQTT
     */
    connect() {
        console.log(`Connexion au broker MQTT: ${this.config.host}:${this.config.port}`);
        
        try {
            // Créer un client MQTT
            this.client = new Paho.MQTT.Client(
                this.config.host,
                this.config.port,
                this.config.clientId
            );
            
            // Configurer les callbacks
            this.client.onConnectionLost = this.onConnectionLost.bind(this);
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            
            // Se connecter au broker
            this.client.connect({
                onSuccess: this.onConnect.bind(this),
                onFailure: this.onFailure.bind(this),
                useSSL: window.location.protocol === 'https:' // Utiliser SSL si le site est en HTTPS
            });
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la connexion MQTT:', error);
            return false;
        }
    }
    
    /**
     * Callback de connexion réussie
     */
    onConnect() {
        console.log('Connecté au broker MQTT');
        this.connected = true;
        
        // S'abonner au topic
        this.client.subscribe(this.config.topic);
        console.log(`Abonné au topic: ${this.config.topic}`);
        
        // Notifier les listeners
        this.notifyListeners('connect', { connected: true });
    }
    
    /**
     * Callback d'échec de connexion
     */
    onFailure(error) {
        console.error('Échec de connexion au broker MQTT:', error);
        this.connected = false;
        
        // Notifier les listeners
        this.notifyListeners('error', { error: 'Impossible de se connecter au broker MQTT' });
        
        // Tenter de se reconnecter après un délai
        setTimeout(() => {
            console.log('Tentative de reconnexion...');
            this.connect();
        }, 5000);
    }
    
    /**
     * Callback de perte de connexion
     */
    onConnectionLost(response) {
        console.error('Connexion MQTT perdue:', response.errorMessage);
        this.connected = false;
        
        // Notifier les listeners
        this.notifyListeners('disconnect', { error: 'Connexion au broker MQTT perdue' });
        
        // Tenter de se reconnecter après un délai
        setTimeout(() => {
            console.log('Tentative de reconnexion...');
            this.connect();
        }, 5000);
    }
    
    /**
     * Callback de réception de message
     */
    onMessageArrived(message) {
        console.log(`Message reçu sur le topic ${message.destinationName}:`, message.payloadString);
        
        try {
            // Analyser le message JSON
            const data = JSON.parse(message.payloadString);
            
            // Mettre à jour les données
            this.lastData = data;
            this.lastUpdate = new Date();
            
            // Notifier les listeners
            this.notifyListeners('message', {
                topic: message.destinationName,
                data: data,
                timestamp: this.lastUpdate
            });
            
            // Enregistrer les données via AJAX
            this.saveData(data);
        } catch (error) {
            console.error('Erreur lors du traitement du message MQTT:', error);
        }
    }
    
    /**
     * Enregistre les données via AJAX
     */
    saveData(data) {
        const stationName = document.getElementById('station-name').value || 'Station YNOV';
        const stationCity = document.getElementById('station-city').value || 'Bordeaux';
        
        const requestData = {
            temperature: data.temperature,
            humidity: data.humidity,
            station_name: stationName,
            station_city: stationCity
        };
        
        fetch('../includes/ajax_handler.php?action=save_mqtt_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                console.error('Erreur lors de l\'enregistrement des données MQTT:', result.error);
            }
        })
        .catch(error => {
            console.error('Erreur de requête pour l\'enregistrement des données MQTT:', error);
        });
    }
    
    /**
     * Ajoute un listener pour les événements MQTT
     */
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Notifie tous les listeners d'un événement
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Erreur dans un listener MQTT:', error);
            }
        });
    }
    
    /**
     * Vérifie si le client est connecté
     */
    isConnected() {
        return this.connected;
    }
    
    /**
     * Récupère les dernières données
     */
    getLastData() {
        return this.lastData;
    }
    
    /**
     * Récupère la date de dernière mise à jour
     */
    getLastUpdate() {
        return this.lastUpdate;
    }
}

// Créer une instance du gestionnaire MQTT
const mqttHandler = new MqttHandler(CONFIG.mqtt); 