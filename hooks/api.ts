import { useState, useEffect, useCallback } from 'react'
import { positionsApi, sensorsApi, devicesApi, logsApi } from '@/lib/api/services'
import { get } from '@/lib/api/client'  // get 함수 import 추가
import { USE_MOCK_DATA, mockApi } from '@/lib/api/mock'
import { logApiResponse, logApiError } from '@/lib/api/debug'
import type { DisplayPosition, DisplaySensorData, DisplayDevice, DisplayEventLog } from '@/lib/api/types'

// 위치 정보 관리 훅 (실제로는 기기 목록을 위치로 사용)
export function usePositions() {
  const [positions, setPositions] = useState<DisplayPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 기기 API에서 데이터를 가져와서 위치로 변환
      const devices = USE_MOCK_DATA ? await mockApi.getPositions() : await devicesApi.getAll()
      
      console.log('🔍 Raw Devices API Response:', devices)
      
      // 기기 목록을 위치 목록으로 변환
      const positions = devices.map(device => ({
        id: device.id,
        name: device.name || `기기 ${device.id}`,
        created_at: device.created_at,
        updated_at: device.updated_at
      }))
      
      console.log('🔧 Transformed Positions:', positions)
      setPositions(positions)
      
      if (positions.length === 0) {
        setError('사용 가능한 기기가 없습니다')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다'
      logApiError('/devices', err)
      setError(errorMessage)
      setPositions([]) // 에러 시 빈 배열 설정
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  return { positions, loading, error, refetch: fetchPositions }
}

// 센서 데이터 관리 훅 (기기의 sensor_data에서 최신 데이터 추출)
export function useSensorData(deviceId: number | null) {
  const [sensorData, setSensorData] = useState<DisplaySensorData[]>([])
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
      
      // 기기 상세 정보에서 sensor_data 가져오기
      const deviceDetail = USE_MOCK_DATA 
        ? await mockApi.getSensorData(deviceId)
        : await get<any>(`/devices/${deviceId}`)
      
      console.log('🔍 Device Detail Response:', deviceDetail)
      
      // sensor_data에서 최신 데이터 추출
      let latestSensorData: DisplaySensorData[] = []
      
      if (deviceDetail && deviceDetail.sensor_data && deviceDetail.sensor_data.length > 0) {
        // 최신 데이터 선택 (마지막 아이템)
        const latestData = deviceDetail.sensor_data[deviceDetail.sensor_data.length - 1]
        
        // 데이터 변환
        latestSensorData = [
          {
            id: latestData.measure_id * 10 + 1,
            position_id: deviceId,
            sensor_type: 'temperature',
            value: latestData.temperature || 0,
            unit: '°C',
            status: 'normal',
            timestamp: latestData.measure_date
          },
          {
            id: latestData.measure_id * 10 + 2,
            position_id: deviceId,
            sensor_type: 'humidity',
            value: latestData.humidity || 0,
            unit: '%',
            status: 'normal',
            timestamp: latestData.measure_date
          },
          {
            id: latestData.measure_id * 10 + 3,
            position_id: deviceId,
            sensor_type: 'light',
            value: latestData.light_level || 0,
            unit: 'lux',
            status: 'normal',
            timestamp: latestData.measure_date
          },
          {
            id: latestData.measure_id * 10 + 4,
            position_id: deviceId,
            sensor_type: 'water_level',
            value: latestData.water_level || 0,
            unit: '%',
            status: 'normal',
            timestamp: latestData.measure_date
          },
          {
            id: latestData.measure_id * 10 + 5,
            position_id: deviceId,
            sensor_type: 'soil_moisture_1',
            value: latestData.soil_moisture_1 || 0,
            unit: '%',
            status: 'normal',
            timestamp: latestData.measure_date
          },
          {
            id: latestData.measure_id * 10 + 6,
            position_id: deviceId,
            sensor_type: 'soil_moisture_2',
            value: latestData.soil_moisture_2 || 0,
            unit: '%',
            status: 'normal',
            timestamp: latestData.measure_date
          }
        ]
      }
      
      console.log('🔧 Transformed Sensor Data:', latestSensorData)
      setSensorData(latestSensorData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '센서 데이터를 불러오는데 실패했습니다'
      logApiError(`/devices/${deviceId}`, err)
      setError(errorMessage)
      setSensorData([]) // 에러 시 빈 배열
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchSensorData()
    
    // 자동 갱신 비활성화 (수동으로만 새로고침)
    // const interval = setInterval(fetchSensorData, 5000)
    // return () => clearInterval(interval)
  }, [fetchSensorData])

  return { sensorData, loading, error, refetch: fetchSensorData }
}

// 기기 정보 및 제어 관리 훅 (해당 기기만 반환)
export function useDevices(deviceId: number | null) {
  const [devices, setDevices] = useState<DisplayDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    if (!deviceId) return

    try {
      setLoading(true)
      setError(null)
      
      // 해당 기기 상세 정보 가져오기
      const deviceDetail = USE_MOCK_DATA
        ? await mockApi.getDevices(deviceId)
        : await get<any>(`/devices/${deviceId}`)
      
      console.log('🔍 Device for Control:', deviceDetail)
      
      // 기기 정보를 DisplayDevice 형태로 변환
      const device: DisplayDevice = {
        id: deviceDetail.device_id,
        position_id: deviceId,
        name: deviceDetail.device_name,
        device_type: deviceDetail.device_type,
        status: deviceDetail.last_active ? 'online' : 'offline',
        is_active: Boolean(deviceDetail.last_active),
        created_at: new Date().toISOString(),
        updated_at: deviceDetail.last_active || new Date().toISOString()
      }
      
      setDevices([device]) // 단일 기기를 배열로 반환
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 정보를 불러오는데 실패했습니다'
      logApiError(`/devices/${deviceId}`, err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  const controlDevice = useCallback(async (
    deviceId: number, 
    controlType: string, 
    isEnabled: boolean
  ) => {
    try {
      if (USE_MOCK_DATA) {
        // 목 데이터에서는 로컬 상태만 업데이트
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, is_active: isEnabled, updated_at: new Date().toISOString() }
            : device
        ))
        logApiResponse(`/devices/${deviceId}/control`, { success: true, mock: true })
      } else {
        // 실제 API 호출 - component와 command 형태로 변환
        const component = mapControlTypeToComponent(controlType)
        const command = isEnabled ? 'ON' : 'OFF'
        
        await devicesApi.control(deviceId, component, command)
        await fetchDevices() // 상태 업데이트 후 재조회
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 제어에 실패했습니다'
      logApiError(`/devices/${deviceId}/control`, err)
      setError(errorMessage)
      throw err
    }
  }, [fetchDevices])

  // 제어 타입을 컴포넌트 이름으로 매핑
  const mapControlTypeToComponent = (controlType: string): string => {
    switch (controlType) {
      case 'led_light':
      case 'light':
        return 'LED'
      case 'water_pump':
      case 'pump':
        return 'PUMP'
      case 'ventilation_fan':
      case 'fan':
        return 'FAN'
      default:
        return controlType.toUpperCase()
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return { devices, loading, error, refetch: fetchDevices, controlDevice }
}

// 이벤트 로그 관리 훅 (기기의 action_logs에서 가져오기)
export function useEventLogs(deviceId: number | null) {
  const [logs, setLogs] = useState<DisplayEventLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return

    try {
      setLoading(true)
      setError(null)
      
      // 기기 상세 정보에서 action_logs 가져오기
      const deviceDetail = USE_MOCK_DATA
        ? await mockApi.getEventLogs(deviceId)
        : await get<any>(`/devices/${deviceId}`)
      
      console.log('🔍 Device Logs:', deviceDetail)
      
      // action_logs를 DisplayEventLog로 변환
      let transformedLogs: DisplayEventLog[] = []
      
      if (deviceDetail && deviceDetail.action_logs && deviceDetail.action_logs.length > 0) {
        transformedLogs = deviceDetail.action_logs
          .map((log: any) => ({
            id: log.log_id,
            position_id: deviceId,
            device_id: deviceId,
            event_type: log.action_trigger,  // 기존 action_trigger를 유형으로
            description: log.action_type,     // 기존 action_type을 내용으로
            timestamp: log.action_time
          }))
          .slice(-10)  // 최근 10건만 가져오기
      }
      
      console.log('🔧 Transformed Logs:', transformedLogs)
      setLogs(transformedLogs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그 데이터를 불러오는데 실패했습니다'
      logApiError(`/devices/${deviceId}`, err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchLogs()
    
    // 자동 갱신 비활성화 (수동으로만 새로고침)
    // const interval = setInterval(fetchLogs, 30000)
    // return () => clearInterval(interval)
  }, [fetchLogs])

  return { logs, loading, error, refetch: fetchLogs }
}

// API 연결 상태 확인 훅
export function useApiHealth() {
  const [isConnected, setIsConnected] = useState(USE_MOCK_DATA) // 목 데이터 사용 시 항상 연결된 것으로 처리
  const [checking, setChecking] = useState(!USE_MOCK_DATA)

  const checkHealth = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setIsConnected(true)
      setChecking(false)
      return
    }

    try {
      setChecking(true)
      await devicesApi.getAll() // 기기 API로 연결 확인
      setIsConnected(true)
      logApiResponse('/health', { status: 'connected' })
    } catch (err) {
      setIsConnected(false)
      logApiError('/health', err)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    
    // 1분마다 연결 상태 확인
    const interval = setInterval(checkHealth, 60000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return { isConnected, checking, checkHealth }
}
