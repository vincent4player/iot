<?php
require_once 'config.php';

class Database {
    private static $instance = null;
    private $db;

    private function __construct() {
        $dbPath = ROOT_PATH . '/data/' . DB_DATABASE;
        
        // Créer le répertoire data s'il n'existe pas
        if (!is_dir(ROOT_PATH . '/data')) {
            mkdir(ROOT_PATH . '/data', 0777, true);
        }

        try {
            $this->db = new SQLite3($dbPath);
            $this->initializeTables();
        } catch (Exception $e) {
            logMessage("Erreur de connexion à la base de données: " . $e->getMessage(), 'ERROR');
            die("Erreur de connexion à la base de données");
        }
    }

    private function initializeTables() {
        // Table des mesures
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // Table des alertes
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                value REAL NOT NULL,
                threshold REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ');
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->db;
    }

    public function insertMeasurement($temperature, $humidity) {
        $stmt = $this->db->prepare('
            INSERT INTO measurements (temperature, humidity)
            VALUES (:temperature, :humidity)
        ');
        
        $stmt->bindValue(':temperature', $temperature, SQLITE3_FLOAT);
        $stmt->bindValue(':humidity', $humidity, SQLITE3_FLOAT);
        
        return $stmt->execute();
    }

    public function getLastMeasurements($limit = 24) {
        $stmt = $this->db->prepare('
            SELECT temperature, humidity, timestamp
            FROM measurements
            ORDER BY timestamp DESC
            LIMIT :limit
        ');
        
        $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        $measurements = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $measurements[] = $row;
        }
        
        return array_reverse($measurements);
    }

    public function insertAlert($type, $message, $value, $threshold) {
        $stmt = $this->db->prepare('
            INSERT INTO alerts (type, message, value, threshold)
            VALUES (:type, :message, :value, :threshold)
        ');
        
        $stmt->bindValue(':type', $type, SQLITE3_TEXT);
        $stmt->bindValue(':message', $message, SQLITE3_TEXT);
        $stmt->bindValue(':value', $value, SQLITE3_FLOAT);
        $stmt->bindValue(':threshold', $threshold, SQLITE3_FLOAT);
        
        return $stmt->execute();
    }

    public function getLastAlerts($limit = 10) {
        $stmt = $this->db->prepare('
            SELECT type, message, value, threshold, timestamp
            FROM alerts
            ORDER BY timestamp DESC
            LIMIT :limit
        ');
        
        $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        $alerts = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $alerts[] = $row;
        }
        
        return $alerts;
    }
} 