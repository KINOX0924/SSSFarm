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
  Edit3,
  Power,
  Lightbulb,
  Fan,
  WifiOff,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// 기기 데이터
const devices = [
  { id: "greenhouse-1", name: "온실 A동", status: "online" },
  { id: "greenhouse-2", name: "온실 B동", status: "online" },
  { id: "greenhouse-3", name: "온실 C동", status: "offline" },
]

// 센서 데이터
const sensorData = {
  "greenhouse-1": {
    light: { value: 850, unit: "lux", status: "normal" },
    humidity: { value: 65, unit: "%", status: "normal" },
    waterLevel: { value: 78, unit: "%", status: "normal" },
    soilMoisture1: { value: 42, unit: "%", status: "normal" },
    soilMoisture2: { value: 58, unit: "%", status: "normal" },
  },
  "greenhouse-2": {
    light: { value: 920, unit: "lux", status: "high" },
    humidity: { value: 58, unit: "%", status: "normal" },
    waterLevel: { value: 34, unit: "%", status: "low" },
    soilMoisture1: { value: 67, unit: "%", status: "normal" },
    soilMoisture2: { value: 35, unit: "%", status: "normal" },
  },
  "greenhouse-3": {
    light: { value: 0, unit: "lux", status: "offline" },
    humidity: { value: 0, unit: "%", status: "offline" },
    waterLevel: { value: 0, unit: "%", status: "offline" },
    soilMoisture1: { value: 0, unit: "%", status: "offline" },
    soilMoisture2: { value: 0, unit: "%", status: "offline" },
  },
}

// 이벤트 로그
const eventLogs = {
  "greenhouse-1": [
    { time: "14:30", trigger: "토양습도 센서", action: "토마토 화분 급수 시작 (습도 42% → 70%)" },
    { time: "13:15", trigger: "자동 스케줄", action: "LED 조명 자동 점등" },
    { time: "12:00", trigger: "조도 센서", action: "조도 850lux 감지, 환기팬 작동" },
    { time: "11:45", trigger: "온도 센서", action: "온도 28°C 도달, 환기팬 가동" },
    { time: "11:30", trigger: "물탱크 센서", action: "물 잔량 78% 확인" },
    { time: "11:15", trigger: "시스템", action: "센서 데이터 수집 완료" },
    { time: "11:00", trigger: "사용자", action: "상추 급수 수동 정지" },
    { time: "10:45", trigger: "토양습도 센서", action: "상추 화분 급수 완료 (습도 58%)" },
  ],
  "greenhouse-2": [
    { time: "14:25", trigger: "물탱크 센서", action: "물 잔량 34% 경고 알림" },
    { time: "13:50", trigger: "습도 센서", action: "습도 58% 적정 수준 유지" },
    { time: "12:30", trigger: "시스템", action: "최적 환경 조건 달성" },
    { time: "11:20", trigger: "자동 스케줄", action: "오이 화분 급수 시작" },
    { time: "11:05", trigger: "온도 센서", action: "온도 26°C, 환기팬 정지" },
    { time: "10:50", trigger: "조도 센서", action: "조도 920lux, LED 조명 자동 소등" },
    { time: "10:30", trigger: "사용자", action: "파프리카 급수 수동 시작" },
    { time: "10:15", trigger: "시스템", action: "전체 센서 상태 점검 완료" },
  ],
  "greenhouse-3": [
    { time: "14:00", trigger: "시스템", action: "네트워크 연결 끊어짐" },
    { time: "13:30", trigger: "시스템", action: "센서 응답 없음 - 점검 필요" },
    { time: "12:45", trigger: "시스템", action: "통신 불안정 감지" },
    { time: "12:00", trigger: "시스템", action: "마지막 정상 데이터 수신" },
    { time: "11:30", trigger: "시스템", action: "연결 재시도 실패" },
  ],
}

// 기기 제어 상태
const initialDeviceControls = {
  "greenhouse-1": {
    ledLight: true,
    waterPump1: false,
    waterPump2: true,
    ventilationFan: true,
  },
  "greenhouse-2": {
    ledLight: false,
    waterPump1: true,
    waterPump2: false,
    ventilationFan: false,
  },
  "greenhouse-3": {
    ledLight: false,
    waterPump1: false,
    waterPump2: false,
    ventilationFan: false,
  },
}

// 센서 이름
const initialSensorNames = {
  "greenhouse-1": {
    soil1: "토마토 화분",
    soil2: "상추 화분",
    pump1: "토마토 급수",
    pump2: "상추 급수",
  },
  "greenhouse-2": {
    soil1: "오이 화분",
    soil2: "파프리카 화분",
    pump1: "오이 급수",
    pump2: "파프리카 급수",
  },
  "greenhouse-3": {
    soil1: "화분 1",
    soil2: "화분 2",
    pump1: "급수펌프 1",
    pump2: "급수펌프 2",
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("dashboard")
  const [currentDevice, setCurrentDevice] = useState("greenhouse-1")
  const [deviceControls, setDeviceControls] = useState(initialDeviceControls)
  const [sensorNames, setSensorNames] = useState(initialSensorNames)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingField, setEditingField] = useState("")
  const [editValue, setEditValue] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
      if (!loggedIn) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setIsLoading(false)
    }
    
    checkLoginStatus()
  }, [router])

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

  // 현재 선택된 기기의 데이터
  const currentSensorData = sensorData[currentDevice as keyof typeof sensorData]
  const currentLogs = eventLogs[currentDevice as keyof typeof eventLogs]
  const currentControls = deviceControls[currentDevice as keyof typeof deviceControls]
  const currentNames = sensorNames[currentDevice as keyof typeof sensorNames]
  const currentDeviceInfo = devices.find((d) => d.id === currentDevice)

  // 제어 변경 핸들러
  const handleControlChange = (controlName: string, value: boolean) => {
    setDeviceControls((prev) => ({
      ...prev,
      [currentDevice]: {
        ...prev[currentDevice as keyof typeof prev],
        [controlName]: value,
      },
    }))
  }

  // 이름 편집
  const handleEditName = (field: string, currentName: string) => {
    setEditingField(field)
    setEditValue(currentName)
    setShowEditModal(true)
  }

  // 이름 저장
  const handleSaveName = () => {
    if (editValue.trim()) {
      setSensorNames((prev) => ({
        ...prev,
        [currentDevice]: {
          ...prev[currentDevice as keyof typeof prev],
          [editingField]: editValue.trim(),
        },
      }))
    }
    setShowEditModal(false)
    setEditingField("")
    setEditValue("")
  }

  // 전체 설정 초기화
  const handleResetControls = () => {
    if (confirm("모든 기기 설정을 초기화하시겠습니까?")) {
      setDeviceControls((prev) => ({
        ...prev,
        [currentDevice]: {
          ledLight: false,
          waterPump1: false,
          waterPump2: false,
          ventilationFan: false,
        },
      }))
    }
  }

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      sessionStorage.removeItem('isLoggedIn')
      alert("로그아웃 되었습니다.")
      router.push('/login')
    }
  }

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

          {/* Device Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">기기 선택</label>
            <Select value={currentDevice} onValueChange={setCurrentDevice}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${device.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      {device.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sensor Cards */}
            <div className="lg:col-span-3 space-y-6">
              {/* Sensor Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* 조도 센서 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center h-6">
                      <CardTitle className="text-sm font-medium">조도</CardTitle>
                      <Sun className="w-5 h-5 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentSensorData.light.value}</div>
                    <p className={`text-sm ${getStatusColor(currentSensorData.light.status)}`}>
                      {currentSensorData.light.unit}
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
                    <div className="text-2xl font-bold">{currentSensorData.humidity.value}</div>
                    <p className={`text-sm ${getStatusColor(currentSensorData.humidity.status)}`}>
                      {currentSensorData.humidity.unit}
                    </p>
                  </CardContent>
                </Card>

                {/* 물탱크 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center h-6">
                      <CardTitle className="text-sm font-medium">물탱크</CardTitle>
                      <Gauge className="w-5 h-5 text-cyan-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentSensorData.waterLevel.value}</div>
                    <p className={`text-sm ${getStatusColor(currentSensorData.waterLevel.status)}`}>
                      {currentSensorData.waterLevel.unit}
                    </p>
                  </CardContent>
                </Card>

                {/* 토양 수분 1 */}
                <Card className="group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center h-6">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CardTitle
                          className="text-sm font-medium cursor-pointer hover:text-blue-600 truncate"
                          onClick={() => handleEditName("soil1", currentNames.soil1)}
                        >
                          {currentNames.soil1}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 flex-shrink-0 opacity-60 hover:opacity-100"
                          onClick={() => handleEditName("soil1", currentNames.soil1)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Sprout className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentSensorData.soilMoisture1.value}</div>
                    <p className={`text-sm ${getStatusColor(currentSensorData.soilMoisture1.status)}`}>
                      토양습도 {currentSensorData.soilMoisture1.unit}
                    </p>
                  </CardContent>
                </Card>

                {/* 토양 수분 2 */}
                <Card className="group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center h-6">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CardTitle
                          className="text-sm font-medium cursor-pointer hover:text-blue-600 truncate"
                          onClick={() => handleEditName("soil2", currentNames.soil2)}
                        >
                          {currentNames.soil2}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 flex-shrink-0 opacity-60 hover:opacity-100"
                          onClick={() => handleEditName("soil2", currentNames.soil2)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Sprout className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentSensorData.soilMoisture2.value}</div>
                    <p className={`text-sm ${getStatusColor(currentSensorData.soilMoisture2.status)}`}>
                      토양습도 {currentSensorData.soilMoisture2.unit}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Event Log */}
              <Card>
                <CardHeader>
                  <CardTitle>이벤트 로그</CardTitle>
                  <p className="text-sm text-gray-600">{currentDeviceInfo?.name}의 최근 활동 내역</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">시간</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">트리거</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">작동내용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLogs.map((log, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 align-top">{log.time}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 align-top">{log.trigger}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 align-top">{log.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  <p className="text-sm text-gray-600">{currentDeviceInfo?.name}</p>
                </CardHeader>
                <CardContent>
                  {currentDeviceInfo?.status === "offline" ? (
                    <div className="text-center py-8">
                      <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">기기가 오프라인 상태입니다</p>
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
                          checked={currentControls.ledLight}
                          onCheckedChange={(checked) => handleControlChange("ledLight", checked)}
                        />
                      </div>

                      {/* 급수펌프 1 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Droplets className="w-5 h-5 text-blue-500" />
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm cursor-pointer hover:text-blue-600"
                              onClick={() => handleEditName("pump1", currentNames.pump1)}
                            >
                              {currentNames.pump1}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                              onClick={() => handleEditName("pump1", currentNames.pump1)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <Switch
                          checked={currentControls.waterPump1}
                          onCheckedChange={(checked) => handleControlChange("waterPump1", checked)}
                        />
                      </div>

                      {/* 급수펌프 2 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Droplets className="w-5 h-5 text-blue-700" />
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm cursor-pointer hover:text-blue-600"
                              onClick={() => handleEditName("pump2", currentNames.pump2)}
                            >
                              {currentNames.pump2}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                              onClick={() => handleEditName("pump2", currentNames.pump2)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <Switch
                          checked={currentControls.waterPump2}
                          onCheckedChange={(checked) => handleControlChange("waterPump2", checked)}
                        />
                      </div>

                      {/* 환기팬 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Fan className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">환기팬</span>
                        </div>
                        <Switch
                          checked={currentControls.ventilationFan}
                          onCheckedChange={(checked) => handleControlChange("ventilationFan", checked)}
                        />
                      </div>

                      {/* 초기화 버튼 */}
                      <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full bg-transparent" onClick={handleResetControls}>
                          전체 설정 초기화
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이름 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="새 이름을 입력하세요"
              maxLength={20}
            />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveName}>
                <Check className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
