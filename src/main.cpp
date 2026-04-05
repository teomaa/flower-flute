#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <esp_wifi.h>
#include <esp_pm.h>

#define CONSOLE_IP "192.168.1.2"
#define CONSOLE_PORT 4210
#define TOUCH_THRESHOLD 40

const char* ssid = "Flower Flute";
const char* password = "12345678";
WiFiUDP Udp;
IPAddress local_ip(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

uint8_t lastPacked = 0xFF; // impossible initial value to force first send
unsigned long lastSendTime = 0;

void setup()
{
  Serial.begin(115200);

  // Lock CPU to max frequency — prevent dynamic frequency scaling
  esp_pm_config_esp32_t pm_config = {
    .max_freq_mhz = 240,
    .min_freq_mhz = 240,
    .light_sleep_enable = false
  };
  esp_pm_configure(&pm_config);

  WiFi.softAP(ssid, password);
  WiFi.softAPConfig(local_ip, gateway, subnet);

  // Disable all WiFi power saving
  esp_wifi_set_ps(WIFI_PS_NONE);

  // Max WiFi TX power for reliable, fast transmission
  esp_wifi_set_max_tx_power(78);
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

  unsigned long now = millis();
  // Send immediately on change, or every 200ms as a heartbeat
  if (packed != lastPacked || now - lastSendTime >= 200) {
    Udp.beginPacket(CONSOLE_IP, CONSOLE_PORT);
    Udp.write(packed);
    Udp.endPacket();
    lastPacked = packed;
    lastSendTime = now;
  }

  delay(1); // minimal yield to WiFi stack without triggering sleep
}
