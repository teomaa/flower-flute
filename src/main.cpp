#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>

#define CONSOLE_IP "192.168.1.2"
#define CONSOLE_PORT 4210
#define TOUCH_THRESHOLD 40

const char* ssid = "Flower Flute";
const char* password = "12345678";
WiFiUDP Udp;
IPAddress local_ip(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

void setup()
{
  Serial.begin(115200);
  WiFi.softAP(ssid, password);
  WiFi.softAPConfig(local_ip, gateway, subnet);
}

void loop()
{
  bool flute1 = touchRead(T5) < TOUCH_THRESHOLD;  // GPIO 12
  bool flute2 = touchRead(T4) < TOUCH_THRESHOLD;  // GPIO 13
  bool flute3 = touchRead(T3) < TOUCH_THRESHOLD;  // GPIO 15
  bool flute4 = touchRead(T2) < TOUCH_THRESHOLD;  // GPIO 2
  bool modeChange = touchRead(T9) < TOUCH_THRESHOLD; // GPIO 32
  bool mouthPiece = touchRead(T7) < TOUCH_THRESHOLD; // GPIO 27

  // Pack 6 booleans into a single byte: bits 0-5
  uint8_t packed = (flute1 << 0) | (flute2 << 1) | (flute3 << 2)
                 | (flute4 << 3) | (modeChange << 4) | (mouthPiece << 5);

  Udp.beginPacket(CONSOLE_IP, CONSOLE_PORT);
  Udp.write(packed);
  Udp.endPacket();

  delay(1000);
}
