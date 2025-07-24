#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ======================================================
//        1. 사용자 설정 영역
// ======================================================
const char* ssid = "SeSAC";
const char* password = "12345678";
const char* serverDataUrl = "https://sssfarm-fast-api.onrender.com/sensordata/";
const char* serverCommandUrl = "https://sssfarm-fast-api.onrender.com/devices/2/control_status";
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
const long DRAIN_DURATION_MS = 10000;    // 배수 펌프 작동 시간 (10초)

// ======================================================
//        2. 핀 번호 및 객체 선언
// ======================================================
const int DHT_PIN = 4;
const int SOIL_SENSOR_PIN_1 = 35;
const int SOIL_SENSOR_PIN_2 = 32;
const int PUMP_PIN_1 = 23;
const int PUMP_PIN_2 = 18;
const int DRAIN_PUMP_PIN = 19;
const int GROW_LIGHT_PIN = 17;
const int FAN_PIN_1 = 5;
const int FAN_PIN_2 = 16;

LiquidCrystal_I2C lcd(0x27, 20, 4);
BH1750 lightMeter;
DHT dht(DHT_PIN, DHT22);
#define WATER_LEVEL_HIGH_ADDR 0x78
#define WATER_LEVEL_LOW_ADDR  0x77
#define WATER_LEVEL_THRESHOLD 100

// ======================================================
//        3. 전역 변수 및 타이머
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

// 원격 제어 관련 변수
enum ControlMode { AUTO, MANUAL };
ControlMode currentMode = AUTO;
unsigned long lastManualCommandTime = 0;
const long manualModeTimeout = 300000; // 5분 동안 명령 없으면 자동모드로 전환

// 메인 타이머
unsigned long lastLocalCheckTime = 0, lastServerSendTime = 0, lastCommandCheckTime = 0;
const long localCheckInterval = 2000, serverSendInterval = 30000, commandCheckInterval = 5000;

// 프로토타입 선언
void fetchAndProcessCommands();
void applyManualCommands(const JsonDocument& doc);
void checkAndReconnectWiFi();

void setup() {
  Serial.begin(115200);
  Wire.begin();
  setupPinsAndSensors();
  setupWifi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  lcd.setCursor(0, 1);
  lcd.print("Mode: AUTO");
}

void loop() {
  checkAndReconnectWiFi();

  unsigned long currentTime = millis();

  // 수동 모드 타임아웃 처리
  if (currentMode == MANUAL && (currentTime - lastManualCommandTime >= manualModeTimeout)) {
    currentMode = AUTO;
    Serial.println("Manual mode timed out. Reverting to AUTO mode.");
    lcd.setCursor(0, 1);
    lcd.print("Mode: AUTO  ");
  }

  // 로컬 센서 체크 및 자동 제어 로직
  if (currentTime - lastLocalCheckTime >= localCheckInterval) {
    lastLocalCheckTime = currentTime;
    readAllSensors();
    if (currentMode == AUTO) {
      runControlLogic();
    }
    updateLcdDisplay();
    printStatusToSerial();
  }
  
  // 배수 로직
  if (currentMode == AUTO) {
    manageDrainage();
  }

  // 서버로 데이터 전송
  if (currentTime - lastServerSendTime >= serverSendInterval) {
    lastServerSendTime = currentTime;
    sendDataToServer();
  }

  // 서버로부터 명령 수신
  if (currentTime - lastCommandCheckTime >= commandCheckInterval) {
    lastCommandCheckTime = currentTime;
    fetchAndProcessCommands();
  }
}

// ======================================================
//        4. 헬퍼 함수 (Helper Functions)
// ======================================================

void checkAndReconnectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("Reconnecting WiFi...");
    
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconnected!");
      lcd.clear();
    } else {
      Serial.println("\nWiFi reconnect failed. Will try again later.");
      lcd.clear();
      lcd.setCursor(0, 1);
      lcd.print("WiFi Connect Fail");
      delay(2000);
    }
  }
}

void fetchAndProcessCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.setTimeout(10000);
  http.begin(serverCommandUrl);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
    } else {
      currentMode = MANUAL;
      lastManualCommandTime = millis();
      Serial.println("Switched to MANUAL mode.");
      applyManualCommands(doc);
    }
  } else {
    if (httpCode > 0 && httpCode != 204) {
      Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
    } else if (httpCode < 0) {
      Serial.printf("[HTTP] GET... connection failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
  }
  http.end();
}

// 수동 명령 적용 함수
void applyManualCommands(const JsonDocument& doc) {
  if (doc.containsKey("target_led_state")) {
    String state = doc["target_led_state"];
    if (state == "ON") digitalWrite(GROW_LIGHT_PIN, HIGH);
    else if (state == "OFF") digitalWrite(GROW_LIGHT_PIN, LOW);
  }
  if (doc.containsKey("target_pump_state_1")) {
    String state = doc["target_pump_state_1"];
    if (state == "ON") analogWrite(PUMP_PIN_1, 128); // <<< 50% 세기로 변경
    else if (state == "OFF") analogWrite(PUMP_PIN_1, 0); // <<< 끄기로 변경
  }
  if (doc.containsKey("target_pump_state_2")) {
    String state = doc["target_pump_state_2"];
    if (state == "ON") analogWrite(PUMP_PIN_2, 128); // <<< 50% 세기로 변경
    else if (state == "OFF") analogWrite(PUMP_PIN_2, 0); // <<< 끄기로 변경
  }
  if (doc.containsKey("target_fan_state")) {
    String state = doc["target_fan_state"];
    if (state == "ON") {
      digitalWrite(FAN_PIN_1, HIGH);
      digitalWrite(FAN_PIN_2, HIGH);
    } else if (state == "OFF") {
      digitalWrite(FAN_PIN_1, LOW);
      digitalWrite(FAN_PIN_2, LOW);
    }
  }
}

// 서버로 데이터 전송 함수
void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  JsonDocument doc;
  doc["temperature"] = (int)(temperature + 0.5);
  doc["humidity"] = (int)(humidity + 0.5);
  doc["soil_moisture_1"] = soil_moisture_1;
  doc["soil_moisture_2"] = soil_moisture_2;
  doc["light_level"] = (int)(light_level + 0.5);
  doc["water_level"] = water_level_percent;
  doc["device_serial"] = deviceSerial;
  String jsonString;
  serializeJson(doc, jsonString);

  HTTPClient http;
  http.setTimeout(10000);
  http.begin(serverDataUrl);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(jsonString);
  http.end();
}

void setupPinsAndSensors() {
  pinMode(PUMP_PIN_1, OUTPUT);
  pinMode(PUMP_PIN_2, OUTPUT);
  pinMode(DRAIN_PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN_1, OUTPUT);
  pinMode(FAN_PIN_2, OUTPUT);
  pinMode(GROW_LIGHT_PIN, OUTPUT);
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
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Connecting WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  lcd.setCursor(0,1);
  lcd.print("WiFi Connected!");
  delay(1000);
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

  // --- 급수 펌프 1 제어 (안전장치 포함) ---
  if (isWatering[0]) {
    if (millis() - wateringStartTime[0] >= MAX_WATERING_DURATION_MS) {
      analogWrite(PUMP_PIN_1, 0); // <<< 끄기로 변경
      isWatering[0] = false; 
      cooldownStartTime[0] = millis();
      Serial.println("Pump 1: Max time. Cooldown on.");
    }
  } else if (millis() - cooldownStartTime[0] >= WATERING_COOLDOWN_MS) {
    if (soil_moisture_1 > SOIL_MOISTURE_THRESHOLD_DRY && !isWaterTankEmpty) {
      analogWrite(PUMP_PIN_1, 128); // <<< 50% 세기로 변경
      isWatering[0] = true; 
      wateringStartTime[0] = millis();
      if (drainState == IDLE) drainState = PUMPING_WATER;
      Serial.println("Pump 1: Watering started.");
    } else {
      analogWrite(PUMP_PIN_1, 0); // <<< 끄기로 변경
    }
  }

  // --- 급수 펌프 2 제어 (안전장치 포함) ---
  if (isWatering[1]) {
    if (millis() - wateringStartTime[1] >= MAX_WATERING_DURATION_MS) {
      analogWrite(PUMP_PIN_2, 0); // <<< 끄기로 변경
      isWatering[1] = false; 
      cooldownStartTime[1] = millis();
      Serial.println("Pump 2: Max time. Cooldown on.");
    }
  } else if (millis() - cooldownStartTime[1] >= WATERING_COOLDOWN_MS) {
    if (soil_moisture_2 > SOIL_MOISTURE_THRESHOLD_DRY && !isWaterTankEmpty) {
      analogWrite(PUMP_PIN_2, 128); // <<< 50% 세기로 변경
      isWatering[1] = true; 
      wateringStartTime[1] = millis();
      if (drainState == IDLE) drainState = PUMPING_WATER;
      Serial.println("Pump 2: Watering started.");
    } else {
      analogWrite(PUMP_PIN_2, 0); // <<< 끄기로 변경
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
  lcd.setCursor(0, 0); 
  lcd.printf("T:%.1f H:%.0f", temperature, humidity);
  
  lcd.setCursor(10, 0);
  if (currentMode == MANUAL) {
    lcd.print("Mode:MANUAL");
  } else {
    lcd.print("Mode:AUTO  ");
  }

  lcd.setCursor(0, 1); lcd.printf("Soil:%d, %d", soil_moisture_1, soil_moisture_2);
  lcd.setCursor(0, 2); lcd.printf("Light: %.0f lux", light_level);
  lcd.setCursor(0, 3);
  
  if (water_level_percent < WATER_LEVEL_THRESHOLD_EMPTY) {
    lcd.print("! WATER TANK EMPTY !");
  } else {
    lcd.printf("Water Level: %d%%", water_level_percent);
  }
}

void printStatusToSerial() {
  Serial.printf("Mode:%s, T:%.1f, H:%.1f, L:%.1f, W:%d, S1:%d, S2:%d\n",
    (currentMode == AUTO ? "AUTO" : "MANUAL"),
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