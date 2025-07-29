import { get } from './client'
import { ActionLog, Device } from './types'

// 로그 조회 인터페이스
export interface LogsFilter {
  device_id?: number
  start_date?: string
  end_date?: string
  action_type?: string
}

// 프론트엔드 로그 형식
export interface FrontendLog {
  id: number
  deviceId: string
  deviceName: string
  date: string
  time: string
  trigger: string
  action: string
}

/**
 * 모든 액션 로그 조회 - 기기별로 조회
 */
export async function getAllActionLogs(filter?: LogsFilter): Promise<ActionLog[]> {
  try {
    console.log('🔄 Fetching action logs from devices')
    
    // 모든 기기 조회
    const devices = await get<Device[]>('/devices/')
    
    // 각 기기의 액션 로그 조회
    const allLogs: ActionLog[] = []
    
    for (const device of devices) {
      // 필터 조건에 맞는 기기만 조회
      if (filter?.device_id && device.device_id !== filter.device_id) {
        continue
      }
      
      // 기기의 액션 로그가 있으면 추가
      if (device.action_logs && device.action_logs.length > 0) {
        allLogs.push(...device.action_logs)
      }
    }
    
    console.log('📋 Action logs fetched:', allLogs.length)
    return allLogs
    
  } catch (error) {
    console.error('❌ Failed to fetch action logs:', error)
    // API 실패 시 빈 배열 반환
    return []
  }
}

/**
 * 특정 기기의 액션 로그 조회
 */
export async function getDeviceActionLogs(deviceId: number, filter?: Omit<LogsFilter, 'device_id'>): Promise<ActionLog[]> {
  return getAllActionLogs({ ...filter, device_id: deviceId })
}

/**
 * API 로그를 프론트엔드 형식으로 변환
 */
export function convertAPILogToFrontend(apiLog: ActionLog, devices: Device[]): FrontendLog {
  const device = devices.find(d => d.device_id === apiLog.device_id)
  const deviceName = device?.device_name || `기기 ${apiLog.device_id}`
  
  const actionTime = new Date(apiLog.action_time)
  
  return {
    id: apiLog.log_id,
    deviceId: apiLog.device_id.toString(),
    deviceName,
    date: actionTime.toISOString().split('T')[0], // YYYY-MM-DD
    time: actionTime.toTimeString().slice(0, 5), // HH:MM
    trigger: apiLog.action_trigger,
    action: apiLog.action_type,
  }
}

/**
 * 통합 로그 조회 (API + 로컬 데이터)
 */
export async function getFormattedLogs(filter?: LogsFilter): Promise<FrontendLog[]> {
  try {
    // API에서 로그와 기기 정보 동시 조회
    const [logs, devices] = await Promise.all([
      getAllActionLogs(filter),
      get<Device[]>('/devices/')
    ])
    
    // API 로그를 프론트엔드 형식으로 변환
    const apiLogs = logs.map(log => convertAPILogToFrontend(log, devices))
    
    // 로컬 백업 로그도 추가 가능
    const localLogs = getLocalLogs()
    
    // 시간순 정렬 (최신순)
    const allLogs = [...apiLogs, ...localLogs].sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`)
      const dateTimeB = new Date(`${b.date} ${b.time}`)
      return dateTimeB.getTime() - dateTimeA.getTime()
    })
    
    return allLogs
    
  } catch (error) {
    console.error('❌ Failed to get formatted logs:', error)
    
    // API 실패 시 로컬 로그만 반환
    return getLocalLogs()
  }
}

/**
 * 로컬 백업 로그 (API 실패 시 사용)
 */
function getLocalLogs(): FrontendLog[] {
  // 기존 하드코딩된 로그를 백업으로 사용
  return [
    {
      id: 1,
      deviceId: "1",
      deviceName: "온실 A동",
      date: "2024-01-09",
      time: "14:30",
      trigger: "토양습도 센서 임계값 도달 알림 (42% 이하)",
      action: "토마토 화분 급수 시작 (습도 42% → 70%)",
    },
    {
      id: 2,
      deviceId: "1",
      deviceName: "온실 A동",
      date: "2024-01-09",
      time: "13:15",
      trigger: "자동 스케줄러 시간 기반 제어 실행",
      action: "LED 조명 자동 점등",
    },
    {
      id: 3,
      deviceId: "1",
      deviceName: "온실 A동",
      date: "2024-01-09",
      time: "12:00",
      trigger: "조도 센서 측정값 기준치 초과 감지",
      action: "조도 850lux 감지, 환기팬 작동",
    },
  ]
}

/**
 * 로그 검색
 */
export function searchLogs(logs: FrontendLog[], searchTerm: string): FrontendLog[] {
  if (!searchTerm.trim()) {
    return logs
  }
  
  const term = searchTerm.toLowerCase()
  return logs.filter(log => 
    log.deviceName.toLowerCase().includes(term) ||
    log.trigger.toLowerCase().includes(term) ||
    log.action.toLowerCase().includes(term)
  )
}

/**
 * 로그 필터링 - 종료날짜 포함 개선 (시간 처리 수정)
 */
export function filterLogs(
  logs: FrontendLog[], 
  deviceId?: string, 
  startDate?: string, 
  endDate?: string
): FrontendLog[] {
  return logs.filter(log => {
    // 기기 필터
    if (deviceId && deviceId !== "all" && log.deviceId !== deviceId) {
      return false
    }
    
    // 날짜 필터 - 시작날짜 이후 (포함)
    if (startDate && log.date < startDate) {
      return false
    }
    
    // 날짜 필터 - 종료날짜 당일까지 포함 (하루 전체)
    // 문제: log.date가 "2024-01-25"이고 endDate가 "2024-01-25"일 때
    // 25일 00:00~23:59의 모든 로그를 포함해야 함
    if (endDate) {
      // 종료날짜의 다음날을 계산
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1) // 다음날 00:00
      const nextDay = endDateTime.toISOString().split('T')[0]
      
      // 로그 날짜가 다음날 이상이면 제외
      if (log.date >= nextDay) {
        return false
      }
    }
    
    return true
  })
}
