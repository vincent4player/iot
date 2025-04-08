<?php
require_once 'config.php';
require_once 'functions.php';

/**
 * Classe pour gérer la connexion MQTT et le traitement des messages
 */
class MqttClient {
    private $host;
    private $port;
    private $clientId;
    private $topic;
    private $socket;
    private $keepAlive = 60;
    private $debug = false;
    
    /**
     * Constructeur
     *
     * @param string $host Adresse du broker MQTT
     * @param int $port Port du broker MQTT
     * @param string $clientId Identifiant client
     * @param string $topic Topic à écouter
     * @param bool $debug Activer le mode debug
     */
    public function __construct($host, $port, $clientId, $topic, $debug = false) {
        $this->host = $host;
        $this->port = $port;
        $this->clientId = $clientId;
        $this->topic = $topic;
        $this->debug = $debug;
    }
    
    /**
     * Se connecte au broker MQTT
     *
     * @return bool Succès de la connexion
     */
    public function connect() {
        $this->log("Tentative de connexion à {$this->host}:{$this->port}");
        
        $this->socket = fsockopen($this->host, $this->port, $errno, $errstr, 10);
        
        if (!$this->socket) {
            $this->log("Erreur de connexion: $errstr ($errno)", true);
            return false;
        }
        
        $this->log("Connecté au broker MQTT");
        
        // Construire le paquet CONNECT
        $buffer = '';
        
        // En-tête fixe
        $buffer .= chr(0x10); // Type de paquet CONNECT
        
        // Longueur restante (calcul simplifié)
        $clientIdLength = strlen($this->clientId);
        $buffer .= chr(2 + 3 + 1 + 2 + 1 + $clientIdLength); // 2 (longueur du protocol) + 3 (nom du protocol) + 1 (version) + 2 (flags) + 1 (keepalive) + longueur du client id
        
        // Nom du protocole
        $buffer .= chr(0x00);
        $buffer .= chr(0x03);
        $buffer .= "MQI";
        
        // Version du protocole
        $buffer .= chr(0x04); // MQTT 3.1.1
        
        // Flags de connexion
        $buffer .= chr(0x02); // Clean session
        
        // Keep alive
        $buffer .= chr(0x00);
        $buffer .= chr($this->keepAlive);
        
        // Client ID
        $buffer .= chr(0x00);
        $buffer .= chr($clientIdLength);
        $buffer .= $this->clientId;
        
        // Envoyer le paquet CONNECT
        fwrite($this->socket, $buffer);
        
        // Attendre la réponse CONNACK
        $response = fread($this->socket, 4);
        
        if (strlen($response) < 4) {
            $this->log("Réponse CONNACK trop courte", true);
            return false;
        }
        
        // Vérifier le code de retour
        $code = ord(substr($response, 3, 1));
        
        if ($code != 0) {
            $this->log("Connexion refusée, code: $code", true);
            return false;
        }
        
        $this->log("Connexion acceptée");
        
        // S'abonner au topic
        $this->subscribe($this->topic);
        
        return true;
    }
    
    /**
     * S'abonne à un topic
     *
     * @param string $topic Topic à écouter
     * @return bool Succès de l'abonnement
     */
    public function subscribe($topic) {
        $this->log("Abonnement au topic: $topic");
        
        // Construire le paquet SUBSCRIBE
        $buffer = '';
        
        // En-tête fixe
        $buffer .= chr(0x82); // Type de paquet SUBSCRIBE
        
        // Longueur restante (calcul simplifié)
        $topicLength = strlen($topic);
        $buffer .= chr(2 + 2 + $topicLength + 1); // 2 (packet id) + 2 (longueur du topic) + longueur du topic + 1 (qos)
        
        // Packet ID
        $buffer .= chr(0x00);
        $buffer .= chr(0x01);
        
        // Topic
        $buffer .= chr(0x00);
        $buffer .= chr($topicLength);
        $buffer .= $topic;
        
        // QoS
        $buffer .= chr(0x00);
        
        // Envoyer le paquet SUBSCRIBE
        fwrite($this->socket, $buffer);
        
        // Attendre la réponse SUBACK
        $response = fread($this->socket, 5);
        
        if (strlen($response) < 5) {
            $this->log("Réponse SUBACK trop courte", true);
            return false;
        }
        
        // Vérifier le code de retour
        $code = ord(substr($response, 4, 1));
        
        if ($code > 2) {
            $this->log("Abonnement refusé, code: $code", true);
            return false;
        }
        
        $this->log("Abonnement accepté");
        
        return true;
    }
    
    /**
     * Écoute les messages MQTT et traite les données reçues
     */
    public function listen() {
        $this->log("Écoute des messages...");
        
        while (true) {
            if (!is_resource($this->socket) || feof($this->socket)) {
                $this->log("Connexion perdue, tentative de reconnexion...", true);
                if (!$this->connect()) {
                    sleep(10);
                    continue;
                }
            }
            
            // Lire l'en-tête fixe
            $byte = fread($this->socket, 1);
            if (strlen($byte) != 1) {
                $this->log("Aucune donnée reçue, vérification de la connexion...");
                if (!feof($this->socket)) {
                    // La connexion est toujours active, attendre des données
                    sleep(1);
                    continue;
                } else {
                    // La connexion est fermée, reconnecter
                    $this->log("Connexion perdue, tentative de reconnexion...", true);
                    if (!$this->connect()) {
                        sleep(10);
                        continue;
                    }
                }
            }
            
            $packetType = ord($byte) >> 4;
            
            if ($packetType == 3) { // PUBLISH
                // Lire la longueur restante
                $multiplier = 1;
                $remainingLength = 0;
                do {
                    $digit = fread($this->socket, 1);
                    $remainingLength += (ord($digit) & 127) * $multiplier;
                    $multiplier *= 128;
                } while ((ord($digit) & 128) != 0);
                
                // Lire la longueur du topic
                $topicLengthMSB = ord(fread($this->socket, 1));
                $topicLengthLSB = ord(fread($this->socket, 1));
                $topicLength = ($topicLengthMSB << 8) + $topicLengthLSB;
                
                // Lire le topic
                $topic = fread($this->socket, $topicLength);
                
                // Lire le reste du message (payload)
                $payloadLength = $remainingLength - 2 - $topicLength;
                $payload = fread($this->socket, $payloadLength);
                
                // Traiter le message
                $this->processMessage($topic, $payload);
            }
        }
    }
    
    /**
     * Traite les messages MQTT reçus
     *
     * @param string $topic Topic du message
     * @param string $payload Contenu du message
     */
    private function processMessage($topic, $payload) {
        $this->log("Message reçu sur le topic: $topic");
        $this->log("Payload: $payload");
        
        // Vérifier que le topic correspond au topic attendu
        if ($topic == $this->topic) {
            try {
                // Décoder le payload JSON
                $data = json_decode($payload, true);
                
                if ($data === null) {
                    $this->log("Erreur de décodage JSON", true);
                    return;
                }
                
                // Vérifier que les données requises sont présentes
                if (!isset($data['temperature']) || !isset($data['humidity'])) {
                    $this->log("Données manquantes dans le message", true);
                    return;
                }
                
                // Enregistrer les données dans la base de données
                $stationName = 'Station YNOV';
                $stationCity = 'Bordeaux';
                
                $success = save_mqtt_data(
                    $data['temperature'],
                    $data['humidity'],
                    $stationName,
                    $stationCity
                );
                
                if ($success) {
                    $this->log("Données enregistrées avec succès");
                } else {
                    $this->log("Erreur lors de l'enregistrement des données", true);
                }
            } catch (Exception $e) {
                $this->log("Erreur lors du traitement du message: " . $e->getMessage(), true);
            }
        }
    }
    
    /**
     * Ferme la connexion au broker MQTT
     */
    public function disconnect() {
        $this->log("Déconnexion du broker MQTT");
        
        if (is_resource($this->socket)) {
            // Envoyer un paquet DISCONNECT
            fwrite($this->socket, chr(0xE0) . chr(0x00));
            fclose($this->socket);
        }
    }
    
    /**
     * Journalise un message
     *
     * @param string $message Message à journaliser
     * @param bool $isError Indique si c'est une erreur
     */
    private function log($message, $isError = false) {
        if ($this->debug || $isError) {
            $type = $isError ? 'ERROR' : 'INFO';
            log_message("[MQTT] $message", $type);
        }
    }
}

// Code principal
if (php_sapi_name() == 'cli') {
    // Exécution en ligne de commande
    echo "Démarrage du client MQTT...\n";
    
    $client = new MqttClient(
        MQTT_HOST,
        MQTT_PORT,
        MQTT_CLIENT_ID,
        MQTT_TOPIC,
        true
    );
    
    // Gestion des signaux pour un arrêt propre
    declare(ticks = 1);
    pcntl_signal(SIGTERM, function() use ($client) {
        echo "Signal SIGTERM reçu, arrêt...\n";
        $client->disconnect();
        exit(0);
    });
    
    pcntl_signal(SIGINT, function() use ($client) {
        echo "Signal SIGINT reçu, arrêt...\n";
        $client->disconnect();
        exit(0);
    });
    
    if ($client->connect()) {
        echo "Connecté au broker MQTT, écoute des messages...\n";
        $client->listen();
    } else {
        echo "Échec de la connexion au broker MQTT\n";
        exit(1);
    }
} else {
    // Exécution via le serveur web, rediriger vers la page d'accueil
    header('Location: ../index.php');
    exit;
}
?> 