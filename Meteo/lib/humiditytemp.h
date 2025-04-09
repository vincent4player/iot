#ifndef HUMIDITYTEMP_H
#define HUMIDITYTEMP_H

void setup_sensor();
void read_and_publish_sensor();
float getTemperature();
float getHumidity();

#endif
