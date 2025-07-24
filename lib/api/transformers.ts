// API 응답을 프론트엔드 표시용 데이터로 변환하는 유틸리티

import type { 
  Position, 
  Device, 
  SensorData, 
  ActionLog,
  DisplayPosition, 
  DisplayDevice, 
  DisplaySensorData, 
  DisplayEventLog 
} from './types'

// Position 변환 함수
export function transformPosition(position: Position): DisplayPosition {
  return {
    id: position.position_id,
    name: position.position_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Device 변환 함수
export function transformDevice(device: Device): DisplayDevice {
  return {
    id: device.device_id,
    position_id: device.position?.position_id || 0,
    name: device.device_name,
    device_type: device.device_type,
    status: device.last_active ? 'online' : 'offline',
    is_active: Boolean(device.last_active),
    created_at: new Date().toISOString(),
    updated_at: device.last_active || new Date().toISOString()
  }
}

// SensorData를 DisplaySensorData로 변환
export function transformSensorData(sensorData: SensorData[], deviceId?: number): DisplaySensorData[] {
  const displayData: DisplaySensorData[] = []
  
  sensorData.forEach(data => {
    // 온도 센서
    if (data.temperature !== null && data.temperature !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 1,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'temperature',
        value: data.temperature,
        unit: '°C',
        status: getTemperatureStatus(data.temperature),
        timestamp: data.measure_date
      })
    }
    
    // 습도 센서
    if (data.humidity !== null && data.humidity !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 2,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'humidity',
        value: data.humidity,
        unit: '%',
        status: getHumidityStatus(data.humidity),
        timestamp: data.measure_date
      })
    }
    
    // 조도 센서
    if (data.light_level !== null && data.light_level !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 3,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'light',
        value: data.light_level,
        unit: 'lux',
        status: getLightStatus(data.light_level),
        timestamp: data.measure_date
      })
    }
    
    // 물탱크 센서
    if (data.water_level !== null && data.water_level !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 4,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'water_level',
        value: data.water_level,
        unit: '%',
        status: getWaterLevelStatus(data.water_level),
        timestamp: data.measure_date
      })
    }
    
    // 토양 수분 센서 1
    if (data.soil_moisture_1 !== null && data.soil_moisture_1 !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 5,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'soil_moisture_1',
        value: data.soil_moisture_1,
        unit: '%',
        status: getSoilMoistureStatus(data.soil_moisture_1),
        timestamp: data.measure_date
      })
    }
    
    // 토양 수분 센서 2
    if (data.soil_moisture_2 !== null && data.soil_moisture_2 !== undefined) {
      displayData.push({
        id: data.measure_id * 10 + 6,
        position_id: deviceId || data.device_id,  // position_id로 유지
        sensor_type: 'soil_moisture_2',
        value: data.soil_moisture_2,
        unit: '%',
        status: getSoilMoistureStatus(data.soil_moisture_2),
        timestamp: data.measure_date
      })
    }
  })
  
  return displayData
}

// ActionLog를 DisplayEventLog로 변환
export function transformEventLog(actionLog: ActionLog): DisplayEventLog {
  return {
    id: actionLog.log_id,
    position_id: actionLog.device_id, // device_id를 position_id로 사용
    device_id: actionLog.device_id,
    event_type: actionLog.action_type,
    description: `${actionLog.action_trigger}: ${actionLog.action_type}`,
    timestamp: actionLog.action_time
  }
}

// 상태 판정 함수들
function getTemperatureStatus(temp: number): 'normal' | 'high' | 'low' {
  if (temp < 18) return 'low'
  if (temp > 30) return 'high'
  return 'normal'
}

function getHumidityStatus(humidity: number): 'normal' | 'high' | 'low' {
  if (humidity < 40) return 'low'
  if (humidity > 80) return 'high'
  return 'normal'
}

function getLightStatus(light: number): 'normal' | 'high' | 'low' {
  if (light < 200) return 'low'
  if (light > 1000) return 'high'
  return 'normal'
}

function getWaterLevelStatus(level: number): 'normal' | 'high' | 'low' {
  if (level < 30) return 'low'
  if (level > 90) return 'high'
  return 'normal'
}

function getSoilMoistureStatus(moisture: number): 'normal' | 'high' | 'low' {
  if (moisture < 30) return 'low'
  if (moisture > 80) return 'high'
  return 'normal'
}

// 배열 변환 헬퍼 함수들
export function transformPositions(positions: Position[]): DisplayPosition[] {
  return positions.map(transformPosition)
}

export function transformDevices(devices: Device[]): DisplayDevice[] {
  return devices.map(transformDevice)
}

export function transformEventLogs(logs: ActionLog[]): DisplayEventLog[] {
  return logs.map(transformEventLog)
}
