<?php
/**
 * Configuration de l'application
 */

// Configuration MQTT
define('MQTT_HOST', 'broker.hivemq.com');
define('MQTT_PORT', 1883);
define('MQTT_CLIENT_ID', 'php_meteo_' . uniqid());
define('MQTT_TOPIC', 'ynov/bordeaux');

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'u208279855_meteo');
define('DB_USER', 'u208279855_meteo');
define('DB_PASS', 'Meteo2024!');

// Configuration des chemins
define('ROOT_PATH', dirname(__DIR__));
define('LOGS_PATH', ROOT_PATH . '/logs');
define('DATA_PATH', ROOT_PATH . '/data');

// Configuration de l'application
define('APP_NAME', 'Station Météo YNOV');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);

// Configuration des intervalles de mise à jour
define('UPDATE_INTERVAL', 10); // secondes
define('MAX_HISTORY', 24); // nombre de mesures à conserver

// Configuration des seuils d'alerte
define('TEMP_MIN', 10);
define('TEMP_MAX', 35);
define('HUM_MIN', 20);
define('HUM_MAX', 80);

// Fonction pour charger les variables d'environnement
function loadEnv() {
    $envFile = ROOT_PATH . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (!empty($key)) {
                    putenv("$key=$value");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
    }
}

// Charger les variables d'environnement
loadEnv();

// Fonction pour obtenir une variable d'environnement avec une valeur par défaut
function env($key, $default = null) {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

// Fonction pour vérifier si l'application est en mode debug
function isDebug() {
    return APP_DEBUG || env('APP_DEBUG', false);
}

// Fonction pour journaliser un message
function logMessage($message, $type = 'INFO') {
    $logFile = LOGS_PATH . '/app.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp][$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Fonction pour créer les répertoires nécessaires
function createDirectories() {
    $directories = [LOGS_PATH, DATA_PATH];
    foreach ($directories as $directory) {
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }
    }
}

// Créer les répertoires nécessaires
createDirectories();
?> 