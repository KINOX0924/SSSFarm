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
    return await get<any>(`/devices/${deviceId}/control_status`)
  },

  // 기기 수동 제어
  controlDevice: async (deviceId: number, component: string, command: string) => {
    return await put<any>(`/devices/${deviceId}/manual-control`, {
      component,
      command
    })
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
