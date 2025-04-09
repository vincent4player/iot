#include "../lib/light.h"
#include <Arduino.h>
#include <SPI.h>

#define CS 5

Light::Light(int cs) : csPin(cs) {}

void Light::begin() {
    Serial.begin(115200);
    SPI.begin(18, 19, -1, CS);
    SPI.setDataMode(SPI_MODE0);
    SPI.setClockDivider(SPI_CLOCK_DIV16);
    pinMode(csPin, OUTPUT);
}

void Light::readSensor() {
    digitalWrite(csPin, LOW);
    for (int i = 0; i < 2; i++) {
        recu[i] = SPI.transfer(0);
    }
    digitalWrite(csPin, HIGH);
    lumiere = (recu[0] << 3) | (recu[1] >> 4);
}

void Light::printValues() {
    Serial.print("Lumière (brute) = ");
    Serial.println(lumiere);

    float lux = getLux();
    Serial.print("Éclairement (lux) = ");
    Serial.println(lux);
}

int Light::getLightValue() {
    return lumiere;
}

float Light::getLux() {
    return lumiere * facteur_conversion;
}
