#include <Arduino.h>
#include "../lib/humiditytemp.h"
#include "../lib/NETWORK.h"
#include "sensor.h"
#include "../lib/light.h"
#include "mqtt_client.h"

#define CS 5
Light lightSensor(CS);

void setup() {
    Serial.begin(115200);
    
    setup_wifi();
    setup_mqtt();
    setup_sensor();
    lightSensor.begin();
}

void loop() {
    handle_mqtt();

    read_and_publish_sensor();
    lightSensor.readSensor();

    float temperature = getTemperature();
    float humidity = getHumidity();
    int lightValue = lightSensor.getLightValue();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Erreur de lecture du capteur DHT11 !");
        return;
    }

    publish_sensor_data(temperature, humidity, lightValue);

    delay(1000);
}
