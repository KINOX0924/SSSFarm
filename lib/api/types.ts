// API 응답 데이터 타입 정의 (실제 FastAPI 스키마에 맞춤)

// 위치 정보 (Positions) - 실제 API 응답 구조
export interface Position {
  position_id: number
  position_name: string
}

// 기기 정보 (Devices) - 실제 API 응답 구조  
export interface Device {
  device_id: number
  device_name: string
  location?: string | null
  device_type: string
  device_serial: string
  last_active?: string | null
  position?: Position | null
  user_preset?: UserPreset | null
  plant_preset?: PlantPreset | null
  sensor_data?: SensorData[]
  action_logs?: ActionLog[]
  plant_images?: PlantImage[]
}

// 센서 데이터 - 실제 API 응답 구조
export interface SensorData {
  measure_id: number
  device_id: number
  temperature?: number | null
  humidity?: number | null
  soil_moisture_1?: number | null
  soil_moisture_2?: number | null
  light_level?: number | null
  water_level?: number | null
  measure_date: string
}

// 액션 로그 - 실제 API 응답 구조
export interface ActionLog {
  log_id: number
  device_id: number
  action_type: string
  action_trigger: string
  action_time: string
  device?: Device | null
}

// 식물 이미지 - 실제 API 응답 구조
export interface PlantImage {
  image_id: number
  device_id: number
  image_path: string
  captured_at: string
}

// 사용자 프리셋
export interface UserPreset {
  preset_id: number
  user_id: number
  preset_name: string
  target_temperature_min: string
  target_temperature_max: string
  target_humidity_min: string
  target_humidity_max: string
  target_soil_moisture_1_min: number
  target_soil_moisture_1_max: number
  target_soil_moisture_2_min: number
  target_soil_moisture_2_max: number
  darkness_threshold: number
  led_level?: number | null
  light_start_hour?: number | null
  light_end_hour?: number | null
}

// 식물 프리셋
export interface PlantPreset {
  plant_preset_id: number
  plant_name: string
  description?: string | null
  recomm_temperature_min: string
  recomm_temperature_max: string
  recomm_humidity_min: string
  recomm_humidity_max: string
  recomm_soil_moisture_1_min: number
  recomm_soil_moisture_1_max: number
  recomm_soil_moisture_2_min: number
  recomm_soil_moisture_2_max: number
  darkness_threshold: number
  led_level?: number | null
  light_start_hour?: number | null
  light_end_hour?: number | null
}

// 기기 제어 상태
export interface DeviceControlStatus {
  target_led_state: string
  target_pump_state_1: string
  target_pump_state_2: string
  target_fan_state: string
  alert_led_state: string
}

// 수동 제어 요청
export interface ManualControlRequest {
  component: string
  command: string
}

// API 응답 래퍼
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// 목록 응답
export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// 프론트엔드에서 사용하기 쉽도록 변환된 타입들
export interface DisplayPosition {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export interface DisplayDevice {
  id: number
  position_id: number
  name: string
  device_type: string
  status: 'online' | 'offline'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface DisplaySensorData {
  id: number
  position_id: number
  sensor_type: string
  value: number
  unit: string
  status: 'normal' | 'high' | 'low' | 'offline'
  timestamp: string
}

export interface DisplayEventLog {
  id: number
  position_id: number
  device_id?: number
  event_type: string
  description: string
  timestamp: string
}
