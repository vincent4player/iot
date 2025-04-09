#include <WiFiManager.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// Définition des constantes MQTT
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* clientId = "mqttx_f6c62fdf";
const char* publishTopic = "ynovbdxb2/meteo";
const char* subscribeTopic = "ynovbdxb2/meteo";

// Définition du capteur DHT11
#define DHTPIN 21    
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Initialisation WiFi et MQTT
WiFiClient espClient;
PubSubClient client(espClient);
WiFiManager wm;

// Définition du bouton de reset WiFi (GPIO0)
#define RESET_WIFI_PIN 0

void setup_wifi() {
    Serial.println("Connexion au WiFi...");
    if (!wm.autoConnect("ESP32_ConfigPortal")) {
        Serial.println("Échec de connexion, redémarrage...");
        ESP.restart();
    }
    Serial.println("WiFi connecté !");
    Serial.print("Adresse IP locale: ");
    Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
    Serial.print("Message reçu sur le topic: ");
    Serial.print(topic);
    Serial.print(" => ");
    for (int i = 0; i < length; i++) {
        Serial.print((char)message[i]);
    }
    Serial.println();
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Tentative de connexion MQTT...");
        if (client.connect(clientId)) {
            Serial.println("Connecté au broker MQTT !");
            client.subscribe(subscribeTopic);
            Serial.print("Abonné au topic: ");
            Serial.println(subscribeTopic);
        } else {
            Serial.print("Échec, code erreur: ");
            Serial.print(client.state());
            Serial.println(" Nouvelle tentative dans 5s...");
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(RESET_WIFI_PIN, INPUT_PULLUP);

    // Vérification du bouton reset WiFi
    if (digitalRead(RESET_WIFI_PIN) == LOW) {
        Serial.println("Effacement de la configuration WiFi...");
        wm.resetSettings();
        ESP.restart();
    }

    // Configuration WiFi avec WiFiManager
    setup_wifi();
    
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
    dht.begin();
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    static unsigned long lastMsg = 0;
    unsigned long now = millis();
    if (now - lastMsg > 10000) {
        lastMsg = now;
        
        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();
        
        if (isnan(temperature) || isnan(humidity)) {
            Serial.println("Erreur de lecture du capteur DHT11 !");
            return;
        }
        
        String msg = "{";
        msg += "\"temperature\": " + String(temperature) + ", ";
        msg += "\"humidity\": " + String(humidity) + "}";
        
        Serial.print("Publication MQTT: ");
        Serial.println(msg);
        
        client.publish(publishTopic, msg.c_str());
    }
}
