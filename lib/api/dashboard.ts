import { get, put } from './client'

// 대시보드용 API 서비스
export const dashboardApi = {
  // 모든 기기 조회
  getAllDevices: async () => {
    return await get<any[]>('/devices/')
  },

  // 특정 기기 상세 조회 (센서 데이터, 로그 포함)
  getDeviceDetail: async (deviceId: number) => {
    return await get<any>(`/devices/${deviceId}`)
  },

  // 기기 과거 센서 데이터 조회
  getDeviceSensorData: async (deviceId: number, hoursAgo: number = 1) => {
    return await get<any[]>(`/devices/${deviceId}/historical-data?hours_ago=${hoursAgo}`)
  },

  // 기기 제어 상태 조회
  getDeviceControlStatus: async (deviceId: number) => {
    console.log(`🔍 기기 제어 상태 조회: Device ${deviceId}`)
    try {
      const response = await get<any>(`/devices/${deviceId}/control_status`)
      console.log(`✅ 제어 상태 조회 성공:`, response)
      return response
    } catch (error) {
      console.error(`❌ 제어 상태 조회 실패: Device ${deviceId}`, error)
      throw error
    }
  },

  // 기기 제어 상태 설정 (테스트용)
  setDeviceControlStatus: async (deviceId: number, controlData: any) => {
    console.log(`🎛️ 기기 제어 상태 설정 시도: Device ${deviceId}`, controlData)
    try {
      const response = await put<any>(`/devices/${deviceId}/control_status`, controlData)
      console.log(`✅ 제어 상태 설정 성공:`, response)
      return response
    } catch (error) {
      console.error(`❌ 제어 상태 설정 실패: Device ${deviceId}`, error)
      throw error
    }
  },

  // 기기 수동 제어
  controlDevice: async (deviceId: number, component: string, command: string) => {
    console.log(`🎛️ 기기 제어 시도: Device ${deviceId}, Component: ${component}, Command: ${command}`)
    try {
      const response = await put<any>(`/devices/${deviceId}/manual-control`, {
        component,
        command
      })
      console.log(`✅ 기기 제어 성공:`, response)
      return response
    } catch (error) {
      console.error(`❌ 기기 제어 실패: Device ${deviceId}, Component: ${component}, Command: ${command}`, error)
      throw error
    }
  },

  // 사용자 프리셋 적용
  applyUserPreset: async (deviceId: number, presetId: number) => {
    return await put<any>(`/devices/${deviceId}/apply-user-preset/${presetId}`)
  },

  // 식물 프리셋 적용
  applyPlantPreset: async (deviceId: number, presetId: number) => {
    return await put<any>(`/devices/${deviceId}/apply-plant-preset/${presetId}`)
  },

  // 모든 위치 조회
  getAllPositions: async () => {
    return await get<any[]>('/positions/')
  }
}
