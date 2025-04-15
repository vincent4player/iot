#include "mqtt_client.h"
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiManager.h>
#define RESET_WIFI_PIN 0

const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* clientId = "mqttx_f6c62fdf";
const char* publishTopic = "ynovbdxb2/meteo";
const char* subscribeTopic = "ynovbdxb2/meteo";

WiFiManager wm;
WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
    pinMode(RESET_WIFI_PIN, INPUT_PULLUP);

    if (digitalRead(RESET_WIFI_PIN) == LOW) {
        Serial.println("Effacement de la configuration WiFi...");
        wm.resetSettings();
        ESP.restart();
    }

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

void setup_mqtt() {
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void handle_mqtt() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();
}

void publish_sensor_data(float temperature, float humidity, int lightValue) {
    if (!client.connected()) return;

    String msg = "{";
    msg += "\"temperature\": " + String(temperature) + ", ";
    msg += "\"humidity\": " + String(humidity) + ", ";
    msg += "\"light\": " + String(lightValue);
    msg += "}";

    Serial.print("Publication MQTT: ");
    Serial.println(msg);

    client.publish(publishTopic, msg.c_str());
}
