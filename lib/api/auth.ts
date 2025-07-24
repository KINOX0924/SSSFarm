import { post } from './client'

// 로그인 관련 타입 정의
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface User {
  id: number
  user_id?: number // API 응답의 실제 사용자 ID
  username: string
  email?: string
  is_active: boolean
}

/**
 * 사용자 로그인
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    console.log('🔐 Attempting login for user:', credentials.username)
    
    // OAuth2 형식의 폼 데이터로 전송
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    // FormData를 사용하므로 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'}/token`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`❌ Login failed ${response.status}:`, errorText)
      
      if (response.status === 401) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
      } else if (response.status === 422) {
        throw new Error('입력한 정보가 올바르지 않습니다.')
      } else {
        throw new Error(`로그인 실패: ${response.status} ${response.statusText}`)
      }
    }
    
    const data = await response.json()
    console.log('✅ Login successful')
    return data
  } catch (error) {
    console.error('🚨 Login error:', error)
    throw error
  }
}

/**
 * 현재 사용자 정보 가져오기 (사용자 목록에서 username으로 찾기)
 */
export async function getCurrentUser(token: string, username: string): Promise<User | null> {
  try {
    console.log('👤 사용자 정보 조회:', username)
    
    // 사용자 목록 조회
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'}/users/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }
    
    const users = await response.json()
    console.log('전체 사용자 목록:', users)
    
    // username으로 사용자 찾기
    const user = users.find((u: any) => u.username === username)
    if (!user) {
      throw new Error(`사용자를 찾을 수 없습니다: ${username}`)
    }
    
    // user_id를 id로 매핑
    const mappedUser: User = {
      id: user.user_id,
      user_id: user.user_id,
      username: user.username,
      is_active: true
    }
    
    console.log('✅ 사용자 정보 조회 완료:', mappedUser)
    return mappedUser
    
  } catch (error) {
    console.error('🚨 사용자 정보 조회 실패:', error)
    return null
  }
}

/**
 * 로그아웃 (토큰 무효화)
 */
export async function logout(token: string): Promise<void> {
  try {
    console.log('🚪 Logging out user')
    
    // 로컬 스토리지에서 토큰 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
      sessionStorage.removeItem('isLoggedIn')
    }
    
    // 서버에 로그아웃 요청 (옵션)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      })
    } catch (logoutError) {
      // 서버 로그아웃 실패는 무시 (토큰은 이미 로컬에서 제거됨)
      console.warn('서버 로그아웃 실패 (무시됨):', logoutError)
    }
    
    console.log('✅ Logout successful')
  } catch (error) {
    console.error('🚨 Logout error:', error)
    throw error
  }
}

/**
 * 토큰 저장
 */
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token)
    sessionStorage.setItem('isLoggedIn', 'true')
  }
}

/**
 * 저장된 토큰 가져오기
 */
export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

/**
 * 사용자 정보 저장
 */
export function saveUserInfo(user: User | null): void {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user))
    } else {
      localStorage.removeItem('user_info')
    }
  }
}

/**
 * 저장된 사용자 정보 가져오기
 */
export function getStoredUserInfo(): User | null {
  if (typeof window !== 'undefined') {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      try {
        return JSON.parse(userInfo)
      } catch (error) {
        console.error('Failed to parse stored user info:', error)
        localStorage.removeItem('user_info')
      }
    }
    
    // 사용자 정보가 없지만 토큰이 있으면 기본 사용자 생성
    const token = getStoredToken()
    if (token) {
      console.log('⚠️ No stored user info, creating default user for admin')
      const defaultUser: User = {
        id: 1, // 기본 사용자 ID
        username: 'admin',
        is_active: true
      }
      saveUserInfo(defaultUser)
      return defaultUser
    }
  }
  return null
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const token = getStoredToken()
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    return !!(token && isLoggedIn)
  }
  return false
}
