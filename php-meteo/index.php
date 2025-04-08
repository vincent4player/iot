<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';

// Vérifier si le client MQTT est déjà en cours d'exécution
$mqttRunning = false;
$lockFile = __DIR__ . '/logs/mqtt.lock';

// Créer le répertoire logs s'il n'existe pas
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0777, true);
}

// Vérifier si le fichier de verrouillage existe et s'il est récent (moins de 5 minutes)
if (file_exists($lockFile)) {
    $lockTime = filemtime($lockFile);
    if (time() - $lockTime < 300) { // 5 minutes = 300 secondes
        $mqttRunning = true;
    } else {
        // Le verrou est trop ancien, on le supprime
        unlink($lockFile);
    }
}

// Si le client MQTT n'est pas en cours d'exécution, on le démarre
if (!$mqttRunning) {
    // Créer le fichier de verrouillage
    file_put_contents($lockFile, date('Y-m-d H:i:s'));
    
    // Définir les permissions du fichier de verrouillage
    chmod($lockFile, 0666);
    
    // Inclure le client MQTT directement
    require_once 'includes/mqtt_client.php';
    
    // Initialiser le client MQTT
    $mqttClient = new MqttClient();
    $mqttClient->connect();
    
    // Marquer comme en cours d'exécution
    $mqttRunning = true;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Station Météo MQTT</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <?php if ($mqttRunning): ?>
        <div id="status-message" class="status success">Client MQTT démarré</div>
        <?php else: ?>
        <div id="status-message" class="status error">Client MQTT non démarré</div>
        <?php endif; ?>
        
        <header>
            <h1>Station Météo en temps réel</h1>
        </header>
        
        <main>
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h2>Carte des stations météo</h2>
                        </div>
                        <div class="card-body">
                            <div id="map"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h2>Station MQTT</h2>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="station-name">Nom de la station :</label>
                                <input type="text" id="station-name" name="station-name" value="Station YNOV" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="station-city">Ville :</label>
                                <input type="text" id="station-city" name="station-city" value="Bordeaux" class="form-control">
                                <button id="update-station" class="btn btn-primary">Mettre à jour</button>
                            </div>
                            <div class="mqtt-data">
                                <div class="data-item">
                                    <i class="fas fa-temperature-high"></i>
                                    <span id="mqtt-temperature">--</span> °C
                                </div>
                                <div class="data-item">
                                    <i class="fas fa-tint"></i>
                                    <span id="mqtt-humidity">--</span> %
                                </div>
                                <div class="data-item small">
                                    <i class="fas fa-clock"></i>
                                    Dernière mise à jour: <span id="mqtt-last-update">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h2>Historique de température</h2>
                        </div>
                        <div class="card-body">
                            <canvas id="temperature-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h2>Historique d'humidité</h2>
                        </div>
                        <div class="card-body">
                            <canvas id="humidity-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <footer>
            <p>&copy; <?php echo date('Y'); ?> - Station Météo MQTT</p>
        </footer>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/config.js"></script>
    <script src="js/mqtt.js"></script>
    <script src="js/charts.js"></script>
    <script src="js/map.js"></script>
    <script src="js/app.js"></script>
</body>
</html> 