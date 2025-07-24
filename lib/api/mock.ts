// 개발 및 테스트용 목 데이터

import type { DisplayPosition, DisplaySensorData, DisplayDevice, DisplayEventLog } from './types'

// 목 위치 데이터
export const mockPositions: DisplayPosition[] = [
  {
    id: 1,
    name: "온실 A동",
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z"
  },
  {
    id: 2,
    name: "온실 B동", 
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z"
  },
  {
    id: 3,
    name: "온실 C동",
    created_at: "2024-01-15T09:00:00Z", 
    updated_at: "2024-01-15T09:00:00Z"
  }
]

// 목 센서 데이터
export const mockSensorData: DisplaySensorData[] = [
  {
    id: 1,
    position_id: 1,
    sensor_type: "light",
    value: 850,
    unit: "lux",
    status: "normal",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    position_id: 1,
    sensor_type: "humidity",
    value: 65,
    unit: "%",
    status: "normal",
    timestamp: new Date().toISOString()
  },
  {
    id: 3,
    position_id: 1,
    sensor_type: "water_level",
    value: 78,
    unit: "%",
    status: "normal",
    timestamp: new Date().toISOString()
  },
  {
    id: 4,
    position_id: 1,
    sensor_type: "soil_moisture_1",
    value: 42,
    unit: "%",
    status: "low",
    timestamp: new Date().toISOString()
  },
  {
    id: 5,
    position_id: 1,
    sensor_type: "soil_moisture_2",
    value: 58,
    unit: "%",
    status: "normal",
    timestamp: new Date().toISOString()
  }
]

// 목 기기 데이터
export const mockDevices: DisplayDevice[] = [
  {
    id: 1,
    position_id: 1,
    name: "LED 조명 시스템",
    device_type: "led_light",
    status: "online",
    is_active: true,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    position_id: 1,
    name: "급수펌프 1호",
    device_type: "water_pump",
    status: "online",
    is_active: false,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    position_id: 1,
    name: "급수펌프 2호",
    device_type: "water_pump",
    status: "online",
    is_active: true,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    position_id: 1,
    name: "환기팬 시스템",
    device_type: "ventilation_fan",
    status: "online",
    is_active: true,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: new Date().toISOString()
  }
]

// 목 이벤트 로그
export const mockEventLogs: DisplayEventLog[] = [
  {
    id: 1,
    position_id: 1,
    device_id: 2,
    event_type: "자동 급수",
    description: "토양습도 센서가 42%를 감지하여 급수펌프 1호가 자동으로 작동했습니다.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30분 전
  },
  {
    id: 2,
    position_id: 1,
    device_id: 1,
    event_type: "조명 제어",
    description: "조도 센서가 850lux를 감지하여 LED 조명이 자동으로 점등되었습니다.",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45분 전
  },
  {
    id: 3,
    position_id: 1,
    device_id: 4,
    event_type: "환기 제어",
    description: "온도가 28°C에 도달하여 환기팬이 자동으로 가동되었습니다.",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1시간 전
  }
]

// 목 데이터 사용 여부 설정
export const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// 목 데이터를 반환하는 헬퍼 함수들
export const mockApi = {
  getPositions: () => Promise.resolve(mockPositions),
  getSensorData: (positionId: number) => 
    Promise.resolve(mockSensorData.filter(sensor => sensor.position_id === positionId)),
  getDevices: (positionId: number) => 
    Promise.resolve(mockDevices.filter(device => device.position_id === positionId)),
  getEventLogs: (positionId: number) => 
    Promise.resolve(mockEventLogs.filter(log => log.position_id === positionId)),
}
