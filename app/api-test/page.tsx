"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sssfarm-fast-api.onrender.com'

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const testEndpoints = [
    { name: 'Health Check', endpoint: '/health', method: 'GET' },
    { name: 'Users API', endpoint: '/users/', method: 'GET' },
    { name: 'Current User Info', endpoint: '/users/1', method: 'GET' },
    { name: 'Positions API', endpoint: '/positions/', method: 'GET' },
    { name: 'Devices API', endpoint: '/devices/', method: 'GET' },
    { name: 'User Presets (ID 1)', endpoint: '/users/1/user-presets/', method: 'GET' },
    { name: 'All User Presets', endpoint: '/user-presets/', method: 'GET' },
    { name: 'Plant Presets API', endpoint: '/plant-presets/', method: 'GET' },
    { name: 'Device 2 Historical Data (1h)', endpoint: '/devices/2/historical-data?hours_ago=1', method: 'GET' },
    { name: 'API Docs', endpoint: '/docs', method: 'GET' },
    { name: 'OpenAPI Spec', endpoint: '/openapi.json', method: 'GET' },
  ]

  const runSingleTest = async (endpoint: string, method: string) => {
    try {
      console.log(`Testing ${method} ${API_BASE_URL}${endpoint}`)
      
      // 인증 토큰 가져오기
      const token = localStorage.getItem('access_token')
      const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        mode: 'cors',
        headers,
      })

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json().catch(() => 'Response received') : null,
        error: null,
        hasToken: !!token,
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasToken: !!localStorage.getItem('access_token'),
      }
    }
  }

  const testProxyEndpoint = async () => {
    try {
      const response = await fetch('/api/proxy?path=/positions/', {
        method: 'GET',
      })

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : null,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        statusText: 'Proxy Error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const runAllTests = async () => {
    setIsTesting(true)
    setTestResults([])

    const results = []

    // Direct API tests
    for (const test of testEndpoints) {
      const result = await runSingleTest(test.endpoint, test.method)
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        type: 'Direct',
        ...result,
      })
    }

    // Proxy test
    const proxyResult = await testProxyEndpoint()
    results.push({
      name: 'Proxy API Test',
      endpoint: '/api/proxy?path=/positions/',
      method: 'GET',
      type: 'Proxy',
      ...proxyResult,
    })

    setTestResults(results)
    setIsTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API 연결 테스트</h1>
          <p className="text-gray-600">
            FastAPI 서버와의 연결 상태를 확인합니다: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE_URL}</code>
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={runAllTests} 
            disabled={isTesting}
            className="gap-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                테스트 중...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                API 연결 테스트 실행
              </>
            )}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {result.name}
                    <span className="text-sm font-normal text-gray-500">
                      ({result.type})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                  <div className="flex gap-4 text-sm">
                  <span><strong>Method:</strong> {result.method}</span>
                  <span><strong>Endpoint:</strong> {result.endpoint}</span>
                  <span><strong>Status:</strong> {result.status} {result.statusText}</span>
                    <span><strong>Token:</strong> {result.hasToken ? '✓' : '✗'}</span>
                      </div>
                    
                    {result.error && (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {result.data && (
                      <div className="mt-2">
                        <strong>Response:</strong>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-orange-500" />
                연결 문제 해결 방법
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>1. 목 데이터 사용:</strong>
                <p className="text-sm text-gray-600">
                  <code>.env.local</code> 파일에서 <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code>로 설정
                </p>
              </div>
              <div>
                <strong>2. CORS 문제:</strong>
                <p className="text-sm text-gray-600">
                  FastAPI 서버에서 CORS 설정을 확인하거나 프록시 API 사용
                </p>
              </div>
              <div>
                <strong>3. 서버 상태 확인:</strong>
                <p className="text-sm text-gray-600">
                  <a 
                    href={`${API_BASE_URL}/docs`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {API_BASE_URL}/docs
                  </a> 직접 접속 시도
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
