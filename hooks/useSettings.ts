import { useState, useEffect, useCallback } from 'react'
import { getUserPresets, createPreset, updatePreset, deletePreset, applyPresetToDevice, FrontendPreset } from '@/lib/api/presets'
import { get, post } from '@/lib/api/client'
import { Device, DeviceCreate } from '@/lib/api/types'
import { getStoredUserInfo, getStoredToken } from '@/lib/api/auth'

/**
 * 프리셋 관리 훅 (완전 API 연동)
 */
export function usePresets() {
  const [presets, setPresets] = useState<FrontendPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 프리셋 목록 가져오기
  const fetchPresets = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('🔄 fetchPresets 시작')
      
      const userInfo = getStoredUserInfo()
      console.log('👤 사용자 정보:', userInfo)
      if (!userInfo) {
        throw new Error('사용자 정보가 없습니다. 다시 로그인해주세요.')
      }
      
      // API 응답에서 user_id 필드 사용 (id가 아님)
      const actualUserId = userInfo.user_id || userInfo.id
      console.log(`📋 프리셋 조회 시작 - User ID: ${actualUserId}`)
      const presetList = await getUserPresets(actualUserId)
      console.log('📋 프리셋 조회 결과:', presetList)
      setPresets(presetList)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프리셋을 불러오는데 실패했습니다'
      setError(errorMessage)
      console.error('❌ Failed to fetch presets:', err)
    } finally {
      setLoading(false)
      console.log('✅ fetchPresets 완료')
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  // 프리셋 추가
  const addPreset = useCallback(async (preset: Omit<FrontendPreset, 'id' | 'source'>) => {
    try {
      setError(null)
      const newPreset: FrontendPreset = {
        ...preset,
        id: `preset-${Date.now()}`, // 임시 ID
        source: 'api'
      }
      
      await createPreset(newPreset)
      await fetchPresets() // 목록 새로고침
      
      return newPreset
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프리셋 추가에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [fetchPresets])

  // 프리셋 수정
  const editPreset = useCallback(async (presetId: string, preset: Omit<FrontendPreset, 'id' | 'source'>) => {
    try {
      setError(null)
      const updatedPreset: FrontendPreset = {
        ...preset,
        id: presetId,
        source: presetId.startsWith('api-') ? 'api' : 'local'
      }
      
      await updatePreset(presetId, updatedPreset)
      await fetchPresets() // 목록 새로고침
      
      return updatedPreset
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프리셋 수정에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [fetchPresets])

  // 프리셋 삭제
  const removePreset = useCallback(async (presetId: string) => {
    try {
      setError(null)
      await deletePreset(presetId)
      await fetchPresets() // 목록 새로고침
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프리셋 삭제에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [fetchPresets])

  // 프리셋 적용
  const applyPreset = useCallback(async (presetId: string, deviceId: number) => {
    try {
      setError(null)
      await applyPresetToDevice(presetId, deviceId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프리셋 적용에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [])

  return {
    presets,
    loading,
    error,
    fetchPresets,
    addPreset,
    editPreset,
    removePreset,
    applyPreset
  }
}

/**
 * 기기 관리 훅 (읽기 + 추가 가능)
 */
export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 기기 목록 가져오기
  const fetchDevices = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const deviceList = await get<Device[]>('/devices/')
      
      // 로컬 기기도 추가
      const localDevices = getLocalDevices()
      const allDevices = [...deviceList, ...localDevices]
      
      setDevices(allDevices)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 목록을 불러오는데 실패했습니다'
      setError(errorMessage)
      console.error('Failed to fetch devices:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  // 기기 추가
  const addDevice = useCallback(async (device: { name: string, location: string, ip: string }) => {
    try {
      setError(null)
      
      const token = getStoredToken()
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
      }
      
      // API로 기기 추가 시도
      try {
        const deviceData: DeviceCreate = {
          device_name: device.name,
          location: device.location,
          device_serial: device.ip,
          position_id: 1, // 기본 위치 ID (실제로는 위치 선택 UI 필요)
          user_preset_id: null,
          plant_preset_id: null
        }
        
        const newDevice = await post<Device>('/devices/', deviceData)
        console.log('Device created via API:', newDevice)
        
        await fetchDevices() // 목록 새로고침
        return newDevice
        
      } catch (apiError) {
        console.error('API device creation failed, saving locally:', apiError)
        
        // API 실패 시 로컬에 저장
        const localDevice: Device = {
          device_id: Date.now(),
          device_name: device.name,
          location: device.location,
          device_type: 'local',
          device_serial: device.ip,
          last_active: null,
          position: null,
          user_preset: null,
          plant_preset: null,
          sensor_data: [],
          action_logs: [],
          plant_images: []
        }
        
        saveLocalDevice(localDevice)
        await fetchDevices() // 목록 새로고침
        
        throw new Error('API 기기 등록에 실패했습니다. 로컬에 저장되었습니다.')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 추가에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [fetchDevices])

  // 기기 삭제 (로컬만)
  const deleteDevice = useCallback(async (deviceId: number) => {
    try {
      setError(null)
      
      // API 기기인지 확인
      const device = devices.find(d => d.device_id === deviceId)
      if (device && device.device_type !== 'local') {
        throw new Error('API 기기는 삭제할 수 없습니다')
      }
      
      // 로컬 기기 삭제
      const localDevices = getLocalDevices()
      const filtered = localDevices.filter(d => d.device_id !== deviceId)
      localStorage.setItem('local_devices', JSON.stringify(filtered))
      
      await fetchDevices() // 목록 새로고침
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기기 삭제에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [devices, fetchDevices])

  return {
    devices,
    loading,
    error,
    fetchDevices,
    addDevice,
    deleteDevice
  }
}

// 로컬 기기 관리 헬퍼 함수들
function getLocalDevices(): Device[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('local_devices')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load local devices:', error)
    return []
  }
}

function saveLocalDevice(device: Device): void {
  if (typeof window === 'undefined') return
  
  try {
    const devices = getLocalDevices()
    const existingIndex = devices.findIndex(d => d.device_id === device.device_id)
    
    if (existingIndex >= 0) {
      devices[existingIndex] = device
    } else {
      devices.push(device)
    }
    
    localStorage.setItem('local_devices', JSON.stringify(devices))
    console.log('Device saved locally:', device.device_name)
    
  } catch (error) {
    console.error('Failed to save local device:', error)
  }
}
