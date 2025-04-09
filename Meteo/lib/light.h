#ifndef LIGHT_H
#define LIGHT_H

#include <Arduino.h>

class Light {
public:
    Light(int cs);
    void begin();
    void readSensor();
    void printValues();
    int getLightValue();

private:
    int csPin;
    uint8_t recu[2];
    int lumiere;
};

#endif
