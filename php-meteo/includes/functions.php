<?php
/**
 * Fichier contenant des fonctions utilitaires
 */

/**
 * Initialise la base de données SQLite
 */
function init_database() {
    try {
        // Vérifier que le répertoire data existe
        if (!is_dir(DATA_PATH)) {
            mkdir(DATA_PATH, 0777, true);
        }
        
        $db = new SQLite3(DB_PATH);
        
        // Création de la table pour stocker les données MQTT
        $db->exec('CREATE TABLE IF NOT EXISTS mqtt_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL,
            humidity REAL,
            station_name TEXT,
            station_city TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )');
        
        // Création de la table pour stocker les données météo externes
        $db->exec('CREATE TABLE IF NOT EXISTS weather_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city_name TEXT,
            temperature REAL,
            humidity REAL,
            weather_description TEXT,
            icon TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )');
        
        $db->close();
        return true;
    } catch (Exception $e) {
        logMessage('Erreur lors de l\'initialisation de la base de données: ' . $e->getMessage(), 'ERROR');
        return false;
    }
}

/**
 * Récupère les données météo à partir d'une API externe
 * Cette fonction est désactivée car l'API key n'est pas configurée
 */
function get_weather_data($city) {
    logMessage("La fonction get_weather_data est désactivée car l'API key n'est pas configurée", 'INFO');
    return null;
    
    /* API non configurée - Code laissé pour référence
    $api_key = env('OPENWEATHERMAP_API_KEY', '');
    if (empty($api_key)) {
        logMessage("API key OpenWeatherMap non configurée", 'ERROR');
        return null;
    }
    
    $url = "https://api.openweathermap.org/data/2.5/weather?q=$city&units=metric&lang=fr&appid=$api_key";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200) {
        logMessage("Erreur lors de la récupération des données météo pour $city. Code HTTP: $http_code", 'ERROR');
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        logMessage("Erreur lors du décodage des données météo pour $city", 'ERROR');
        return null;
    }
    
    // Enregistrement dans la base de données
    save_weather_data($data);
    
    return $data;
    */
}

/**
 * Enregistre les données météo dans la base de données
 */
function save_weather_data($data) {
    try {
        $db = new SQLite3(DB_PATH);
        
        $stmt = $db->prepare('INSERT INTO weather_data (city_name, temperature, humidity, weather_description, icon)
                             VALUES (:city, :temp, :humidity, :description, :icon)');
        
        $stmt->bindValue(':city', $data['name'], SQLITE3_TEXT);
        $stmt->bindValue(':temp', $data['main']['temp'], SQLITE3_FLOAT);
        $stmt->bindValue(':humidity', $data['main']['humidity'], SQLITE3_FLOAT);
        $stmt->bindValue(':description', $data['weather'][0]['description'], SQLITE3_TEXT);
        $stmt->bindValue(':icon', $data['weather'][0]['icon'], SQLITE3_TEXT);
        
        $stmt->execute();
        $db->close();
        
        return true;
    } catch (Exception $e) {
        logMessage('Erreur lors de l\'enregistrement des données météo: ' . $e->getMessage(), 'ERROR');
        return false;
    }
}

/**
 * Enregistre les données MQTT dans la base de données
 */
function save_mqtt_data($temperature, $humidity, $station_name, $station_city) {
    try {
        $db = new SQLite3(DB_PATH);
        
        $stmt = $db->prepare('INSERT INTO mqtt_data (temperature, humidity, station_name, station_city)
                             VALUES (:temp, :humidity, :name, :city)');
        
        $stmt->bindValue(':temp', $temperature, SQLITE3_FLOAT);
        $stmt->bindValue(':humidity', $humidity, SQLITE3_FLOAT);
        $stmt->bindValue(':name', $station_name, SQLITE3_TEXT);
        $stmt->bindValue(':city', $station_city, SQLITE3_TEXT);
        
        $stmt->execute();
        $db->close();
        
        return true;
    } catch (Exception $e) {
        logMessage('Erreur lors de l\'enregistrement des données MQTT: ' . $e->getMessage(), 'ERROR');
        return false;
    }
}

/**
 * Récupère l'historique des données MQTT pour les graphiques
 */
function get_mqtt_history($hours = 24) {
    try {
        $db = new SQLite3(DB_PATH);
        
        $query = "SELECT temperature, humidity, datetime(timestamp, 'localtime') as time 
                 FROM mqtt_data 
                 WHERE timestamp >= datetime('now', '-$hours hours') 
                 ORDER BY timestamp ASC";
        
        $results = $db->query($query);
        
        $data = [
            'labels' => [],
            'temperature' => [],
            'humidity' => []
        ];
        
        while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
            $data['labels'][] = date('H:i', strtotime($row['time']));
            $data['temperature'][] = $row['temperature'];
            $data['humidity'][] = $row['humidity'];
        }
        
        $db->close();
        
        return $data;
    } catch (Exception $e) {
        logMessage('Erreur lors de la récupération de l\'historique MQTT: ' . $e->getMessage(), 'ERROR');
        return null;
    }
}

/**
 * Retourne les coordonnées géographiques d'une ville
 * Cette fonction est désactivée car l'API key n'est pas configurée
 */
function get_city_coordinates($city) {
    logMessage("La fonction get_city_coordinates est désactivée car l'API key n'est pas configurée", 'INFO');
    
    // Retourner des coordonnées par défaut pour Bordeaux
    if (strtolower($city) === 'bordeaux') {
        return ['lat' => 44.8378, 'lon' => -0.5792];
    }
    
    return null;
    
    /* API non configurée - Code laissé pour référence
    $api_key = env('OPENWEATHERMAP_API_KEY', '');
    if (empty($api_key)) {
        logMessage("API key OpenWeatherMap non configurée", 'ERROR');
        return null;
    }
    
    $url = "https://api.openweathermap.org/geo/1.0/direct?q=$city&limit=1&appid=$api_key";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200) {
        logMessage("Erreur lors de la récupération des coordonnées pour $city. Code HTTP: $http_code", 'ERROR');
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!$data || empty($data)) {
        logMessage("Aucune coordonnée trouvée pour $city", 'ERROR');
        return null;
    }
    
    return ['lat' => $data[0]['lat'], 'lon' => $data[0]['lon']];
    */
}

// Initialisation de la base de données au chargement de la page
init_database();
?> 