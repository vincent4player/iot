<?php
/**
 * Configuration de l'application
 */

// Configuration des chemins
define('ROOT_PATH', dirname(__DIR__));
define('LOGS_PATH', ROOT_PATH . '/logs');
define('DATA_PATH', ROOT_PATH . '/data');
define('DB_PATH', DATA_PATH . '/' . (env('DB_DATABASE', 'meteo.db')));

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
                
                // Enlever les guillemets si présents
                if (preg_match('/^"(.+)"$/', $value, $matches)) {
                    $value = $matches[1];
                }
                
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

// Configuration MQTT
define('MQTT_HOST', env('MQTT_HOST', 'broker.hivemq.com'));
define('MQTT_PORT', env('MQTT_PORT', 1883));
define('MQTT_CLIENT_ID', env('MQTT_CLIENT_ID', 'php_meteo_') . uniqid());
define('MQTT_TOPIC', env('MQTT_TOPIC', 'ynov/bordeaux'));

// Configuration de la base de données
define('DB_CONNECTION', env('DB_CONNECTION', 'sqlite'));
define('DB_DATABASE', env('DB_DATABASE', 'meteo.db'));

// Configuration de l'application
define('APP_NAME', env('APP_NAME', 'Station Météo YNOV'));
define('APP_DEBUG', env('APP_DEBUG', true));

// Configuration des intervalles de mise à jour
define('UPDATE_INTERVAL', env('UPDATE_INTERVAL', 10)); // secondes
define('MAX_HISTORY', env('MAX_HISTORY', 24)); // nombre de mesures à conserver

// Configuration des seuils d'alerte
define('TEMP_MIN', env('TEMP_MIN', 10));
define('TEMP_MAX', env('TEMP_MAX', 35));
define('HUM_MIN', env('HUM_MIN', 20));
define('HUM_MAX', env('HUM_MAX', 80));

// Fonction pour vérifier si l'application est en mode debug
function isDebug() {
    return APP_DEBUG === true || APP_DEBUG === 'true';
}

// Fonction pour journaliser un message
function logMessage($message, $type = 'INFO') {
    try {
        if (!is_dir(LOGS_PATH)) {
            mkdir(LOGS_PATH, 0777, true);
        }
        
        $logFile = LOGS_PATH . '/app.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp][$type] $message" . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        if (isDebug() && $type === 'ERROR') {
            error_log("$type: $message");
        }
    } catch (Exception $e) {
        error_log("Erreur de journalisation: " . $e->getMessage());
    }
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

// Configurer la gestion des erreurs en fonction du mode debug
if (isDebug()) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
}
?> 