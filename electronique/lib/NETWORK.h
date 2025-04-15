#ifndef NETWORK_H
#define NETWORK_H

void setup_mqtt();
void handle_mqtt();
void setup_wifi();
void publish_sensor_data(float temperature, float humidity, int lightValue);

#endif
