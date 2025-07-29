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
  
  // 컴포넌트별 10초 타이머 상태
  const [componentTimers, setComponentTimers] = useState<{[key: string]: number}>({})
  
  // 10초 타이머 시작 함수
  const startComponentTimer = (componentName: string) => {
    setComponentTimers(prev => ({ ...prev, [componentName]: 10 }))
    
    const interval = setInterval(() => {
      setComponentTimers(prev => {
        const newTime = (prev[componentName] || 0) - 1
        if (newTime <= 0) {
          clearInterval(interval)
          const { [componentName]: removed, ...rest } = prev
          return rest
        }
        return { ...prev, [componentName]: newTime }
      })
    }, 1000)
  }
  
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
    
    // 이미 타이머가 작동 중이면 방지
    if (componentTimers[component]) {
      alert(`${component} 명령 전송 중입니다. ${componentTimers[component]}초 후 다시 시도해주세요.`)
      return
    }
    
    console.log(`🎛️ 대시보드에서 기기 제어: Device ${selectedDeviceId}, ${component} ${command}`)
    
    // 10초 타이머 시작
    startComponentTimer(component)
    
    try {
      await controlDevice(component, command)
      console.log(`✅ 기기 제어 성공: ${component} ${command}`)
      // alert 제거 - 타이머로 충분한 시각적 피드백 제공
    } catch (error) {
      console.error('❌ 기기 제어 에러:', error)
      
      // 에러 시 타이머 제거
      setComponentTimers(prev => {
        const { [component]: removed, ...rest } = prev
        return rest
      })
      
      let errorMessage = "기기 제어에 실패했습니다."
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = `기기(${selectedDeviceId})를 찾을 수 없습니다. 기기가 온라인 상태인지 확인해주세요.`
        } else if (error.message.includes('400')) {
          errorMessage = `지원되지 않는 제어 명령입니다: ${component} ${command}`
        } else if (error.message.includes('500')) {
          errorMessage = "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        } else {
          errorMessage = `에러: ${error.message}`
        }
      }
      
      alert(errorMessage + " 다시 시도해주세요.")
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
                <div className="space-y-6">
                  {/* 첫 번째 줄: 기본 센서 데이터 4개 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  </div>

                  {/* 두 번째 줄: 토양습도 센서 2개 + 상태 카드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 토양 수분 1 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center h-6">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">토양습도 1</CardTitle>
                            <div className="relative group">
                              <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-56">
                                <div className="text-center font-medium mb-2">토양습도 상세 가이드</div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between border-b border-gray-600 pb-1">
                                    <span>수분량</span>
                                    <span>센서값</span>
                                    <span>상태</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>0%</span>
                                    <span>4095</span>
                                    <span>😢 완전건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>10%</span>
                                    <span>3686</span>
                                    <span>😢 매우건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>20%</span>
                                    <span>3276</span>
                                    <span>😢 건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>30%</span>
                                    <span>2867</span>
                                    <span>🙂 최적시작</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>40%</span>
                                    <span>2457</span>
                                    <span>🙂 최적끝</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>50%</span>
                                    <span>2048</span>
                                    <span>🙂 양호</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>60%</span>
                                    <span>1638</span>
                                    <span>🙂 양호</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>80%</span>
                                    <span>819</span>
                                    <span>😰 습함</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>100%</span>
                                    <span>0</span>
                                    <span>😰 물속</span>
                                  </div>
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                          <Sprout className="w-5 h-5 text-green-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {sensorLoading ? "..." : (latestSensorData?.soil_moisture_1 || 0)}
                        </div>
                        <p className="text-sm text-gray-600">
                          ADC
                        </p>
                      </CardContent>
                    </Card>

                    {/* 토양 수분 2 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center h-6">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">토양습도 2</CardTitle>
                            <div className="relative group">
                              <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-56">
                                <div className="text-center font-medium mb-2">토양습도 상세 가이드</div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between border-b border-gray-600 pb-1">
                                    <span>수분량</span>
                                    <span>센서값</span>
                                    <span>상태</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>0%</span>
                                    <span>4095</span>
                                    <span>😢 완전건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>10%</span>
                                    <span>3686</span>
                                    <span>😢 매우건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>20%</span>
                                    <span>3276</span>
                                    <span>😢 건조</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>30%</span>
                                    <span>2867</span>
                                    <span>🙂 최적시작</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>40%</span>
                                    <span>2457</span>
                                    <span>🙂 최적끝</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>50%</span>
                                    <span>2048</span>
                                    <span>🙂 양호</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>60%</span>
                                    <span>1638</span>
                                    <span>🙂 양호</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>80%</span>
                                    <span>819</span>
                                    <span>😰 습함</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>100%</span>
                                    <span>0</span>
                                    <span>😰 물속</span>
                                  </div>
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                          <Sprout className="w-5 h-5 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {sensorLoading ? "..." : (latestSensorData?.soil_moisture_2 || 0)}
                        </div>
                        <p className="text-sm text-gray-600">
                          ADC
                        </p>
                      </CardContent>
                    </Card>

                    {/* 전체 상태 요약 카드 */}
                    <Card className={(() => {
                      if (sensorLoading) return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                      
                      const temp = latestSensorData?.temperature || 0
                      const humidity = latestSensorData?.humidity || 0
                      const soil1 = latestSensorData?.soil_moisture_1 || 0
                      const soil2 = latestSensorData?.soil_moisture_2 || 0
                      
                      const tempGood = temp >= 20 && temp <= 25
                      const humidityGood = humidity >= 40 && humidity <= 60
                      const soil1Good = soil1 >= 2718 && soil1 <= 3177
                      const soil2Good = soil2 >= 2718 && soil2 <= 3177
                      
                      const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                      
                      if (goodCount >= 3) return "bg-gradient-to-br from-green-50 to-green-100 border-green-300" // 최적 - 초록
                      if (goodCount >= 2) return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300" // 주의 - 노랑
                      return "bg-gradient-to-br from-red-50 to-red-100 border-red-300" // 위험 - 빨간
                    })()}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center h-6">
                          <div className="flex items-center gap-2">
                            <CardTitle className={`text-sm font-medium ${
                              (() => {
                                if (sensorLoading) return "text-gray-700"
                                
                                const temp = latestSensorData?.temperature || 0
                                const humidity = latestSensorData?.humidity || 0
                                const soil1 = latestSensorData?.soil_moisture_1 || 0
                                const soil2 = latestSensorData?.soil_moisture_2 || 0
                                
                                const tempGood = temp >= 20 && temp <= 25
                                const humidityGood = humidity >= 40 && humidity <= 60
                                const soil1Good = soil1 >= 2718 && soil1 <= 3177
                                const soil2Good = soil2 >= 2718 && soil2 <= 3177
                                
                                const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                                
                                if (goodCount >= 3) return "text-green-800" // 최적 - 초록
                                if (goodCount >= 2) return "text-yellow-800" // 주의 - 노랑
                                return "text-red-800" // 위험 - 빨간
                              })()
                            }`}>전체 상태</CardTitle>
                            <div className="relative group">
                              <AlertCircle className={`w-4 h-4 cursor-help ${
                                (() => {
                                  if (sensorLoading) return "text-gray-600"
                                  
                                  const temp = latestSensorData?.temperature || 0
                                  const humidity = latestSensorData?.humidity || 0
                                  const soil1 = latestSensorData?.soil_moisture_1 || 0
                                  const soil2 = latestSensorData?.soil_moisture_2 || 0
                                  
                                  const tempGood = temp >= 20 && temp <= 25
                                  const humidityGood = humidity >= 40 && humidity <= 60
                                  const soil1Good = soil1 >= 2718 && soil1 <= 3177
                                  const soil2Good = soil2 >= 2718 && soil2 <= 3177
                                  
                                  const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                                  
                                  if (goodCount >= 3) return "text-green-600" // 최적 - 초록
                                  if (goodCount >= 2) return "text-yellow-600" // 주의 - 노랑
                                  return "text-red-600" // 위험 - 빨간
                                })()
                              }`} />
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-52">
                                <div className="text-center font-medium mb-2">상태 판단 기준</div>
                                <div className="space-y-1 text-xs">
                                  {(() => {
                                    if (sensorLoading) return <div>로딩 중...</div>
                                    
                                    const temp = latestSensorData?.temperature || 0
                                    const humidity = latestSensorData?.humidity || 0
                                    const soil1 = latestSensorData?.soil_moisture_1 || 0
                                    const soil2 = latestSensorData?.soil_moisture_2 || 0
                                    
                                    const tempGood = temp >= 20 && temp <= 25
                                    const humidityGood = humidity >= 40 && humidity <= 60
                                    const soil1Good = soil1 >= 2718 && soil1 <= 3177
                                    const soil2Good = soil2 >= 2718 && soil2 <= 3177
                                    
                                    return (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <span>🌡️ 온도 (20-25°C)</span>
                                          <span>{tempGood ? '✅' : '❌'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>💧 습도 (40-60%)</span>
                                          <span>{humidityGood ? '✅' : '❌'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>🌱 토양습도 1 (2718-3177)</span>
                                          <span>{soil1Good ? '✅' : '❌'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>🌱 토양습도 2 (2718-3177)</span>
                                          <span>{soil2Good ? '✅' : '❌'}</span>
                                        </div>
                                        <div className="border-t border-gray-600 pt-1 mt-2 text-center">
                                          <div>😊 매우 좋음: 3/4 이상</div>
                                          <div>🙂 보통: 2/4</div>
                                          <div>😟 주의: 1/4 이하</div>
                                        </div>
                                      </>
                                    )
                                  })()
                                  }
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl">
                            {(() => {
                              if (sensorLoading) return "🤔"
                              
                              const temp = latestSensorData?.temperature || 0
                              const humidity = latestSensorData?.humidity || 0
                              const soil1 = latestSensorData?.soil_moisture_1 || 0
                              const soil2 = latestSensorData?.soil_moisture_2 || 0
                              
                              // 상태 판단 로직
                              const tempGood = temp >= 20 && temp <= 25
                              const humidityGood = humidity >= 40 && humidity <= 60
                              const soil1Good = soil1 >= 2718 && soil1 <= 3177
                              const soil2Good = soil2 >= 2718 && soil2 <= 3177
                              
                              const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                              
                              if (goodCount >= 3) return "😊" // 매우 좋음
                              if (goodCount >= 2) return "🙂" // 보통
                              return "😟" // 주의 필요
                            })()
                          }
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-lg font-bold ${
                          (() => {
                            if (sensorLoading) return "text-gray-700"
                            
                            const temp = latestSensorData?.temperature || 0
                            const humidity = latestSensorData?.humidity || 0
                            const soil1 = latestSensorData?.soil_moisture_1 || 0
                            const soil2 = latestSensorData?.soil_moisture_2 || 0
                            
                            const tempGood = temp >= 20 && temp <= 25
                            const humidityGood = humidity >= 40 && humidity <= 60
                            const soil1Good = soil1 >= 2718 && soil1 <= 3177
                            const soil2Good = soil2 >= 2718 && soil2 <= 3177
                            
                            const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                            
                            if (goodCount >= 3) return "text-green-700" // 최적 - 초록
                            if (goodCount >= 2) return "text-yellow-700" // 주의 - 노랑
                            return "text-red-700" // 위험 - 빨간
                          })()
                        }`}>
                          {(() => {
                            if (sensorLoading) return "분석 중..."
                            
                            const temp = latestSensorData?.temperature || 0
                            const humidity = latestSensorData?.humidity || 0
                            const soil1 = latestSensorData?.soil_moisture_1 || 0
                            const soil2 = latestSensorData?.soil_moisture_2 || 0
                            
                            const tempGood = temp >= 20 && temp <= 25
                            const humidityGood = humidity >= 40 && humidity <= 60
                            const soil1Good = soil1 >= 2718 && soil1 <= 3177
                            const soil2Good = soil2 >= 2718 && soil2 <= 3177
                            
                            const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                            
                            if (goodCount >= 3) return "매우 좋음"
                            if (goodCount >= 2) return "보통"
                            return "주의 필요"
                          })()
                        }
                        </div>
                        <p className={`text-xs mt-1 ${
                          (() => {
                            if (sensorLoading) return "text-gray-600"
                            
                            const temp = latestSensorData?.temperature || 0
                            const humidity = latestSensorData?.humidity || 0
                            const soil1 = latestSensorData?.soil_moisture_1 || 0
                            const soil2 = latestSensorData?.soil_moisture_2 || 0
                            
                            const tempGood = temp >= 20 && temp <= 25
                            const humidityGood = humidity >= 40 && humidity <= 60
                            const soil1Good = soil1 >= 2718 && soil1 <= 3177
                            const soil2Good = soil2 >= 2718 && soil2 <= 3177
                            
                            const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                            
                            if (goodCount >= 3) return "text-green-600" // 최적 - 초록
                            if (goodCount >= 2) return "text-yellow-600" // 주의 - 노랑
                            return "text-red-600" // 위험 - 빨간
                          })()
                        }`}>
                          {(() => {
                            if (sensorLoading) return ""
                            
                            const temp = latestSensorData?.temperature || 0
                            const humidity = latestSensorData?.humidity || 0
                            const soil1 = latestSensorData?.soil_moisture_1 || 0
                            const soil2 = latestSensorData?.soil_moisture_2 || 0
                            
                            const tempGood = temp >= 20 && temp <= 25
                            const humidityGood = humidity >= 40 && humidity <= 60
                            const soil1Good = soil1 >= 2718 && soil1 <= 3177
                            const soil2Good = soil2 >= 2718 && soil2 <= 3177
                            
                            const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length
                            
                            return `${goodCount}/4 항목 정상`
                          })()
                        }
                        </p>
                      </CardContent>
                    </Card>
                  </div>
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
                        {controlError && (
                          <p className="text-xs text-red-500 mt-2">에러: {controlError}</p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            console.log('🔄 제어 상태 재로드 시도')
                            refetchControlStatus()
                          }}
                        >
                          다시 시도
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* LED 조명 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <div className="flex flex-col">
                              <span className="text-sm">LED 조명</span>
                              {componentTimers['led'] && (
                                <span className="text-xs text-orange-600">명령 전송 중... ({componentTimers['led']}초)</span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={controlStatus?.target_led_state === 'ON' || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('led', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading || componentTimers['led'] > 0}
                          />
                        </div>

                        {/* 급수펌프 1 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-sm">급수펌프 1</span>
                              {componentTimers['pump_1'] && (
                                <span className="text-xs text-orange-600">명령 전송 중... ({componentTimers['pump_1']}초)</span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={controlStatus?.target_pump_state_1 === 'ON' || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('pump_1', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading || componentTimers['pump_1'] > 0}
                          />
                        </div>

                        {/* 급수펌프 2 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-blue-700" />
                            <div className="flex flex-col">
                              <span className="text-sm">급수펌프 2</span>
                              {componentTimers['pump_2'] && (
                                <span className="text-xs text-orange-600">명령 전송 중... ({componentTimers['pump_2']}초)</span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={controlStatus?.target_pump_state_2 === 'ON' || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('pump_2', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading || componentTimers['pump_2'] > 0}
                          />
                        </div>

                        {/* 환기팬 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Fan className="w-5 h-5 text-gray-500" />
                            <div className="flex flex-col">
                              <span className="text-sm">환기팬</span>
                              {componentTimers['fan'] && (
                                <span className="text-xs text-orange-600">명령 전송 중... ({componentTimers['fan']}초)</span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={controlStatus?.target_fan_state === 'ON' || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('fan', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading || componentTimers['fan'] > 0}
                          />
                        </div>

                        {/* 배수펌프 - API 지원 완료 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-red-500" />
                            <div className="flex flex-col">
                              <span className="text-sm">배수펌프</span>
                              {componentTimers['drain_pump'] && (
                                <span className="text-xs text-orange-600">명령 전송 중... ({componentTimers['drain_pump']}초)</span>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={controlStatus?.target_drain_pump_state === 'ON' || false}
                            onCheckedChange={(checked) => {
                              handleControlChange('drain_pump', checked ? 'ON' : 'OFF')
                            }}
                            disabled={controlLoading || componentTimers['drain_pump'] > 0}
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
