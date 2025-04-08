<?php
/**
 * Script d'écoute MQTT en arrière-plan
 * 
 * Usage: php mqtt_listener.php
 */

// Inclure les fichiers nécessaires
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/mqtt_client.php';

// Vérifier que le script est exécuté en ligne de commande
if (php_sapi_name() !== 'cli') {
    die('Ce script doit être exécuté en ligne de commande.');
}

// Afficher le message de démarrage
echo "Démarrage du script d'écoute MQTT..." . PHP_EOL;
echo "Host: " . MQTT_HOST . PHP_EOL;
echo "Port: " . MQTT_PORT . PHP_EOL;
echo "Topic: " . MQTT_TOPIC . PHP_EOL;
echo "Client ID: " . MQTT_CLIENT_ID . PHP_EOL;
echo "--------------------------------------------------------" . PHP_EOL;

// Créer un client MQTT
$client = new MqttClient(
    MQTT_HOST,
    MQTT_PORT,
    MQTT_CLIENT_ID,
    MQTT_TOPIC,
    true
);

// Gérer les signaux pour un arrêt propre
if (function_exists('pcntl_signal')) {
    declare(ticks = 1);
    
    pcntl_signal(SIGTERM, function() use ($client) {
        echo "Signal SIGTERM reçu, arrêt..." . PHP_EOL;
        $client->disconnect();
        exit(0);
    });
    
    pcntl_signal(SIGINT, function() use ($client) {
        echo "Signal SIGINT reçu, arrêt..." . PHP_EOL;
        $client->disconnect();
        exit(0);
    });
}

// Se connecter au broker MQTT
if ($client->connect()) {
    echo "Connecté au broker MQTT, écoute des messages..." . PHP_EOL;
    
    // Boucle d'écoute (ne retourne jamais sauf en cas d'erreur)
    $client->listen();
} else {
    echo "Échec de la connexion au broker MQTT" . PHP_EOL;
    exit(1);
}
?> 