import { get, post, put, del } from './client'
import type { 
  Position, 
  Device, 
  SensorData, 
  ActionLog,
  DeviceControlStatus,
  ManualControlRequest,
  DisplayPosition,
  DisplayDevice,
  DisplaySensorData,
  DisplayEventLog
} from './types'
import { 
  transformPositions, 
  transformDevices, 
  transformSensorData, 
  transformEventLogs 
} from './transformers'

// Positions API
export const positionsApi = {
  // 모든 위치 정보 조회
  getAll: async (): Promise<DisplayPosition[]> => {
    const data = await get<Position[]>('/positions/')  // ← 엔드포인트는 원래대로!
    return transformPositions(data)
  },
  
  // 특정 위치 정보 조회 (구현 필요 시)
  getById: (id: number) => get<Position>(`/positions/${id}`),  // ← 원래대로!
  
  // 새 위치 생성 (구현 필요 시)
  create: (data: { position_name: string }) => 
    post<Position>('/positions/', data),  // ← 원래대로!
}

// Devices API  
export const devicesApi = {
  // 모든 기기 조회
  getAll: async (): Promise<DisplayDevice[]> => {
    const data = await get<Device[]>('/devices/')
    return transformDevices(data)
  },
  
  // 특정 위치의 기기 목록 조회 (실제 API에서는 지원하지 않으므로 전체 조회 후 필터링)
  getByPosition: async (positionId: number): Promise<DisplayDevice[]> => {
    const allDevices = await devicesApi.getAll()
    return allDevices.filter(device => device.position_id === positionId)
  },
  
  // 기기 상태 조회
  getStatus: (deviceId: number) => get<Device>(`/devices/${deviceId}`),
  
  // 기기 제어
  control: (deviceId: number, component: string, command: string) => 
    put<Device>(`/devices/${deviceId}/manual-control`, {
      component,
      command
    } as ManualControlRequest),
  
  // 기기 제어 상태 조회
  getControlStatus: (deviceId: number) => 
    get<DeviceControlStatus>(`/devices/${deviceId}/control_status`)
}

// Sensors API (센서 데이터는 기기와 연결되어 있음)
export const sensorsApi = {
  // 특정 위치의 최신 센서 데이터 조회 (위치의 모든 기기에서 데이터 수집)
  getLatest: async (positionId: number): Promise<DisplaySensorData[]> => {
    try {
      // 해당 위치의 기기들 조회
      const devices = await devicesApi.getByPosition(positionId)
      
      if (devices.length === 0) {
        return []
      }
      
      // 각 기기의 최신 데이터 수집
      const allSensorData: DisplaySensorData[] = []
      
      for (const device of devices) {
        try {
          // 기기의 센서 데이터 조회 (최근 24시간으로 증가)
          const historicalData = await get<SensorData[]>(`/devices/${device.id}/historical-data?hours_ago=24`)
          
          console.log(`📊 Device ${device.id} 센서 데이터:`, historicalData)
          
          // 최신 데이터만 선택
          if (historicalData.length > 0) {
            const latestData = historicalData[historicalData.length - 1]
            const transformedData = transformSensorData([latestData], positionId)
            allSensorData.push(...transformedData)
          } else {
            console.warn(`⚠️  Device ${device.id}에 센서 데이터가 없습니다`)
          }
        } catch (deviceError) {
          console.warn(`Device ${device.id} 센서 데이터 조회 실패:`, deviceError)
        }
      }
      
      return allSensorData
    } catch (error) {
      console.error('센서 데이터 조회 오류:', error)
      return []
    }
  },
  
  // 특정 기기의 센서 데이터 조회
  getByDevice: async (deviceId: number): Promise<DisplaySensorData[]> => {
    const data = await get<SensorData[]>(`/devices/${deviceId}/historical-data?hours_ago=24`)
    return transformSensorData(data, deviceId)
  }
}

// Logs API (액션 로그는 기기와 연결되어 있음)
export const logsApi = {
  // 특정 위치의 이벤트 로그 조회
  getByPosition: async (positionId: number, limit = 50): Promise<DisplayEventLog[]> => {
    try {
      // 해당 위치의 기기들 조회
      const devices = await devicesApi.getByPosition(positionId)
      
      if (devices.length === 0) {
        return []
      }
      
      // 각 기기의 액션 로그 수집
      const allLogs: DisplayEventLog[] = []
      
      for (const device of devices) {
        try {
          // 기기 상세 정보를 다시 조회하여 action_logs 포함
          const deviceDetail = await get<Device>(`/devices/${device.id}`)
          
          if (deviceDetail.action_logs && deviceDetail.action_logs.length > 0) {
            const transformedLogs = transformEventLogs(deviceDetail.action_logs)
            allLogs.push(...transformedLogs)
          }
        } catch (deviceError) {
          console.warn(`Device ${device.id} 로그 조회 실패:`, deviceError)
        }
      }
      
      // 시간순 정렬 및 제한
      return allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('로그 데이터 조회 오류:', error)
      return []
    }
  }
}

// Health Check
export const healthApi = {
  check: () => get<{ status: string }>('/health')
}
