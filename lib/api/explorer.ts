import { get } from './client'

/**
 * API 엔드포인트 탐색 및 문서 확인
 */
export class ApiExplorer {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'

  /**
   * OpenAPI 스키마 가져오기
   */
  async getOpenAPISchema() {
    try {
      const response = await fetch(`${this.baseUrl}/openapi.json`)
      if (response.ok) {
        return await response.json()
      }
      throw new Error(`Failed to fetch OpenAPI schema: ${response.status}`)
    } catch (error) {
      console.error('Failed to get OpenAPI schema:', error)
      throw error
    }
  }

  /**
   * 사용 가능한 엔드포인트 목록 추출
   */
  async getAvailableEndpoints() {
    try {
      const schema = await this.getOpenAPISchema()
      const paths = schema.paths || {}
      
      const endpoints = Object.keys(paths).map(path => {
        const methods = Object.keys(paths[path])
        return {
          path,
          methods,
          details: paths[path]
        }
      })
      
      return {
        info: schema.info,
        endpoints,
        servers: schema.servers
      }
    } catch (error) {
      console.error('Failed to get endpoints:', error)
      throw error
    }
  }

  /**
   * 특정 엔드포인트 테스트
   */
  async testEndpoint(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') {
    try {
      const url = `${this.baseUrl}${path}`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      })
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: response.ok ? await response.json().catch(() => null) : await response.text()
      }
    } catch (error) {
      console.error(`Failed to test endpoint ${path}:`, error)
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 주요 엔드포인트들 일괄 테스트
   */
  async scanCommonEndpoints() {
    const commonPaths = [
      '/devices/',
      '/devices/1',
      '/devices/1/images',
      '/devices/1/control_status',
      '/devices/1/historical-data',
      '/positions/',
      '/presets/',
      '/users/',
      '/auth/login',
      '/token',
      '/login',
      '/health',
      '/status'
    ]
    
    const results: Array<{path: string, result: any}> = []
    
    for (const path of commonPaths) {
      console.log(`Testing endpoint: ${path}`)
      const result = await this.testEndpoint(path)
      results.push({ path, result })
      
      // 요청 간 간격 (Rate limiting 방지)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return results
  }

  /**
   * 새로 추가된 엔드포인트 찾기
   */
  async findNewEndpoints() {
    try {
      const currentEndpoints = await this.getAvailableEndpoints()
      
      // 이전에 알려진 엔드포인트들
      const knownEndpoints = [
        '/devices/',
        '/devices/{device_id}',
        '/devices/{device_id}/images',
        '/devices/{device_id}/control_status',
        '/devices/{device_id}/historical-data',
        '/devices/{device_id}/manual-control',
        '/positions/'
      ]
      
      const newEndpoints = currentEndpoints.endpoints.filter(endpoint => 
        !knownEndpoints.includes(endpoint.path)
      )
      
      return {
        total: currentEndpoints.endpoints.length,
        known: knownEndpoints.length,
        new: newEndpoints,
        all: currentEndpoints.endpoints
      }
    } catch (error) {
      console.error('Failed to find new endpoints:', error)
      throw error
    }
  }
}

export const apiExplorer = new ApiExplorer()
