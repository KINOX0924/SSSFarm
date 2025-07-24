"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Home,
  Settings,
  ImageIcon,
  FileText,
  LogOut,
  Sun,
  Droplets,
  Gauge,
  Sprout,
  Power,
  Lightbulb,
  Fan,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDashboardDevices, useDeviceSensorData, useDeviceControlStatus, useDeviceEventLogs, useSystemReset } from "@/hooks/useDashboard"
import { logout as apiLogout, isAuthenticated, getStoredToken } from "@/lib/api/auth"

export default function DashboardPage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("dashboard")
  const [currentPositionId, setCurrentPositionId] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 대시보드 API 훅 사용
  const { devices: allDevices, positions, loading: devicesLoading, error: devicesError, refetch: refetchDevices } = useDashboardDevices()
  
  // 현재 선택된 기기 ID (positions 목록은 실제로는 devices 목록)
  const selectedDeviceId = currentPositionId
  const selectedDevice = selectedDeviceId ? allDevices.find(d => d.device_id === selectedDeviceId) : null
  
  // 선택된 기기의 센서 데이터 (자동 갱신)
  const { sensorData, loading: sensorLoading, error: sensorError, refetch: refetchSensorData } = useDeviceSensorData(selectedDeviceId, true)
  
  // 선택된 기기의 제어 상태
  const { controlStatus, loading: controlLoading, error: controlError, refetch: refetchControlStatus, controlDevice } = useDeviceControlStatus(selectedDeviceId)
  
  // 선택된 기기의 이벤트 로그
  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useDeviceEventLogs(selectedDeviceId)
  
  // 전체 시스템 초기화
  const { resetAllDevices, loading: resetLoading, error: resetError } = useSystemReset()
  
  // API 연결 상태 (기기 목록이 있으면 연결됨으로 간주)
  const isConnected = allDevices.length > 0

  // 로그인 상태 확인 (API 기반)
  useEffect(() => {
    const checkLoginStatus = () => {
      const authenticated = isAuthenticated()
      if (!authenticated) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setIsLoading(false)
    }
    
    checkLoginStatus()
  }, [router])

  // 첫 번째 기기를 기본으로 선택
  useEffect(() => {
    if (allDevices.length > 0 && !currentPositionId) {
      setCurrentPositionId(allDevices[0].device_id)
    }
  }, [allDevices, currentPositionId])

  // 로딩 중이거나 로그인하지 않았으면 리턴
  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 text-4xl mb-4">🌱</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 네비게이션 핸들러
  const handleNavigation = (pageId: string) => {
    setActiveNav(pageId)
    switch (pageId) {
      case "dashboard":
        router.push("/")
        break
      case "presets":
        router.push("/presets")
        break
      case "gallery":
        router.push("/gallery")
        break
      case "logs":
        router.push("/logs")
        break
    }
  }

  // 기기 제어 핸들러
  const handleControlChange = async (component: string, command: string) => {
    if (!selectedDeviceId) {
      alert("기기를 선택해주세요.")
      return
    }
    
    try {
      await controlDevice(component, command)
      alert(`${component} ${command} 완료`)
    } catch (error) {
      alert("기기 제어에 실패했습니다. 다시 시도해주세요.")
    }
  }

  // 전체 시스템 초기화 핸들러
  const handleSystemReset = async () => {
    if (confirm("모든 기기를 현재 적용된 프리셋으로 초기화하시겠습니까?")) {
      try {
        await resetAllDevices(allDevices)
        alert("전체 시스템이 초기화되었습니다.")
      } catch (error) {
        alert("초기화 중 오류가 발생했습니다.")
      }
    }
  }

  // 데이터 새로고침
  const handleRefresh = () => {
    refetchDevices()
    refetchSensorData()
    refetchLogs()
  }

  // 로그아웃 (API 기반)
  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        const token = getStoredToken()
        if (token) {
          await apiLogout(token)
        }
        alert("로그아웃 되었습니다.")
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
        // 로그아웃 실패해도 로그인 페이지로 이동
        alert("로그아웃 되었습니다.")
        router.push('/login')
      }
    }
  }

  // 센서 데이터 처리 (최신 데이터 추출)
  const latestSensorData = sensorData.length > 0 ? sensorData[sensorData.length - 1] : null

  // 상태별 색상 클래스
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-green-600"
      case "high":
        return "text-orange-500"
      case "low":
        return "text-red-500"
      case "offline":
        return "text-gray-400"
      default:
        return "text-gray-600"
    }
  }

  // 에러 표시 컴포넌트
  const ErrorAlert = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          재시도
        </Button>
      </AlertDescription>
    </Alert>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3" style={{marginTop: '12px'}}>
              <div className="text-2xl">🌱</div>
              <h1 className="text-xl font-bold text-gray-900">SSSFarm</h1>
              {/* API 연결 상태 표시 */}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={isConnected ? 'API 연결됨' : 'API 연결 끊어짐'} />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[
                  { id: "dashboard", icon: Home, label: "대시보드" },
                  { id: "presets", icon: Settings, label: "설정" },
                  { id: "gallery", icon: ImageIcon, label: "갤러리" },
                  { id: "logs", icon: FileText, label: "로그" },
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    variant={activeNav === id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(id)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
                
                {/* API 테스트 링크 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/api-test')}
                  className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  title="API 연결 테스트"
                >
                  <AlertCircle className="w-4 h-4" />
                  API 테스트
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
                disabled={devicesLoading || sensorLoading || logsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${(devicesLoading || sensorLoading || logsLoading) ? 'animate-spin' : ''}`} />
                새로고침
              </Button>

              <div className="w-px h-6 bg-gray-300" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">대시보드</h2>
              <p className="text-gray-600">실시간 센서 데이터 모니터링 및 기기 제어</p>
            </div>
          </div>

          {/* Error Messages */}
          {devicesError && <ErrorAlert error={devicesError} onRetry={refetchDevices} />}
          {sensorError && <ErrorAlert error={sensorError} onRetry={refetchSensorData} />}
          {logsError && <ErrorAlert error={logsError} onRetry={refetchLogs} />}

          {/* Device Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">기기 선택</label>
            <Select 
              value={currentPositionId?.toString() || ""} 
              onValueChange={(value) => setCurrentPositionId(parseInt(value))}
              disabled={devicesLoading || allDevices.length === 0}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder={
                  devicesLoading ? "로딩 중..." : 
                  allDevices.length === 0 ? "사용 가능한 기기가 없습니다" : 
                  "기기를 선택하세요"
                } />
              </SelectTrigger>
              <SelectContent>
                {allDevices && allDevices.length > 0 && allDevices.map((device) => (
                  <SelectItem key={device?.device_id || 'unknown'} value={device?.device_id?.toString() || ''}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${device?.last_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {device?.device_name || '이름 없음'}
                      {device?.location && <span className="text-xs text-gray-500">({device.location})</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {allDevices.length === 0 && !devicesLoading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">기기 데이터가 없습니다</span>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                API 서버에서 기기 데이터를 불러올 수 없습니다. 
                <button 
                  onClick={() => router.push('/api-test')}
                  className="underline hover:no-underline"
                >
                  API 연결 테스트
                </button>를 실행해보세요.
              </p>
            </div>
          )}

          {currentPositionId && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sensor Cards */}
              <div className="lg:col-span-3 space-y-6">
                {/* Sensor Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* 온도 센서 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">온도</CardTitle>
                        <Sun className="w-5 h-5 text-orange-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.temperature?.toFixed(1) || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        °C
                      </p>
                    </CardContent>
                  </Card>

                  {/* 습도 센서 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">습도</CardTitle>
                        <Droplets className="w-5 h-5 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.humidity?.toFixed(1) || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        %
                      </p>
                    </CardContent>
                  </Card>

                  {/* 조도 센서 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">조도</CardTitle>
                        <Sun className="w-5 h-5 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.light_level || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        lux
                      </p>
                    </CardContent>
                  </Card>

                  {/* 물탱크 수위 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">물탱크</CardTitle>
                        <Gauge className="w-5 h-5 text-cyan-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.water_level || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        %
                      </p>
                    </CardContent>
                  </Card>

                  {/* 토양 수분 1 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">토양습도 1</CardTitle>
                        <Sprout className="w-5 h-5 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.soil_moisture_1 || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        %
                      </p>
                    </CardContent>
                  </Card>

                  {/* 토양 수분 2 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center h-6">
                        <CardTitle className="text-sm font-medium">토양습도 2</CardTitle>
                        <Sprout className="w-5 h-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorLoading ? "..." : (latestSensorData?.soil_moisture_2 || 0)}
                      </div>
                      <p className="text-sm text-gray-600">
                        %
                      </p>
                    </CardContent>
                  </Card>


                </div>

                {/* Event Log */}
                <Card>
                  <CardHeader>
                    <CardTitle>이벤트 로그</CardTitle>
                    <p className="text-sm text-gray-600">{selectedDevice?.device_name}의 최근 활동 내역</p>
                  </CardHeader>
                  <CardContent>
                    {logsLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">로그를 불러오는 중...</p>
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        이벤트 로그가 없습니다.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">시간</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">유형</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">내용</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log) => (
                              <tr key={log.log_id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm font-medium text-gray-900 align-top">
                                  {new Date(log.action_time).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-700 align-top">{log.action_trigger}</td>
                                <td className="py-3 px-4 text-sm text-gray-700 align-top">{log.action_type}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Control Panel */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Power className="w-5 h-5" />
                      기기 제어
                    </CardTitle>
                    <p className="text-sm text-gray-600">{selectedDevice?.device_name}</p>
                  </CardHeader>
                  <CardContent>
                    {devicesLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">기기 정보를 불러오는 중...</p>
                      </div>
                    ) : !controlStatus ? (
                      <div className="text-center py-8">
                        <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">연결된 기기가 없습니다</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* LED 조명 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm">LED 조명</span>
                          </div>
                          <Switch
                            checked={controlStatus?.LED || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('LED', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading}
                          />
                        </div>

                        {/* 급수펌프 1 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">급수펌프 1</span>
                          </div>
                          <Switch
                            checked={controlStatus?.PUMP1 || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('PUMP1', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading}
                          />
                        </div>

                        {/* 급수펌프 2 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-blue-700" />
                            <span className="text-sm">급수펌프 2</span>
                          </div>
                          <Switch
                            checked={controlStatus?.PUMP2 || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('PUMP2', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading}
                          />
                        </div>

                        {/* 환기팬 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Fan className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">환기팬</span>
                          </div>
                          <Switch
                            checked={controlStatus?.FAN || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('FAN', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading}
                          />
                        </div>

                        {/* 전체 설정 초기화 */}
                        <div className="pt-4 border-t">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleSystemReset}
                            disabled={resetLoading}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${resetLoading ? 'animate-spin' : ''}`} />
                            전체 설정 초기화
                          </Button>
                        </div>

                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
