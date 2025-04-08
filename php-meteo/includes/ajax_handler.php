<?php
require_once 'config.php';
require_once 'functions.php';

// S'assurer que la requête est en AJAX
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Vérifier qu'une action est spécifiée
if (!isset($_GET['action'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'No action specified']);
    exit;
}

// Traiter l'action demandée
$action = $_GET['action'];

header('Content-Type: application/json');

switch ($action) {
    case 'get_weather':
        // Vérifier que la ville est spécifiée
        if (!isset($_GET['city'])) {
            echo json_encode(['error' => 'No city specified']);
            exit;
        }
        
        $city = $_GET['city'];
        $data = get_weather_data($city);
        
        if ($data === null) {
            echo json_encode(['error' => 'Failed to get weather data']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'city' => $data['name'],
                'temperature' => $data['main']['temp'],
                'humidity' => $data['main']['humidity'],
                'description' => $data['weather'][0]['description'],
                'icon' => $data['weather'][0]['icon'],
                'coordinates' => [
                    'lat' => $data['coord']['lat'],
                    'lon' => $data['coord']['lon']
                ]
            ]
        ]);
        break;
        
    case 'get_city_coordinates':
        // Vérifier que la ville est spécifiée
        if (!isset($_GET['city'])) {
            echo json_encode(['error' => 'No city specified']);
            exit;
        }
        
        $city = $_GET['city'];
        $coordinates = get_city_coordinates($city);
        
        if ($coordinates === null) {
            echo json_encode(['error' => 'Failed to get coordinates']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $coordinates
        ]);
        break;
        
    case 'get_mqtt_history':
        $hours = isset($_GET['hours']) ? intval($_GET['hours']) : 24;
        $data = get_mqtt_history($hours);
        
        if ($data === null) {
            echo json_encode(['error' => 'Failed to get MQTT history']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        break;
        
    case 'save_mqtt_data':
        // Cette action est appelée par une tâche PHP qui écoute le broker MQTT
        // Nous vérifions quand même les données requises
        $post_data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($post_data['temperature']) || !isset($post_data['humidity']) ||
            !isset($post_data['station_name']) || !isset($post_data['station_city'])) {
            echo json_encode(['error' => 'Missing parameters']);
            exit;
        }
        
        $success = save_mqtt_data(
            $post_data['temperature'],
            $post_data['humidity'],
            $post_data['station_name'],
            $post_data['station_city']
        );
        
        if (!$success) {
            echo json_encode(['error' => 'Failed to save MQTT data']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?> 