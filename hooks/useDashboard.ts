import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from '@/lib/api/dashboard'

// 대시보드용 기기 데이터 훅
export function useDashboardDevices() {
  const [devices, setDevices] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 병렬로 기기 목록과 위치 목록 조회
      const [devicesData, positionsData] = await Promise.all([
        dashboardApi.getAllDevices(),
        dashboardApi.getAllPositions()
      ])

      console.log('🔍 Dashboard Devices:', devicesData)
      console.log('🔍 Dashboard Positions:', positionsData)

      setDevices(devicesData)
      setPositions(positionsData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다'
      console.error('❌ Dashboard data fetch error:', err)
      setError(errorMessage)
      setDevices([])
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { devices, positions, loading, error, refetch: fetchData }
}

// 특정 기기의 센서 데이터 훅
export function useDeviceSensorData(deviceId: number | null, autoRefresh = false) {
  const [sensorData, setSensorData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSensorData = useCallback(async () => {
    if (!deviceId) {
      setSensorData([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 최근 1시간 센서 데이터 조회
      const data = await dashboardApi.getDeviceSensorData(deviceId, 1)
      console.log(`📊 Device ${deviceId} Sensor Data:`, data)

      setSensorData(data)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '센서 데이터를 불러오는데 실패했습니다'
      console.error(`❌ Device ${deviceId} sensor data error:`, err)
      setError(errorMessage)
      setSensorData([])
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchSensorData()

    // 자동 갱신 설정 (1분마다)
    if (autoRefresh && deviceId) {
      const interval = setInterval(fetchSensorData, 60000)  // 60초 = 1분
      return () => clearInterval(interval)
    }
  }, [fetchSensorData, autoRefresh])

  return { sensorData, loading, error, refetch: fetchSensorData }
}

// 기기 제어 상태 훅
export function useDeviceControlStatus(deviceId: number | null) {
  const [controlStatus, setControlStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchControlStatus = useCallback(async () => {
    if (!deviceId) {
      setControlStatus(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const status = await dashboardApi.getDeviceControlStatus(deviceId)
      console.log(`⚙️ Device ${deviceId} Control Status:`, status)

      setControlStatus(status)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '제어 상태를 불러오는데 실패했습니다'
      console.error(`❌ Device ${deviceId} control status error:`, err)
      setError(errorMessage)
      setControlStatus(null)
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  // 기기 제어 함수
  const controlDevice = useCallback(async (component: string, command: string) => {
    if (!deviceId) return

    try {
      await dashboardApi.controlDevice(deviceId, component, command)
      console.log(`🎛️ Device ${deviceId} Control: ${component} ${command}`)
      
      // 제어 후 상태 다시 조회
      setTimeout(fetchControlStatus, 500)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 제어에 실패했습니다'
      console.error(`❌ Device ${deviceId} control error:`, err)
      setError(errorMessage)
      throw err
    }
  }, [deviceId, fetchControlStatus])

  useEffect(() => {
    fetchControlStatus()
  }, [fetchControlStatus])

  return { controlStatus, loading, error, refetch: fetchControlStatus, controlDevice }
}

// 기기 이벤트 로그 훅
export function useDeviceEventLogs(deviceId: number | null) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!deviceId) {
      setLogs([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 기기 상세 정보에서 action_logs 추출
      const deviceDetail = await dashboardApi.getDeviceDetail(deviceId)
      console.log(`📝 Device ${deviceId} Detail for Logs:`, deviceDetail)

      const actionLogs = deviceDetail.action_logs || []
      // 최근 10건만 표시하고 시간순 정렬
      const recentLogs = actionLogs
        .sort((a: any, b: any) => new Date(b.action_time).getTime() - new Date(a.action_time).getTime())
        .slice(0, 10)

      setLogs(recentLogs)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그 데이터를 불러오는데 실패했습니다'
      console.error(`❌ Device ${deviceId} logs error:`, err)
      setError(errorMessage)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, loading, error, refetch: fetchLogs }
}

// 전체 설정 초기화 훅
export function useSystemReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetAllDevices = useCallback(async (devices: any[]) => {
    try {
      setLoading(true)
      setError(null)

      const resetPromises = devices.map(async (device) => {
        try {
          // 사용자 프리셋이 적용된 경우
          if (device.user_preset?.preset_id) {
            await dashboardApi.applyUserPreset(device.device_id, device.user_preset.preset_id)
            console.log(`🔄 Device ${device.device_id}: Applied user preset ${device.user_preset.preset_id}`)
          }
          // 식물 프리셋이 적용된 경우
          else if (device.plant_preset?.plant_preset_id) {
            await dashboardApi.applyPlantPreset(device.device_id, device.plant_preset.plant_preset_id)
            console.log(`🔄 Device ${device.device_id}: Applied plant preset ${device.plant_preset.plant_preset_id}`)
          }
          // 프리셋이 없는 경우 모든 구성 요소 OFF
          else {
            await Promise.all([
              dashboardApi.controlDevice(device.device_id, 'LED', 'OFF'),
              dashboardApi.controlDevice(device.device_id, 'PUMP1', 'OFF'),
              dashboardApi.controlDevice(device.device_id, 'PUMP2', 'OFF'),
              dashboardApi.controlDevice(device.device_id, 'FAN', 'OFF')
            ])
            console.log(`🔄 Device ${device.device_id}: Reset to OFF state`)
          }
        } catch (deviceError) {
          console.error(`❌ Reset failed for device ${device.device_id}:`, deviceError)
        }
      })

      await Promise.all(resetPromises)
      console.log('✅ System reset completed')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시스템 초기화에 실패했습니다'
      console.error('❌ System reset error:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { resetAllDevices, loading, error }
}
