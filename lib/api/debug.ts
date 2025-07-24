// API 연결 테스트 및 디버깅 유틸리티

import { API_BASE_URL } from './client'

// API 연결 상태 확인
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log(`Testing API connection to: ${API_BASE_URL}`)
    
    // 간단한 GET 요청으로 연결 테스트
    const response = await fetch(`${API_BASE_URL}/positions/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      console.log('✅ API 연결 성공')
      return true
    } else {
      console.error(`❌ API 연결 실패: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    console.error('❌ API 연결 중 오류 발생:', error)
    return false
  }
}

// API 응답 디버깅
export function logApiResponse(endpoint: string, data: any) {
  console.group(`🔍 API Response: ${endpoint}`)
  console.log('Data:', data)
  console.groupEnd()
}

// API 에러 디버깅
export function logApiError(endpoint: string, error: any) {
  console.group(`❌ API Error: ${endpoint}`)
  console.error('Error:', error)
  console.groupEnd()
}

// FastAPI 문서 URL
export function getApiDocsUrl(): string {
  return `${API_BASE_URL}/docs`
}

// API 상태 체크 함수 (개발 환경용)
export async function checkApiEndpoints() {
  const endpoints = [
    '/positions/',
    '/health', // health check 엔드포인트가 있다면
  ]

  console.log('🔍 API 엔드포인트 상태 확인...')
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      console.log(`${endpoint}: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.error(`${endpoint}: 연결 실패 -`, error)
    }
  }
}

// 개발 모드에서만 실행되는 API 디버깅 (비활성화)
// if (process.env.NODE_ENV === 'development') {
//   // 개발 환경에서 자동으로 API 연결 테스트
//   testApiConnection().then(success => {
//     if (success) {
//       console.log(`🌱 SSSFarm API 준비 완료: ${API_BASE_URL}`)
//       console.log(`📖 API 문서: ${getApiDocsUrl()}`)
//     } else {
//       console.warn(`⚠️  API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`)
//     }
//   })
// }
