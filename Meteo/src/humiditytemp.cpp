#include "../lib/humiditytemp.h"
#include <DHT.h>

#define DHTPIN 21    
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

float temperature = 0.0;
float humidity = 0.0;

void setup_sensor() {
    dht.begin();
}

void read_and_publish_sensor() {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Erreur de lecture du capteur !");
        return;
    }

    Serial.print("Température : ");
    Serial.print(temperature);
    Serial.print(" °C, Humidité : ");
    Serial.print(humidity);
    Serial.println(" %");
}

float getTemperature() {
    return temperature;
}

float getHumidity() {
    return humidity;
}
