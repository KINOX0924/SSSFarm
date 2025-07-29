// API 클라이언트 설정 - CORS 문제 해결
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sssfarm-fast-api.onrender.com'
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY === 'true' || false // localhost 접속시 CORS 해결되면 직접 호출

// 토큰 가져오기 함수
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// API 요청을 위한 기본 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 프록시 사용 시 로컬 API 경로로 변경
  const url = USE_PROXY 
    ? `/api/backend${endpoint}` 
    : `${API_BASE_URL}${endpoint}`
  
  // Authorization 헤더 추가
  const token = getAuthToken()
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}
  
  const defaultOptions: RequestInit = {
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
      'Accept-Charset': 'utf-8',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`)
    console.log(`🔑 Token: ${token ? 'Present' : 'Missing'}`)
    
    const response = await fetch(url, defaultOptions)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`❌ API Error ${response.status}:`, errorText)
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    // UTF-8 인코딩으로 텍스트 읽기
    const responseText = await response.text()
    
    // JSON 파싱 시 한글 처리
    let data: T
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.log('📄 Response Text:', responseText)
      throw new Error('응답 데이터 파싱에 실패했습니다')
    }
    
    console.log(`✅ API Success: ${options.method || 'GET'} ${url}`)
    return data
  } catch (error) {
    console.error('🚨 API Request failed:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      fullError: error
    })
    
    // CORS나 네트워크 에러인 경우 더 구체적인 메시지
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`네트워크 연결 실패: API 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.`)
    }
    
    throw error
  }
}

// GET 요청
export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

// POST 요청
export async function post<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 요청
export async function put<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 요청
export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

export { API_BASE_URL, USE_PROXY }
