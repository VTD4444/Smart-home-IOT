#include <Arduino.h>
#include "DHT.h"
#include <WiFi.h>
#include <PubSubClient.h>

// --- CẤU HÌNH WIFI & MQTT BROKER ---
const char* ssid = "Redmi K50G";
const char* password = "88888888";
const char* mqtt_server = "192.168.144.181";
const int mqtt_port = 8000;
const char* mqtt_user = "dinhvutrungduc";
const char* mqtt_pass = "123456";

// --- QUY HOẠCH TOPIC MQTT ---
const char* TOPIC_SENSOR = "hw/sensor";
const char* TOPIC_SENSOR_ERROR = "hw/sensor/error";
const char* TOPIC_CONTROL = "hw/control";
const char* TOPIC_FEEDBACK = "hw/feedback";

WiFiClient espClient;
PubSubClient client(espClient);

// Định nghĩa chân cảm biến & LED
#define DHTPIN 4
#define DHTTYPE DHT11
#define LIGHT_SENSOR_PIN 34
#define LED_TEMP 2     
#define LED_HUMID 22   
#define LED_LIGHT 18   
#define LED_AUX 17
#define TEMP_THRESHOLD 30.0
#define HUMID_THRESHOLD 80.0
#define LIGHT_THRESHOLD_DARK 150
#define LIGHT_SAMPLES 10
#define PIR_PIN 13
#define PIR_LED_PIN 21
const int PIR_ACTIVE_LEVEL = HIGH;
const unsigned long PIR_DEBOUNCE_MS = 180;

unsigned long lastEnvRead = 0;
const unsigned long ENV_INTERVAL = 2000;
int lastMotionState = LOW;
int pirRawLast = LOW;
int pirStableState = LOW;
unsigned long pirLastEdgeAt = 0;

// Biến cờ riêng cho từng đèn: true = đang bị điều khiển thủ công qua MQTT
bool overrideTemp  = false;
bool overrideHumid = false;
bool overrideLight = false;
bool overridePir   = false;
bool overrideAux   = false;

DHT dht(DHTPIN, DHTTYPE);

int readLightAnalogAverage() {
  long sum = 0;
  for (int i = 0; i < LIGHT_SAMPLES; i++) {
    sum += analogRead(LIGHT_SENSOR_PIN);
    delay(5);
  }
  return (int)(sum / LIGHT_SAMPLES);
}

float adcToLux(int adcValue) {
  int invertedADC = 4095 - adcValue;
  float voltage = invertedADC * (3.3 / 4095.0);
  if (voltage <= 0.01) return 0;
  float resistance = (3.3 - voltage) * 10000 / voltage;
  float lux = 500 / (resistance / 1000);
  return lux;
}

void animWave() {
  int pins[] = {LED_TEMP, LED_LIGHT, PIR_LED_PIN, LED_HUMID, LED_AUX};
  for (int round = 0; round < 3; round++) {
    for (int i = 0; i < 5; i++) {       // Tiến
      digitalWrite(pins[i], HIGH);
      delay(120);
      digitalWrite(pins[i], LOW);
    }
    for (int i = 3; i >= 1; i--) {     // Lùi
      digitalWrite(pins[i], HIGH);
      delay(120);
      digitalWrite(pins[i], LOW);
    }
  }
}

void animPulse() {
  int pins[] = {LED_TEMP, LED_HUMID, LED_LIGHT, PIR_LED_PIN, LED_AUX};
  int delays[] = {350, 220, 110, 55, 55, 110, 220, 350};
  for (int d = 0; d < 8; d++) {
    for (int i = 0; i < 5; i++) digitalWrite(pins[i], HIGH);
    delay(delays[d]);
    for (int i = 0; i < 5; i++) digitalWrite(pins[i], LOW);
    delay(delays[d]);
  }
}

// Hàm khởi tạo WiFi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Dang ket noi den ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi da ket noi!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void ensure_wifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[WiFi] Mat ket noi, dang ket noi lai...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Da ket noi lai, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] Ket noi lai that bai");
  }
}

bool publishWithLog(const char* topic, const char* payload) {
  bool ok = client.publish(topic, payload);
  Serial.print("[MQTT] PUB ");
  Serial.print(topic);
  Serial.print(" -> ");
  Serial.print(ok ? "OK" : "FAIL");
  Serial.print(" | payload: ");
  Serial.println(payload);
  if (!ok) {
    Serial.print("[MQTT] state=");
    Serial.println(client.state());
  }
  return ok;
}

int normalizePirState(int raw) {
  return raw == PIR_ACTIVE_LEVEL ? HIGH : LOW;
}

// Hàm nhận lệnh điều khiển từ MQTT (Callback)
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Nhan lenh tu topic [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // Xử lý lệnh điều khiển đèn
  if (String(topic) == TOPIC_CONTROL) {

    // --- Bật/tắt TẤT CẢ ---
    if (message == "ON") {
      overrideTemp = overrideHumid = overrideLight = overridePir = overrideAux = true;
      digitalWrite(LED_TEMP,    HIGH);
      digitalWrite(LED_HUMID,   HIGH);
      digitalWrite(LED_LIGHT,   HIGH);
      digitalWrite(PIR_LED_PIN, HIGH);
      digitalWrite(LED_AUX, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: Da BAT tat ca den");

    } else if (message == "OFF") {
      overrideTemp = overrideHumid = overrideLight = overridePir = overrideAux = false;
      digitalWrite(LED_TEMP,    LOW);
      digitalWrite(LED_HUMID,   LOW);
      digitalWrite(LED_LIGHT,   LOW);
      digitalWrite(PIR_LED_PIN, LOW);
      digitalWrite(LED_AUX, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: Da TAT het den, tro ve che do Tu Dong");

    // --- Điều khiển từng đèn ---
    } else if (message == "LED_TEMP:ON") {
      overrideTemp = true;
      digitalWrite(LED_TEMP, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: BAT den nhiet do");

    } else if (message == "LED_TEMP:OFF") {
      overrideTemp = false;
      digitalWrite(LED_TEMP, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: TAT den nhiet do, tro ve Tu Dong");

    } else if (message == "LED_HUMID:ON") {
      overrideHumid = true;
      digitalWrite(LED_HUMID, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: BAT den do am");

    } else if (message == "LED_HUMID:OFF") {
      overrideHumid = false;
      digitalWrite(LED_HUMID, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: TAT den do am, tro ve Tu Dong");

    } else if (message == "LED_LIGHT:ON") {
      overrideLight = true;
      digitalWrite(LED_LIGHT, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: BAT den anh sang");

    } else if (message == "LED_LIGHT:OFF") {
      overrideLight = false;
      digitalWrite(LED_LIGHT, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: TAT den anh sang, tro ve Tu Dong");

    } else if (message == "PIR_LED:ON") {
      overridePir = true;
      digitalWrite(PIR_LED_PIN, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: BAT den PIR");

    } else if (message == "PIR_LED:OFF") {
      overridePir = false;
      digitalWrite(PIR_LED_PIN, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: TAT den PIR, tro ve Tu Dong");

    } else if (message == "LED_AUX:ON") {
      overrideAux = true;
      digitalWrite(LED_AUX, HIGH);
      client.publish(TOPIC_FEEDBACK, "HW-OK: BAT den phu");

    } else if (message == "LED_AUX:OFF") {
      overrideAux = false;
      digitalWrite(LED_AUX, LOW);
      client.publish(TOPIC_FEEDBACK, "HW-OK: TAT den phu, tro ve Tu Dong");

    // --- Hiệu ứng animation ---
    } else if (message == "ANIM:WAVE") {
      client.publish(TOPIC_FEEDBACK, "HW-OK: Bat dau hieu ung Song chay");
      animWave();
      client.publish(TOPIC_FEEDBACK, "HW-OK: Ket thuc hieu ung Song chay");

    } else if (message == "ANIM:PULSE") {
      client.publish(TOPIC_FEEDBACK, "HW-OK: Bat dau hieu ung Nhip dap");
      animPulse();
      client.publish(TOPIC_FEEDBACK, "HW-OK: Ket thuc hieu ung Nhip dap");
    }
  }
}

// Hàm duy trì kết nối MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT...");
    Serial.print(" host=");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_port);
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println(" Thanh cong!");
      client.subscribe(TOPIC_CONTROL);
      publishWithLog(TOPIC_FEEDBACK, "HW-OK: ESP32 online");
    } else {
      Serial.print(" That bai, rc=");
      Serial.print(client.state());
      Serial.println(" Thu lai sau 5s");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(LED_TEMP, OUTPUT);
  pinMode(LED_HUMID, OUTPUT);
  pinMode(LED_LIGHT, OUTPUT);
  pinMode(LED_AUX, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(PIR_LED_PIN, OUTPUT);
  digitalWrite(LED_AUX, LOW);
  digitalWrite(PIR_LED_PIN, LOW);

  dht.begin();
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  int pirBootRaw = digitalRead(PIR_PIN);
  pirRawLast = pirBootRaw;
  pirStableState = normalizePirState(pirBootRaw);
  lastMotionState = pirStableState;
  pirLastEdgeAt = millis();
  Serial.print("[PIR] boot raw=");
  Serial.print(pirBootRaw);
  Serial.print(" stable=");
  Serial.println(pirStableState);

  Serial.println("He thong san sang!");
}

void loop() {
  ensure_wifi();

  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 

  // 1. PIR — chỉ báo MQTT, KHÔNG tự bật/tắt LED (mọi đèn do người dùng qua MQTT)
  int pirRaw = digitalRead(PIR_PIN);
  if (pirRaw != pirRawLast) {
    pirRawLast = pirRaw;
    pirLastEdgeAt = millis();
  }
  if (millis() - pirLastEdgeAt >= PIR_DEBOUNCE_MS) {
    int motionState = normalizePirState(pirRawLast);
    if (motionState != pirStableState) {
      pirStableState = motionState;
    }
  }

  if (pirStableState != lastMotionState) {
    lastMotionState = pirStableState;
    // Motion theo event: chỉ publish khi có cạnh đổi trạng thái.
    publishWithLog(
      TOPIC_SENSOR,
      pirStableState == HIGH ? "Phat hien chuyen dong" : "Ket thuc chuyen dong"
    );
  }

  // 2. Đọc cảm biến định kì
  unsigned long now = millis();
  if (now - lastEnvRead >= ENV_INTERVAL) {
    lastEnvRead = now;
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int lightValue = adcToLux(analogRead(LIGHT_SENSOR_PIN));

    if (!isnan(t) && !isnan(h)) {
      /* Tự động LED theo ngưỡng — TẮT: chỉ bật/tắt đèn qua MQTT (TOPIC_CONTROL)
      if (!overrideTemp)  digitalWrite(LED_TEMP,  (t          > TEMP_THRESHOLD)        ? HIGH : LOW);
      if (!overrideHumid) digitalWrite(LED_HUMID, (h          > HUMID_THRESHOLD)       ? HIGH : LOW);
      if (!overrideLight) digitalWrite(LED_LIGHT, (lightValue <= LIGHT_THRESHOLD_DARK) ? HIGH : LOW);
      */

      // Payload định kỳ chỉ gồm env; motion publish riêng theo event cạnh đổi.
      String payload = "Nhiet do: " + String(t) + "C, Do am: " + String(h) + "%, Anh sang: " + String(lightValue);
      if (!publishWithLog(TOPIC_SENSOR, payload.c_str())) {
        publishWithLog(TOPIC_SENSOR_ERROR, "Publish sensor payload failed");
      }
    }
  }
  delay(5);
}