import { get, post, del } from './client'
import { UserPreset, Device } from './types'
import { getStoredToken, getStoredUserInfo } from './auth'

// 프론트엔드 프리셋 구조 (기존)
export interface FrontendPreset {
  id: string
  name: string
  source: 'api' | 'local'
  settings: {
    ledLight: {
      enabled: boolean
      timeControl: boolean
      lightControl: boolean
      startTime: string
      endTime: string
      lightThreshold: number
    }
    ventilationFan: {
      enabled: boolean
      startTemperature: number
      endTemperature: number
    }
    waterPump1: {
      enabled: boolean
      startHumidity: number
      endHumidity: number
      name: string
    }
    waterPump2: {
      enabled: boolean
      startHumidity: number
      endHumidity: number
      name: string
    }
  }
}

// API 프리셋 생성 요청
export interface CreatePresetRequest {
  preset_name: string
  target_temperature_min: number | string
  target_temperature_max: number | string
  target_humidity_min: number | string
  target_humidity_max: number | string
  target_soil_moisture_1_min: number
  target_soil_moisture_1_max: number
  target_soil_moisture_2_min: number
  target_soil_moisture_2_max: number
  darkness_threshold: number
  led_level?: number | null
  light_start_hour?: number | null
  light_end_hour?: number | null
  user_id: number
}

/**
 * 프론트엔드 프리셋을 API 형식으로 변환
 */
export function convertFrontendToAPI(frontendPreset: FrontendPreset, userId: number): CreatePresetRequest {
  const settings = frontendPreset.settings
  
  return {
    preset_name: frontendPreset.name,
    user_id: userId,
    
    // 환기팬 설정을 온도 범위로 변환
    target_temperature_min: settings.ventilationFan.enabled 
      ? settings.ventilationFan.endTemperature 
      : 20,
    target_temperature_max: settings.ventilationFan.enabled 
      ? settings.ventilationFan.startTemperature 
      : 30,
    
    // 기본 습도 범위 (환기팬 동작 온도 기반으로 추정)
    target_humidity_min: "40",
    target_humidity_max: "70",
    
    // 급수펌프 설정을 토양습도 범위로 변환
    target_soil_moisture_1_min: settings.waterPump1.enabled 
      ? settings.waterPump1.startHumidity 
      : 30,
    target_soil_moisture_1_max: settings.waterPump1.enabled 
      ? settings.waterPump1.endHumidity 
      : 70,
    
    target_soil_moisture_2_min: settings.waterPump2.enabled 
      ? settings.waterPump2.startHumidity 
      : 30,
    target_soil_moisture_2_max: settings.waterPump2.enabled 
      ? settings.waterPump2.endHumidity 
      : 70,
    
    // LED 설정을 조도 임계값으로 변환
    darkness_threshold: settings.ledLight.enabled && settings.ledLight.lightControl 
      ? settings.ledLight.lightThreshold 
      : 300,
    
    led_level: settings.ledLight.enabled ? 80 : null, // 기본 LED 레벨
    
    // 시간 설정을 시간(숫자)으로 변환
    light_start_hour: settings.ledLight.enabled && settings.ledLight.timeControl 
      ? parseInt(settings.ledLight.startTime.split(':')[0]) 
      : null,
    light_end_hour: settings.ledLight.enabled && settings.ledLight.timeControl 
      ? parseInt(settings.ledLight.endTime.split(':')[0]) 
      : null,
  }
}

/**
 * API 프리셋을 프론트엔드 형식으로 변환
 */
export function convertAPIToFrontend(apiPreset: UserPreset): FrontendPreset {
  return {
    id: `api-${apiPreset.preset_id}`,
    name: apiPreset.preset_name,
    source: 'api',
    settings: {
      ledLight: {
        enabled: apiPreset.led_level !== null,
        timeControl: apiPreset.light_start_hour !== null && apiPreset.light_end_hour !== null,
        lightControl: true, // 조도 기반 제어는 항상 활성화로 가정
        startTime: apiPreset.light_start_hour 
          ? `${apiPreset.light_start_hour.toString().padStart(2, '0')}:00` 
          : "06:00",
        endTime: apiPreset.light_end_hour 
          ? `${apiPreset.light_end_hour.toString().padStart(2, '0')}:00` 
          : "18:00",
        lightThreshold: apiPreset.darkness_threshold
      },
      ventilationFan: {
        enabled: typeof apiPreset.target_temperature_max === 'string' 
          ? parseInt(apiPreset.target_temperature_max) < 35 
          : apiPreset.target_temperature_max < 35,
        startTemperature: typeof apiPreset.target_temperature_max === 'string' 
          ? parseInt(apiPreset.target_temperature_max) 
          : apiPreset.target_temperature_max,
        endTemperature: typeof apiPreset.target_temperature_min === 'string' 
          ? parseInt(apiPreset.target_temperature_min) 
          : apiPreset.target_temperature_min
      },
      waterPump1: {
        enabled: apiPreset.target_soil_moisture_1_min > 0,
        startHumidity: apiPreset.target_soil_moisture_1_min,
        endHumidity: apiPreset.target_soil_moisture_1_max,
        name: "급수펌프 1"
      },
      waterPump2: {
        enabled: apiPreset.target_soil_moisture_2_min > 0,
        startHumidity: apiPreset.target_soil_moisture_2_min,
        endHumidity: apiPreset.target_soil_moisture_2_max,
        name: "급수펌프 2"
      }
    }
  }
}

/**
 * 사용자의 모든 프리셋 조회 (API만)
 */
export async function getUserPresets(userId: number): Promise<FrontendPreset[]> {
  try {
    console.log(`Fetching presets for user ${userId}`)
    const apiPresets = await get<UserPreset[]>(`/users/${userId}/user-presets/`)
    console.log('API presets:', apiPresets)
    
    const frontendPresets = apiPresets.map(convertAPIToFrontend)
    return frontendPresets
    
  } catch (error) {
    console.error('Failed to fetch user presets:', error)
    return []
  }
}

/**
 * 새 프리셋 생성
 */
export async function createPreset(frontendPreset: FrontendPreset): Promise<UserPreset> {
  const userInfo = getStoredUserInfo()
  if (!userInfo) {
    throw new Error('사용자 정보가 없습니다. 다시 로그인해주세요.')
  }
  
  // user_id 필드 사용 (API 응답에서 실제 ID)
  const actualUserId = userInfo.user_id || userInfo.id
  
  try {
    const apiPreset = convertFrontendToAPI(frontendPreset, actualUserId)
    console.log('Creating API preset:', apiPreset)
    
    const response = await post<UserPreset>('/user-presets/', apiPreset)
    console.log('Preset created successfully:', response)
    
    return response
    
  } catch (error) {
    console.error('Failed to create preset via API:', error)
    throw new Error('API 프리셋 생성에 실패했습니다.')
  }
}

/**
 * 프리셋 수정
 */
export async function updatePreset(presetId: string, frontendPreset: FrontendPreset): Promise<UserPreset> {
  if (presetId.startsWith('local-')) {
    // 로컬 프리셋 수정
    const localId = presetId.replace('local-', '')
    const presets = getLocalPresets()
    const index = presets.findIndex(p => p.id === localId)
    
    if (index >= 0) {
      presets[index] = { ...frontendPreset, id: localId }
      localStorage.setItem('local_presets', JSON.stringify(presets))
    }
    
    throw new Error('로컬 프리셋이 수정되었습니다')
  }
  
  const userInfo = getStoredUserInfo()
  if (!userInfo) {
    throw new Error('사용자 정보가 없습니다. 다시 로그인해주세요.')
  }
  
  // user_id 필드 사용
  const actualUserId = userInfo.user_id || userInfo.id
  
  try {
    const apiPresetId = parseInt(presetId.replace('api-', ''))
    const apiPreset = convertFrontendToAPI(frontendPreset, actualUserId)
    
    // API 스키마에 따르면 POST로 수정
    const response = await post<UserPreset>(`/user-presets/${apiPresetId}`, apiPreset)
    console.log('Preset updated successfully:', response)
    
    return response
    
  } catch (error) {
    console.error('Failed to update preset via API:', error)
    throw error
  }
}

/**
 * 프리셋 삭제
 */
export async function deletePreset(presetId: string): Promise<void> {
  if (presetId.startsWith('local-')) {
    // 로컬 프리셋 삭제
    const localId = presetId.replace('local-', '')
    const presets = getLocalPresets()
    const filtered = presets.filter(p => p.id !== localId)
    localStorage.setItem('local_presets', JSON.stringify(filtered))
    return
  }
  
  try {
    const apiPresetId = parseInt(presetId.replace('api-', ''))
    await del(`/user-presets/${apiPresetId}`)
    console.log('Preset deleted successfully')
    
  } catch (error) {
    console.error('Failed to delete preset via API:', error)
    throw error
  }
}

/**
 * 프리셋을 기기에 적용
 */
export async function applyPresetToDevice(presetId: string, deviceId: number): Promise<void> {
  if (presetId.startsWith('local-')) {
    throw new Error('로컬 프리셋은 기기에 적용할 수 없습니다. API 프리셋을 사용해주세요.')
  }
  
  try {
    const apiPresetId = parseInt(presetId.replace('api-', ''))
    
    // API 엔드포인트 사용
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'}/devices/${deviceId}/apply-user-preset/${apiPresetId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    })
    
    if (!response.ok) {
      throw new Error(`프리셋 적용 실패: ${response.status} ${response.statusText}`)
    }
    
    console.log('Preset applied to device successfully')
    
  } catch (error) {
    console.error('Failed to apply preset to device:', error)
    throw error
  }
}

// 로컬 스토리지 헬퍼 함수들
function getLocalPresets(): FrontendPreset[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('local_presets')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load local presets:', error)
    return []
  }
}

function saveLocalPreset(preset: FrontendPreset): void {
  if (typeof window === 'undefined') return
  
  try {
    const presets = getLocalPresets()
    const cleanId = preset.id.replace('local-', '')
    const existingIndex = presets.findIndex(p => p.id === cleanId)
    
    const localPreset = { ...preset, id: cleanId, source: 'local' as const }
    
    if (existingIndex >= 0) {
      presets[existingIndex] = localPreset
    } else {
      presets.push(localPreset)
    }
    
    localStorage.setItem('local_presets', JSON.stringify(presets))
    console.log('Preset saved locally:', preset.name)
    
  } catch (error) {
    console.error('Failed to save local preset:', error)
  }
}
