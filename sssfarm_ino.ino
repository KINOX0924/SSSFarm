#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ======================================================
//               1. 사용자 설정 영역
// ======================================================
const char* ssid = "SeSAC";
const char* password = "12345678";
const char* serverUrl = "https://sssfarm-fast-api.onrender.com/sensordata/";
const char* deviceSerial = "ESP32-DEVICE-001";

// 시간 설정
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 32400; // KST (UTC+9)
const int daylightOffset_sec = 0;

// 제어 로직 설정값
const int DAY_START_HOUR = 7;
const int DAY_END_HOUR = 19;
const int SOIL_MOISTURE_THRESHOLD_DRY = 2800;
const float TEMP_THRESHOLD_HIGH = 28.0;
const float HUMID_THRESHOLD_HIGH = 70.0;
const int LIGHT_THRESHOLD_DARK = 500;
const int WATER_LEVEL_THRESHOLD_EMPTY = 10;

// 안전장치 및 배수 설정값
const long MAX_WATERING_DURATION_MS = 15000;  // 펌프 최대 작동 시간 (15초)
const long WATERING_COOLDOWN_MS = 3600000; // 급수 후 최소 대기 시간 (1시간)
const long DRAIN_WAIT_TIME_MS = 300000; // 급수 후 배수까지 대기 시간 (5분)
const long DRAIN_DURATION_MS = 10000;   // 배수 펌프 작동 시간 (10초)

// ======================================================
//               2. 핀 번호 및 객체 선언
// ======================================================
const int DHT_PIN = 4;
const int SOIL_SENSOR_PIN_1 = 35;
const int SOIL_SENSOR_PIN_2 = 32;
const int PUMP_PIN_1 = 23;
const int PUMP_PIN_2 = 19;
const int DRAIN_PUMP_PIN = 18;
const int GROW_LIGHT_PIN = 17;
const int FAN_PIN_1 = 5;
const int FAN_PIN_2 = 16;
const int LED_WATER_TANK_PIN = 14;

LiquidCrystal_I2C lcd(0x27, 20, 4);
BH1750 lightMeter;
DHT dht(DHT_PIN, DHT22);
#define WATER_LEVEL_HIGH_ADDR 0x78
#define WATER_LEVEL_LOW_ADDR  0x77
#define WATER_LEVEL_THRESHOLD 100

// ======================================================
//               3. 전역 변수 및 타이머
// ======================================================
float temperature = 0.0, humidity = 0.0, light_level = 0.0;
int water_level_percent = 0, soil_moisture_1 = 0, soil_moisture_2 = 0;

// 급수 안전장치용 변수
bool isWatering[2] = {false, false};
unsigned long wateringStartTime[2] = {0, 0};
unsigned long cooldownStartTime[2] = {0, 0};

// 배수 상태 관리용 변수
enum DrainState { IDLE, PUMPING_WATER, WAITING_TO_DRAIN, DRAINING };
DrainState drainState = IDLE;
unsigned long stateChangeTime = 0;

// 메인 타이머
unsigned long lastLocalCheckTime = 0, lastServerSendTime = 0;
const long localCheckInterval = 2000, serverSendInterval = 30000;


void setup() {
  Serial.begin(115200);
  Wire.begin();
  setupPinsAndSensors();
  setupWifi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void loop() {
  unsigned long currentTime = millis();
  if (currentTime - lastLocalCheckTime >= localCheckInterval) {
    lastLocalCheckTime = currentTime;
    readAllSensors();
    runControlLogic();
    updateLcdDisplay();
    printStatusToSerial();
  }
  
  manageDrainage(); // 배수 로직은 매 순간 확인

  if (currentTime - lastServerSendTime >= serverSendInterval) {
    lastServerSendTime = currentTime;
    sendDataToServer();
  }
}

// ======================================================
//               4. 헬퍼 함수 (Helper Functions)
// ======================================================

void setupPinsAndSensors() {
  pinMode(PUMP_PIN_1, OUTPUT);
  pinMode(PUMP_PIN_2, OUTPUT);
  pinMode(DRAIN_PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN_1, OUTPUT);
  pinMode(FAN_PIN_2, OUTPUT);
  pinMode(GROW_LIGHT_PIN, OUTPUT);
  pinMode(LED_WATER_TANK_PIN, OUTPUT);
  dht.begin();
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SmartFarm Booting...");
  delay(1000);
}

void setupWifi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void readAllSensors() {
  float temp_read = dht.readTemperature();
  float humid_read = dht.readHumidity();
  if (!isnan(temp_read)) temperature = temp_read;
  if (!isnan(humid_read)) humidity = humid_read;
  light_level = lightMeter.readLightLevel();
  water_level_percent = readWaterLevel_I2C();
  soil_moisture_1 = analogRead(SOIL_SENSOR_PIN_1);
  soil_moisture_2 = analogRead(SOIL_SENSOR_PIN_2);
}

void runControlLogic() {
  bool isWaterTankEmpty = (water_level_percent < WATER_LEVEL_THRESHOLD_EMPTY);
  digitalWrite(LED_WATER_TANK_PIN, isWaterTankEmpty);

  // --- 급수 펌프 1 제어 (안전장치 포함) ---
  if (isWatering[0]) {
    if (millis() - wateringStartTime[0] >= MAX_WATERING_DURATION_MS) {
      digitalWrite(PUMP_PIN_1, LOW); isWatering[0] = false; cooldownStartTime[0] = millis();
      Serial.println("Pump 1: Max time. Cooldown on.");
    }
  } else if (millis() - cooldownStartTime[0] >= WATERING_COOLDOWN_MS) {
    if (soil_moisture_1 > SOIL_MOISTURE_THRESHOLD_DRY && !isWaterTankEmpty) {
      digitalWrite(PUMP_PIN_1, HIGH); isWatering[0] = true; wateringStartTime[0] = millis();
      if (drainState == IDLE) drainState = PUMPING_WATER; // 배수 로직 트리거
      Serial.println("Pump 1: Watering started.");
    }
  }

  // --- 급수 펌프 2 제어 (안전장치 포함) ---
  if (isWatering[1]) {
    if (millis() - wateringStartTime[1] >= MAX_WATERING_DURATION_MS) {
      digitalWrite(PUMP_PIN_2, LOW); isWatering[1] = false; cooldownStartTime[1] = millis();
      Serial.println("Pump 2: Max time. Cooldown on.");
    }
  } else if (millis() - cooldownStartTime[1] >= WATERING_COOLDOWN_MS) {
    if (soil_moisture_2 > SOIL_MOISTURE_THRESHOLD_DRY && !isWaterTankEmpty) {
      digitalWrite(PUMP_PIN_2, HIGH); isWatering[1] = true; wateringStartTime[1] = millis();
      if (drainState == IDLE) drainState = PUMPING_WATER; // 배수 로직 트리거
      Serial.println("Pump 2: Watering started.");
    }
  }
  
  // --- 팬 제어 ---
  digitalWrite(FAN_PIN_1, (temperature > TEMP_THRESHOLD_HIGH));
  digitalWrite(FAN_PIN_2, (humidity > HUMID_THRESHOLD_HIGH));

  // --- 생장등 제어 ---
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    int currentHour = timeinfo.tm_hour;
    bool isDayTime = (currentHour >= DAY_START_HOUR && currentHour < DAY_END_HOUR);
    digitalWrite(GROW_LIGHT_PIN, (isDayTime && light_level < LIGHT_THRESHOLD_DARK));
  }
}

void manageDrainage() {
  switch (drainState) {
    case PUMPING_WATER:
      if (!isWatering[0] && !isWatering[1]) {
        drainState = WAITING_TO_DRAIN; stateChangeTime = millis();
        Serial.println("Drain State: Waiting...");
      }
      break;
    case WAITING_TO_DRAIN:
      if (millis() - stateChangeTime >= DRAIN_WAIT_TIME_MS) {
        digitalWrite(DRAIN_PUMP_PIN, HIGH); drainState = DRAINING; stateChangeTime = millis();
        Serial.println("Drain State: Draining...");
      }
      break;
    case DRAINING:
      if (millis() - stateChangeTime >= DRAIN_DURATION_MS) {
        digitalWrite(DRAIN_PUMP_PIN, LOW); drainState = IDLE;
        Serial.println("Drain State: Idle.");
      }
      break;
    case IDLE:
    default:
      break;
  }
}

void updateLcdDisplay() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.printf("T:%.1fC H:%.0f%%", temperature, humidity);
  lcd.setCursor(0, 1); lcd.printf("Soil:%d, %d", soil_moisture_1, soil_moisture_2);
  lcd.setCursor(0, 2); lcd.printf("Light: %.0f lux", light_level);
  lcd.setCursor(0, 3);
  if (water_level_percent < WATER_LEVEL_THRESHOLD_EMPTY) lcd.print("! WATER TANK EMPTY !");
  else lcd.printf("Water Level: %d%%", water_level_percent);
}

void printStatusToSerial() {
  Serial.printf("T:%.1f, H:%.1f, L:%.1f, W:%d, S1:%d, S2:%d\n",
    temperature, humidity, light_level, water_level_percent, soil_moisture_1, soil_moisture_2);
}

int readWaterLevel_I2C() {
  uint32_t touch_val = 0; uint8_t trig_section = 0;
  Wire.requestFrom(WATER_LEVEL_LOW_ADDR, 8);
  for (int i = 0; i < 8; i++) { if (Wire.available()) { if (Wire.read() > WATER_LEVEL_THRESHOLD) touch_val |= (1 << i); } }
  Wire.requestFrom(WATER_LEVEL_HIGH_ADDR, 12);
  for (int i = 0; i < 12; i++) { if (Wire.available()) { if (Wire.read() > WATER_LEVEL_THRESHOLD) touch_val |= (1UL << (8 + i)); } }
  while (touch_val & 0x01) { trig_section++; touch_val >>= 1; }
  return trig_section * 5;
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) return;
  JsonDocument doc;
  doc["temperature"] = temperature; doc["humidity"] = humidity;
  doc["soil_moisture_1"] = soil_moisture_1; doc["soil_moisture_2"] = soil_moisture_2;
  doc["light_level"] = light_level; doc["water_level"] = water_level_percent;
  doc["device_serial"] = deviceSerial;
  String jsonString;
  serializeJson(doc, jsonString);
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(jsonString);
  if (httpResponseCode > 0) { Serial.printf("Server Response: %d\n", httpResponseCode); } 
  else { Serial.printf("Server Error: %s\n", http.errorToString(httpResponseCode).c_str()); }
  http.end();
}