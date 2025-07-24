#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <LiquidCrystal_I2C.h>

// --- 최종 핀 할당 ---
const int DHT_PIN = 4;
const int SOIL_SENSOR_PIN_1 = 35;
const int SOIL_SENSOR_PIN_2 = 32;
const int PUMP_PIN_1 = 23;
const int PUMP_PIN_2 = 18;
const int DRAIN_PUMP_PIN = 19;
const int GROW_LIGHT_PIN = 17;
const int FAN_PIN_1 = 5;
const int FAN_PIN_2 = 16;

// --- I2C 주소 및 객체 ---
LiquidCrystal_I2C lcd(0x27, 20, 4);
BH1750 lightMeter;
DHT dht(DHT_PIN, DHT22);
#define WATER_LEVEL_HIGH_ADDR 0x78
#define WATER_LEVEL_LOW_ADDR  0x77
#define WATER_LEVEL_THRESHOLD 100


void setup() {
  Serial.begin(115200);
  Wire.begin();

  // 모든 액추에이터 핀을 출력으로 설정
  pinMode(PUMP_PIN_1, OUTPUT);
  pinMode(PUMP_PIN_2, OUTPUT);
  pinMode(DRAIN_PUMP_PIN, OUTPUT);
  pinMode(GROW_LIGHT_PIN, OUTPUT);
  pinMode(FAN_PIN_1, OUTPUT);
  pinMode(FAN_PIN_2, OUTPUT);

  // 센서 초기화
  dht.begin();
  lightMeter.begin();
  lcd.init();
  lcd.backlight();

  // 테스트 메뉴 출력
  printMenu();
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    switch (command) {
      case '1': testPWMActuator("Pump 1", PUMP_PIN_1); break;
      case '2': testPWMActuator("Pump 2", PUMP_PIN_2); break;
      case '3': testPWMActuator("Drain Pump", DRAIN_PUMP_PIN); break;
      case '4': testPWMActuator("Fan 1", FAN_PIN_1); break;
      case '5': testPWMActuator("Fan 2", FAN_PIN_2); break;
      case '6': testActuator("Grow Light", GROW_LIGHT_PIN); break;
      case 'd': testDHT(); break;
      case 's': testSoilSensors(); break;
      case 'l': testLightSensor(); break;
      case 'w': testWaterLevelSensor(); break;
      case 'c': testLCD(); break;
      default:
        if (command != '\n' && command != '\r') {
          printMenu();
        }
        break;
    }
  }
}

void printMenu() {
  Serial.println("\n===== Hardware Test Menu =====");
  Serial.println("--- Actuators ---");
  Serial.println("1: Test Pump 1 (PWM Speed)");
  Serial.println("2: Test Pump 2 (PWM Speed)");
  Serial.println("3: Test Drain Pump (PWM Speed)");
  Serial.println("4: Test Fan 1 (PWM Speed)");
  Serial.println("5: Test Fan 2 (PWM Speed)");
  Serial.println("6: Test Grow Light (ON/OFF)");
  Serial.println("\n--- Sensors ---");
  Serial.println("d: Test DHT22 (Temp/Humid)");
  Serial.println("s: Test Soil Moisture Sensors");
  Serial.println("l: Test BH1750 (Light)");
  Serial.println("w: Test Water Level Sensor");
  Serial.println("c: Test LCD Display");
  Serial.print("Enter command: ");
}

// ON/OFF 테스트용 함수 (Grow Light 등)
void testActuator(String name, int pin) {
  Serial.print("\nTesting " + name + "... ON for 5 seconds.");
  digitalWrite(pin, HIGH);
  delay(5000);
  digitalWrite(pin, LOW);
  Serial.println(" -> OFF.");
  printMenu();
}

// PWM 속도 조절 테스트용 함수 (펌프, 팬 등)
void testPWMActuator(String name, int pin) {
  Serial.println("\nTesting " + name + " Speed...");
  
  Serial.print(" -> 50% Speed for 3 seconds...");
  analogWrite(pin, 128); // 0-255의 절반 값
  delay(3000);
  
  Serial.print(" -> 100% Speed for 3 seconds...");
  analogWrite(pin, 255); // 최대값
  delay(3000);
  
  analogWrite(pin, 0); // 정지
  Serial.println(" -> OFF.");
  printMenu();
}


void testDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("\nFailed to read from DHT sensor!");
  } else {
    Serial.print("\nDHT22 -> Humidity: ");
    Serial.print(h);
    Serial.print(" %, Temperature: ");
    Serial.print(t);
    Serial.println(" *C");
  }
  printMenu();
}

void testSoilSensors() {
  int soil1 = analogRead(SOIL_SENSOR_PIN_1);
  int soil2 = analogRead(SOIL_SENSOR_PIN_2);
  Serial.print("\nSoil Sensors -> Sensor 1: ");
  Serial.print(soil1);
  Serial.print(", Sensor 2: ");
  Serial.println(soil2);
  printMenu();
}

void testLightSensor() {
  float lux = lightMeter.readLightLevel();
  Serial.print("\nBH1750 -> Light: ");
  Serial.print(lux);
  Serial.println(" lx");
  printMenu();
}

void testWaterLevelSensor() {
  uint32_t touch_val = 0;
  uint8_t trig_section = 0;
  Wire.requestFrom(WATER_LEVEL_LOW_ADDR, 8);
  for(int i = 0; i < 8; i++) { if(Wire.available()) { if(Wire.read() > WATER_LEVEL_THRESHOLD) touch_val |= (1 << i); } }
  Wire.requestFrom(WATER_LEVEL_HIGH_ADDR, 12);
  for(int i = 0; i < 12; i++) { if(Wire.available()) { if(Wire.read() > WATER_LEVEL_THRESHOLD) touch_val |= (1UL << (i + 8)); } }
  while(touch_val & 0x01) { trig_section++; touch_val >>= 1; }
  int water_level = trig_section * 5;
  Serial.print("\nWater Level Sensor -> Level: ");
  Serial.print(water_level);
  Serial.println(" %");
  printMenu();
}

void testLCD() {
  Serial.println("\nTesting LCD... Check the display.");
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Line 1: OK");
  lcd.setCursor(0, 1); lcd.print("Line 2: OK");
  lcd.setCursor(0, 2); lcd.print("Line 3: OK");
  lcd.setCursor(0, 3); lcd.print("Line 4: OK");
  delay(3000);
  lcd.clear();
  printMenu();
}