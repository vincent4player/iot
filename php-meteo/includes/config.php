<?php
// Configuration générale
define('APP_NAME', 'Station Météo MQTT');
define('APP_VERSION', '1.0');
define('DEBUG_MODE', true);

// Fuseau horaire
date_default_timezone_set('Europe/Paris');

// Configuration OpenWeatherMap
define('OPENWEATHERMAP_API_KEY', 'VOTRE_CLE_API'); // Remplacer par votre clé API
define('OPENWEATHERMAP_API_URL', 'https://api.openweathermap.org/data/2.5/weather');

// Configuration de la base de données SQLite
define('DB_PATH', __DIR__ . '/../db/meteo.db');

// Configuration MQTT
define('MQTT_HOST', 'broker.emqx.io');
define('MQTT_PORT', 1883);
define('MQTT_CLIENT_ID', 'mqttx_f6c62fdf');
define('MQTT_TOPIC', 'ynovbdxb2/meteo');

// Erreur de reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Fonction pour les logs
function log_message($message, $type = 'INFO') {
    $log_file = __DIR__ . '/../logs/app.log';
    $log_dir = dirname($log_file);
    
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0777, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$type] $message" . PHP_EOL;
    
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}
?> 