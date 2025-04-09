#ifndef LIGHT_H
#define LIGHT_H

#include <stdint.h>

class Light {
private:
    int csPin;
    uint8_t recu[2];
    int lumiere;
    float facteur_conversion = 0.5;

public:
    Light(int cs);
    void begin();
    void readSensor();
    void printValues();
    int getLightValue();
    float getLux();
};

#endif
