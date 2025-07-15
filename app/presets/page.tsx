"use client"

import { useState, useEffect } from "react"
import {
  Home,
  Settings,
  ImageIcon,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Power,
  Wifi,
  WifiOff,
  Save,
  Droplets,
  Lightbulb,
  Fan,
  Sun,
  Clock,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// import 추가
import { useRouter } from "next/navigation"

// 장비 설정 타입 정의
interface EquipmentSettings {
  ledLight: {
    enabled: boolean
    timeControl: boolean // 시간 기반 제어 활성화
    lightControl: boolean // 조도 기반 제어 활성화
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

// 초기 기기 데이터
const initialDevices = [
  { id: "greenhouse-1", name: "온실 A동", status: "online", location: "1층 동쪽", ip: "AA:BB:CC:DD:EE:01" },
  { id: "greenhouse-2", name: "온실 B동", status: "online", location: "1층 서쪽", ip: "AA:BB:CC:DD:EE:02" },
  { id: "greenhouse-3", name: "온실 C동", status: "offline", location: "2층 동쪽", ip: "AA:BB:CC:DD:EE:03" },
]

// 프리셋 데이터 (새로운 구조)
const initialPresets = [
  {
    id: "preset-1",
    name: "여름 모드",
    settings: {
      ledLight: {
        enabled: false,
        timeControl: false,
        lightControl: false,
        startTime: "06:00",
        endTime: "20:00",
        lightThreshold: 500,
      },
      ventilationFan: {
        enabled: true,
        startTemperature: 28,
        endTemperature: 25,
      },
      waterPump1: {
        enabled: true,
        startHumidity: 40,
        endHumidity: 70,
        name: "토마토 급수",
      },
      waterPump2: {
        enabled: true,
        startHumidity: 35,
        endHumidity: 65,
        name: "상추 급수",
      },
    } as EquipmentSettings,
  },
  {
    id: "preset-2",
    name: "겨울 모드",
    settings: {
      ledLight: {
        enabled: true,
        timeControl: false,
        lightControl: true,
        startTime: "07:00",
        endTime: "18:00",
        lightThreshold: 300,
      },
      ventilationFan: {
        enabled: false,
        startTemperature: 30,
        endTemperature: 27,
      },
      waterPump1: {
        enabled: false,
        startHumidity: 30,
        endHumidity: 60,
        name: "토마토 급수",
      },
      waterPump2: {
        enabled: false,
        startHumidity: 25,
        endHumidity: 55,
        name: "상추 급수",
      },
    } as EquipmentSettings,
  },
  {
    id: "preset-3",
    name: "성장 모드",
    settings: {
      ledLight: {
        enabled: true,
        timeControl: true,
        lightControl: true, // 둘 다 활성화
        startTime: "05:00",
        endTime: "22:00",
        lightThreshold: 400,
      },
      ventilationFan: {
        enabled: true,
        startTemperature: 26,
        endTemperature: 23,
      },
      waterPump1: {
        enabled: true,
        startHumidity: 45,
        endHumidity: 75,
        name: "토마토 급수",
      },
      waterPump2: {
        enabled: true,
        startHumidity: 40,
        endHumidity: 70,
        name: "상추 급수",
      },
    } as EquipmentSettings,
  },
]

export default function PresetsPage() {
  // 컴포넌트 내부에 router 추가
  const router = useRouter()
  
  // 모든 useState를 최상단에 선언
  const [devices, setDevices] = useState(initialDevices)
  const [presets, setPresets] = useState(initialPresets)
  const [activeTab, setActiveTab] = useState("devices")
  const [activeNav, setActiveNav] = useState("presets")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 계정 관리 관련 상태
  const [newUsername, setNewUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: "admin", password: "admin" })

  // 저장된 계정 정보 로드
  useEffect(() => {
    const savedCredentials = localStorage.getItem('adminCredentials')
    if (savedCredentials) {
      try {
        const parsedCredentials = JSON.parse(savedCredentials)
        setAdminCredentials(parsedCredentials)
      } catch (e) {
        console.warn('저장된 계정 정보 로드 실패')
      }
    }
  }, [])

  // 기기 관련 상태
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showEditDevice, setShowEditDevice] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
    ip: "",
  })
  const [editDevice, setEditDevice] = useState({
    name: "",
    location: "",
    ip: "",
  })

  // 프리셋 관련 상태
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [showEditPreset, setShowEditPreset] = useState(false)
  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [newPreset, setNewPreset] = useState({
    name: "",
    settings: {
      ledLight: {
        enabled: false,
        timeControl: false,
        lightControl: false,
        startTime: "06:00",
        endTime: "18:00",
        lightThreshold: 500,
      },
      ventilationFan: {
        enabled: false,
        startTemperature: 25,
        endTemperature: 22,
      },
      waterPump1: {
        enabled: false,
        startHumidity: 40,
        endHumidity: 70,
        name: "급수펌프 1",
      },
      waterPump2: {
        enabled: false,
        startHumidity: 40,
        endHumidity: 70,
        name: "급수펌프 2",
      },
    } as EquipmentSettings,
  })
  const [editPreset, setEditPreset] = useState({
    name: "",
    settings: {
      ledLight: {
        enabled: false,
        timeControl: false,
        lightControl: false,
        startTime: "06:00",
        endTime: "18:00",
        lightThreshold: 500,
      },
      ventilationFan: {
        enabled: false,
        startTemperature: 25,
        endTemperature: 22,
      },
      waterPump1: {
        enabled: false,
        startHumidity: 40,
        endHumidity: 70,
        name: "급수펌프 1",
      },
      waterPump2: {
        enabled: false,
        startHumidity: 40,
        endHumidity: 70,
        name: "급수펌프 2",
      },
    } as EquipmentSettings,
  })

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

  // 기기 추가
  const addDevice = () => {
    if (newDevice.name.trim()) {
      const device = {
        id: `greenhouse-${Date.now()}`,
        name: newDevice.name,
        status: "offline" as const,
        location: newDevice.location,
        ip: newDevice.ip,
      }
      setDevices([...devices, device])
      setNewDevice({ name: "", location: "", ip: "" })
      setShowAddDevice(false)
    }
  }

  // 기기 편집 시작
  const startEditDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setEditDevice({
        name: device.name,
        location: device.location,
        ip: device.ip,
      })
      setEditingDevice(deviceId)
      setShowEditDevice(true)
    }
  }

  // 기기 편집 저장
  const saveEditDevice = () => {
    if (editingDevice && editDevice.name.trim()) {
      setDevices(
        devices.map((device) =>
          device.id === editingDevice
            ? {
                ...device,
                name: editDevice.name,
                location: editDevice.location,
                ip: editDevice.ip,
              }
            : device,
        ),
      )
      setShowEditDevice(false)
      setEditingDevice(null)
      setEditDevice({ name: "", location: "", ip: "" })
    }
  }

  // 기기 삭제
  const deleteDevice = (id: string) => {
    if (confirm("정말로 이 기기를 삭제하시겠습니까?")) {
      setDevices(devices.filter((device) => device.id !== id))
    }
  }

  // 기기 상태 토글
  const toggleDeviceStatus = (id: string) => {
    setDevices(
      devices.map((device) =>
        device.id === id ? { ...device, status: device.status === "online" ? "offline" : "online" } : device,
      ),
    )
  }

  // 프리셋 추가
  const addPreset = () => {
    if (newPreset.name.trim()) {
      const preset = {
        id: `preset-${Date.now()}`,
        name: newPreset.name,
        settings: { ...newPreset.settings },
      }
      setPresets([...presets, preset])
      setNewPreset({
        name: "",
        settings: {
          ledLight: {
            enabled: false,
            timeControl: false,
            lightControl: false,
            startTime: "06:00",
            endTime: "18:00",
            lightThreshold: 500,
          },
          ventilationFan: {
            enabled: false,
            startTemperature: 25,
            endTemperature: 22,
          },
          waterPump1: {
            enabled: false,
            startHumidity: 40,
            endHumidity: 70,
            name: "급수펌프 1",
          },
          waterPump2: {
            enabled: false,
            startHumidity: 40,
            endHumidity: 70,
            name: "급수펌프 2",
          },
        },
      })
      setShowAddPreset(false)
    }
  }

  // 프리셋 편집 시작
  const startEditPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setEditPreset({
        name: preset.name,
        settings: { ...preset.settings },
      })
      setEditingPreset(presetId)
      setShowEditPreset(true)
    }
  }

  // 프리셋 편집 저장
  const saveEditPreset = () => {
    if (editingPreset && editPreset.name.trim()) {
      setPresets(
        presets.map((preset) =>
          preset.id === editingPreset
            ? {
                ...preset,
                name: editPreset.name,
                settings: { ...editPreset.settings },
              }
            : preset,
        ),
      )
      setShowEditPreset(false)
      setEditingPreset(null)
    }
  }

  // 프리셋 삭제
  const deletePreset = (id: string) => {
    if (confirm("정말로 이 프리셋을 삭제하시겠습니까?")) {
      setPresets(presets.filter((preset) => preset.id !== id))
    }
  }

  // 계정 정보 변경 함수
  const handleAccountChange = () => {
    // 유효성 검사
    if (!currentPassword) {
      alert("현재 비밀번호를 입력해주세요.")
      return
    }

    if (currentPassword !== adminCredentials.password) {
      alert("현재 비밀번호가 올바르지 않습니다.")
      return
    }

    // 아이디 변경 유효성 검사
    if (newUsername && newUsername.trim().length < 3) {
      alert("아이디는 3자 이상이어야 합니다.")
      return
    }

    // 비밀번호 변경 유효성 검사
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.")
        return
      }

      if (newPassword.length < 4) {
        alert("비밀번호는 4자 이상이어야 합니다.")
        return
      }
    }

    // 변경될 내용이 있는지 확인
    if (!newUsername.trim() && !newPassword) {
      alert("변경할 아이디 또는 비밀번호를 입력해주세요.")
      return
    }

    // 계정 정보 변경 (실제로는 API 호출)
    const newCredentials = { ...adminCredentials }
    if (newUsername.trim()) {
      newCredentials.username = newUsername.trim()
    }
    if (newPassword) {
      newCredentials.password = newPassword
    }
    
    // localStorage에 저장
    localStorage.setItem('adminCredentials', JSON.stringify(newCredentials))
    
    setAdminCredentials(newCredentials)
    console.log("계정 정보 변경:", newCredentials)
    alert("계정 정보가 성공적으로 변경되었습니다.")
    
    // 로그아웃 처리
    if (confirm("계정 정보가 변경되었습니다. 다시 로그인하시겠습니까?")) {
      sessionStorage.removeItem('isLoggedIn')
      router.push('/login')
    }
    
    // 폼 초기화
    setNewUsername("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  // 프리셋 적용
  const applyPreset = (presetId: string, deviceId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      console.log(`프리셋 "${preset.name}"을 기기 "${deviceId}"에 적용`)
      alert(`프리셋 "${preset.name}"이 적용되었습니다.`)
    }
  }

  // 프리셋 설정 업데이트 함수들
  const updatePresetSettings = (field: keyof EquipmentSettings, value: any) => {
    setNewPreset({
      ...newPreset,
      settings: {
        ...newPreset.settings,
        [field]: value,
      },
    })
  }

  // 편집 프리셋 설정 업데이트 함수들
  const updateEditPresetSettings = (field: keyof EquipmentSettings, value: any) => {
    setEditPreset({
      ...editPreset,
      settings: {
        ...editPreset.settings,
        [field]: value,
      },
    })
  }

  // 네비게이션 핸들러 추가
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
                onClick={() => {
                  if (confirm("로그아웃 하시겠습니까?")) {
                    sessionStorage.removeItem('isLoggedIn')
                    alert("로그아웃 되었습니다.")
                    router.push("/login")
                  }
                }}
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">설정</h2>
            <p className="text-gray-600">기기 관리, 제어 프리셋 및 계정 설정</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === "devices" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("devices")}
                className="gap-2"
              >
                <Power className="w-4 h-4" />
                기기 관리
              </Button>
              <Button
                variant={activeTab === "presets" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("presets")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                프리셋 관리
              </Button>
              <Button
                variant={activeTab === "account" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("account")}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                계정 관리
              </Button>
            </div>
          </div>

          {/* Device Management Tab */}
          {activeTab === "devices" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">등록된 기기</h3>
                <Button onClick={() => setShowAddDevice(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  기기 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <Card key={device.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{device.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{device.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={device.status === "online" ? "default" : "secondary"}>
                            {device.status === "online" ? (
                              <Wifi className="w-3 h-3 mr-1" />
                            ) : (
                              <WifiOff className="w-3 h-3 mr-1" />
                            )}
                            {device.status === "online" ? "온라인" : "오프라인"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600">
                        <p>MAC 주소: {device.ip}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">기기 상태</span>
                        <Switch
                          checked={device.status === "online"}
                          onCheckedChange={() => toggleDeviceStatus(device.id)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => startEditDevice(device.id)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDevice(device.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Preset Application */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">프리셋 적용</span>
                        </div>
                        <Select onValueChange={(value) => applyPreset(value, device.id)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="프리셋 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {presets.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Preset Management Tab */}
          {activeTab === "presets" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">제어 프리셋</h3>
                <Button onClick={() => setShowAddPreset(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  프리셋 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <Card key={preset.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{preset.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {/* LED 조명 - 고정 높이 */}
                        <div className="flex justify-between items-start min-h-[3.5rem]">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">LED 조명</span>
                          </div>
                          <div className="text-right">
                            <Badge variant={preset.settings.ledLight.enabled ? "default" : "outline"}>
                              {preset.settings.ledLight.enabled ? "ON" : "OFF"}
                            </Badge>
                            <div className="min-h-[1.25rem] mt-1">
                              {preset.settings.ledLight.enabled && (
                                <p className="text-xs text-gray-500">
                                  {(() => {
                                    const conditions = []
                                    if (preset.settings.ledLight.timeControl) {
                                      conditions.push(
                                        `${preset.settings.ledLight.startTime}-${preset.settings.ledLight.endTime}`,
                                      )
                                    }
                                    if (preset.settings.ledLight.lightControl) {
                                      conditions.push(`<${preset.settings.ledLight.lightThreshold}lux`)
                                    }
                                    return conditions.length > 1 ? conditions.join(" OR ") : conditions[0] || ""
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 환기팬 - 고정 높이 */}
                        <div className="flex justify-between items-start min-h-[3.5rem]">
                          <div className="flex items-center gap-2">
                            <Fan className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">환기팬</span>
                          </div>
                          <div className="text-right">
                            <Badge variant={preset.settings.ventilationFan.enabled ? "default" : "outline"}>
                              {preset.settings.ventilationFan.enabled ? "ON" : "OFF"}
                            </Badge>
                            <div className="min-h-[1.25rem] mt-1">
                              {preset.settings.ventilationFan.enabled && (
                                <p className="text-xs text-gray-500">
                                  {preset.settings.ventilationFan.startTemperature}°C →{" "}
                                  {preset.settings.ventilationFan.endTemperature}°C
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 급수펌프 1 - 고정 높이 */}
                        <div className="flex justify-between items-start min-h-[3.5rem]">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{preset.settings.waterPump1.name}</span>
                          </div>
                          <div className="text-right">
                            <Badge variant={preset.settings.waterPump1.enabled ? "default" : "outline"}>
                              {preset.settings.waterPump1.enabled ? "ON" : "OFF"}
                            </Badge>
                            <div className="min-h-[1.25rem] mt-1">
                              {preset.settings.waterPump1.enabled && (
                                <p className="text-xs text-gray-500">
                                  {preset.settings.waterPump1.startHumidity}% → {preset.settings.waterPump1.endHumidity}
                                  %
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 급수펌프 2 - 고정 높이 */}
                        <div className="flex justify-between items-start min-h-[3.5rem]">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-700" />
                            <span className="text-sm">{preset.settings.waterPump2.name}</span>
                          </div>
                          <div className="text-right">
                            <Badge variant={preset.settings.waterPump2.enabled ? "default" : "outline"}>
                              {preset.settings.waterPump2.enabled ? "ON" : "OFF"}
                            </Badge>
                            <div className="min-h-[1.25rem] mt-1">
                              {preset.settings.waterPump2.enabled && (
                                <p className="text-xs text-gray-500">
                                  {preset.settings.waterPump2.startHumidity}% → {preset.settings.waterPump2.endHumidity}
                                  %
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => startEditPreset(preset.id)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePreset(preset.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {/* Account Management Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">계정 관리</h3>
              </div>

              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    관리자 계정 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>현재 아이디</Label>
                    <Input value={adminCredentials.username} disabled className="bg-gray-50" />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">계정 정보 변경</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-password">현재 비밀번호 (필수)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="현재 비밀번호를 입력하세요"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-username">새 아이디 (선택사항)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="new-username"
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="새 아이디를 입력하세요 (비우지 않으면 변경안함)"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">새 비밀번호 (선택사항)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="새 비밀번호를 입력하세요 (비우지 않으면 변경안함)"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {newPassword && (
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">비밀번호 확인</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 다시 입력하세요"
                            className="pl-10 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleAccountChange} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      계정 정보 변경
                    </Button>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• 현재 비밀번호는 필수로 입력해야 합니다.</p>
                      <p>• 아이디와 비밀번호 중 하나 이상을 변경해야 합니다.</p>
                      <p>• 아이디는 3자 이상, 비밀번호는 4자 이상이어야 합니다.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Add Device Modal */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 기기 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">기기 이름</label>
              <Input
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="예: 온실 D동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">위치</label>
              <Input
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                placeholder="예: 2층 서쪽"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MAC 주소</label>
              <Input
                value={newDevice.ip}
                onChange={(e) => setNewDevice({ ...newDevice, ip: e.target.value })}
                placeholder="예: AA:BB:CC:DD:EE:04"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={addDevice}>
                <Check className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowAddDevice(false)}>
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Device Modal */}
      <Dialog open={showEditDevice} onOpenChange={setShowEditDevice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>기기 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">기기 이름</label>
              <Input
                value={editDevice.name}
                onChange={(e) => setEditDevice({ ...editDevice, name: e.target.value })}
                placeholder="예: 온실 D동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">위치</label>
              <Input
                value={editDevice.location}
                onChange={(e) => setEditDevice({ ...editDevice, location: e.target.value })}
                placeholder="예: 2층 서쪽"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MAC 주소</label>
              <Input
                value={editDevice.ip}
                onChange={(e) => setEditDevice({ ...editDevice, ip: e.target.value })}
                placeholder="예: AA:BB:CC:DD:EE:04"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={saveEditDevice}>
                <Check className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowEditDevice(false)}>
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Preset Modal */}
      <Dialog open={showAddPreset} onOpenChange={setShowAddPreset}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 프리셋 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <Label htmlFor="preset-name">프리셋 이름</Label>
              <Input
                id="preset-name"
                value={newPreset.name}
                onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                placeholder="예: 봄철 모드"
              />
            </div>

            <Separator />

            {/* 장비 설정 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">장비 제어 설정</h3>

              {/* LED 조명 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <CardTitle className="text-base">LED 조명</CardTitle>
                    </div>
                    <Switch
                      checked={newPreset.settings.ledLight.enabled}
                      onCheckedChange={(checked) =>
                        updatePresetSettings("ledLight", {
                          ...newPreset.settings.ledLight,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {newPreset.settings.ledLight.enabled && (
                  <CardContent className="pt-0 space-y-4">
                    {/* 제어 방식 선택 */}
                    <div>
                      <Label className="text-sm font-medium">제어 방식 (복수 선택 가능)</Label>
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="time-control"
                            checked={newPreset.settings.ledLight.timeControl}
                            onChange={(e) =>
                              updatePresetSettings("ledLight", {
                                ...newPreset.settings.ledLight,
                                timeControl: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="time-control" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            시간 기반 제어
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="light-control"
                            checked={newPreset.settings.ledLight.lightControl}
                            onChange={(e) =>
                              updatePresetSettings("ledLight", {
                                ...newPreset.settings.ledLight,
                                lightControl: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="light-control" className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            조도 기반 제어
                          </Label>
                        </div>
                      </div>
                      {newPreset.settings.ledLight.timeControl && newPreset.settings.ledLight.lightControl && (
                        <p className="text-xs text-blue-600 mt-2">💡 두 조건 중 하나라도 만족하면 LED가 켜집니다</p>
                      )}
                    </div>

                    {/* 시간 기반 설정 */}
                    {newPreset.settings.ledLight.timeControl && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label htmlFor="led-start">시작 시간</Label>
                          <Input
                            id="led-start"
                            type="time"
                            value={newPreset.settings.ledLight.startTime}
                            onChange={(e) =>
                              updatePresetSettings("ledLight", {
                                ...newPreset.settings.ledLight,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="led-end">종료 시간</Label>
                          <Input
                            id="led-end"
                            type="time"
                            value={newPreset.settings.ledLight.endTime}
                            onChange={(e) =>
                              updatePresetSettings("ledLight", {
                                ...newPreset.settings.ledLight,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* 조도 기반 설정 */}
                    {newPreset.settings.ledLight.lightControl && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label htmlFor="light-threshold">조도 임계값 (lux)</Label>
                        <Input
                          id="light-threshold"
                          type="number"
                          value={newPreset.settings.ledLight.lightThreshold}
                          onChange={(e) =>
                            updatePresetSettings("ledLight", {
                              ...newPreset.settings.ledLight,
                              lightThreshold: Number.parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="예: 500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          조도가 설정값 이하로 떨어지면 LED가 자동으로 켜집니다.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* 환기팬 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fan className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-base">환기팬</CardTitle>
                    </div>
                    <Switch
                      checked={newPreset.settings.ventilationFan.enabled}
                      onCheckedChange={(checked) =>
                        updatePresetSettings("ventilationFan", {
                          ...newPreset.settings.ventilationFan,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {newPreset.settings.ventilationFan.enabled && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fan-start">작동 시작 온도 (°C)</Label>
                        <Input
                          id="fan-start"
                          type="number"
                          value={newPreset.settings.ventilationFan.startTemperature}
                          onChange={(e) =>
                            updatePresetSettings("ventilationFan", {
                              ...newPreset.settings.ventilationFan,
                              startTemperature: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="fan-end">작동 종료 온도 (°C)</Label>
                        <Input
                          id="fan-end"
                          type="number"
                          value={newPreset.settings.ventilationFan.endTemperature}
                          onChange={(e) =>
                            updatePresetSettings("ventilationFan", {
                              ...newPreset.settings.ventilationFan,
                              endTemperature: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      온도가 시작 온도에 도달하면 작동하고, 종료 온도까지 내려가면 정지합니다.
                    </p>
                  </CardContent>
                )}
              </Card>

              {/* 급수펌프 1 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-base">급수펌프 1</CardTitle>
                    </div>
                    <Switch
                      checked={newPreset.settings.waterPump1.enabled}
                      onCheckedChange={(checked) =>
                        updatePresetSettings("waterPump1", {
                          ...newPreset.settings.waterPump1,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {newPreset.settings.waterPump1.enabled && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pump1-name">펌프 이름</Label>
                        <Input
                          id="pump1-name"
                          value={newPreset.settings.waterPump1.name}
                          onChange={(e) =>
                            updatePresetSettings("waterPump1", {
                              ...newPreset.settings.waterPump1,
                              name: e.target.value,
                            })
                          }
                          placeholder="예: 토마토 급수"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pump1-start">작동 시작 습도 (%)</Label>
                          <Input
                            id="pump1-start"
                            type="number"
                            value={newPreset.settings.waterPump1.startHumidity}
                            onChange={(e) =>
                              updatePresetSettings("waterPump1", {
                                ...newPreset.settings.waterPump1,
                                startHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="pump1-end">작동 종료 습도 (%)</Label>
                          <Input
                            id="pump1-end"
                            type="number"
                            value={newPreset.settings.waterPump1.endHumidity}
                            onChange={(e) =>
                              updatePresetSettings("waterPump1", {
                                ...newPreset.settings.waterPump1,
                                endHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        토양 습도가 시작 습도 이하로 떨어지면 작동하고, 종료 습도에 도달하면 정지합니다.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* 급수펌프 2 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-700" />
                      <CardTitle className="text-base">급수펌프 2</CardTitle>
                    </div>
                    <Switch
                      checked={newPreset.settings.waterPump2.enabled}
                      onCheckedChange={(checked) =>
                        updatePresetSettings("waterPump2", {
                          ...newPreset.settings.waterPump2,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {newPreset.settings.waterPump2.enabled && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pump2-name">펌프 이름</Label>
                        <Input
                          id="pump2-name"
                          value={newPreset.settings.waterPump2.name}
                          onChange={(e) =>
                            updatePresetSettings("waterPump2", {
                              ...newPreset.settings.waterPump2,
                              name: e.target.value,
                            })
                          }
                          placeholder="예: 상추 급수"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pump2-start">작동 시작 습도 (%)</Label>
                          <Input
                            id="pump2-start"
                            type="number"
                            value={newPreset.settings.waterPump2.startHumidity}
                            onChange={(e) =>
                              updatePresetSettings("waterPump2", {
                                ...newPreset.settings.waterPump2,
                                startHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="pump2-end">작동 종료 습도 (%)</Label>
                          <Input
                            id="pump2-end"
                            type="number"
                            value={newPreset.settings.waterPump2.endHumidity}
                            onChange={(e) =>
                              updatePresetSettings("waterPump2", {
                                ...newPreset.settings.waterPump2,
                                endHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        토양 습도가 시작 습도 이하로 떨어지면 작동하고, 종료 습도에 도달하면 정지합니다.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button onClick={addPreset}>
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowAddPreset(false)}>
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Modal */}
      <Dialog open={showEditPreset} onOpenChange={setShowEditPreset}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프리셋 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <Label htmlFor="edit-preset-name">프리셋 이름</Label>
              <Input
                id="edit-preset-name"
                value={editPreset.name}
                onChange={(e) => setEditPreset({ ...editPreset, name: e.target.value })}
                placeholder="예: 봄철 모드"
              />
            </div>

            <Separator />

            {/* 장비 설정 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">장비 제어 설정</h3>

              {/* LED 조명 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <CardTitle className="text-base">LED 조명</CardTitle>
                    </div>
                    <Switch
                      checked={editPreset.settings.ledLight.enabled}
                      onCheckedChange={(checked) =>
                        updateEditPresetSettings("ledLight", {
                          ...editPreset.settings.ledLight,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {editPreset.settings.ledLight.enabled && (
                  <CardContent className="pt-0 space-y-4">
                    {/* 제어 방식 선택 */}
                    <div>
                      <Label className="text-sm font-medium">제어 방식 (복수 선택 가능)</Label>
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="edit-time-control"
                            checked={editPreset.settings.ledLight.timeControl}
                            onChange={(e) =>
                              updateEditPresetSettings("ledLight", {
                                ...editPreset.settings.ledLight,
                                timeControl: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="edit-time-control" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            시간 기반 제어
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="edit-light-control"
                            checked={editPreset.settings.ledLight.lightControl}
                            onChange={(e) =>
                              updateEditPresetSettings("ledLight", {
                                ...editPreset.settings.ledLight,
                                lightControl: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="edit-light-control" className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            조도 기반 제어
                          </Label>
                        </div>
                      </div>
                      {editPreset.settings.ledLight.timeControl && editPreset.settings.ledLight.lightControl && (
                        <p className="text-xs text-blue-600 mt-2">💡 두 조건 중 하나라도 만족하면 LED가 켜집니다</p>
                      )}
                    </div>

                    {/* 시간 기반 설정 */}
                    {editPreset.settings.ledLight.timeControl && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label htmlFor="edit-led-start">시작 시간</Label>
                          <Input
                            id="edit-led-start"
                            type="time"
                            value={editPreset.settings.ledLight.startTime}
                            onChange={(e) =>
                              updateEditPresetSettings("ledLight", {
                                ...editPreset.settings.ledLight,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-led-end">종료 시간</Label>
                          <Input
                            id="edit-led-end"
                            type="time"
                            value={editPreset.settings.ledLight.endTime}
                            onChange={(e) =>
                              updateEditPresetSettings("ledLight", {
                                ...editPreset.settings.ledLight,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* 조도 기반 설정 */}
                    {editPreset.settings.ledLight.lightControl && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label htmlFor="edit-light-threshold">조도 임계값 (lux)</Label>
                        <Input
                          id="edit-light-threshold"
                          type="number"
                          value={editPreset.settings.ledLight.lightThreshold}
                          onChange={(e) =>
                            updateEditPresetSettings("ledLight", {
                              ...editPreset.settings.ledLight,
                              lightThreshold: Number.parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="예: 500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          조도가 설정값 이하로 떨어지면 LED가 자동으로 켜집니다.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* 환기팬 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fan className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-base">환기팬</CardTitle>
                    </div>
                    <Switch
                      checked={editPreset.settings.ventilationFan.enabled}
                      onCheckedChange={(checked) =>
                        updateEditPresetSettings("ventilationFan", {
                          ...editPreset.settings.ventilationFan,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {editPreset.settings.ventilationFan.enabled && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-fan-start">작동 시작 온도 (°C)</Label>
                        <Input
                          id="edit-fan-start"
                          type="number"
                          value={editPreset.settings.ventilationFan.startTemperature}
                          onChange={(e) =>
                            updateEditPresetSettings("ventilationFan", {
                              ...editPreset.settings.ventilationFan,
                              startTemperature: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-fan-end">작동 종료 온도 (°C)</Label>
                        <Input
                          id="edit-fan-end"
                          type="number"
                          value={editPreset.settings.ventilationFan.endTemperature}
                          onChange={(e) =>
                            updateEditPresetSettings("ventilationFan", {
                              ...editPreset.settings.ventilationFan,
                              endTemperature: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      온도가 시작 온도에 도달하면 작동하고, 종료 온도까지 내려가면 정지합니다.
                    </p>
                  </CardContent>
                )}
              </Card>

              {/* 급수펌프 1 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-base">급수펌프 1</CardTitle>
                    </div>
                    <Switch
                      checked={editPreset.settings.waterPump1.enabled}
                      onCheckedChange={(checked) =>
                        updateEditPresetSettings("waterPump1", {
                          ...editPreset.settings.waterPump1,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {editPreset.settings.waterPump1.enabled && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-pump1-name">펌프 이름</Label>
                        <Input
                          id="edit-pump1-name"
                          value={editPreset.settings.waterPump1.name}
                          onChange={(e) =>
                            updateEditPresetSettings("waterPump1", {
                              ...editPreset.settings.waterPump1,
                              name: e.target.value,
                            })
                          }
                          placeholder="예: 토마토 급수"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-pump1-start">작동 시작 습도 (%)</Label>
                          <Input
                            id="edit-pump1-start"
                            type="number"
                            value={editPreset.settings.waterPump1.startHumidity}
                            onChange={(e) =>
                              updateEditPresetSettings("waterPump1", {
                                ...editPreset.settings.waterPump1,
                                startHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-pump1-end">작동 종료 습도 (%)</Label>
                          <Input
                            id="edit-pump1-end"
                            type="number"
                            value={editPreset.settings.waterPump1.endHumidity}
                            onChange={(e) =>
                              updateEditPresetSettings("waterPump1", {
                                ...editPreset.settings.waterPump1,
                                endHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        토양 습도가 시작 습도 이하로 떨어지면 작동하고, 종료 습도에 도달하면 정지합니다.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* 급수펌프 2 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-700" />
                      <CardTitle className="text-base">급수펌프 2</CardTitle>
                    </div>
                    <Switch
                      checked={editPreset.settings.waterPump2.enabled}
                      onCheckedChange={(checked) =>
                        updateEditPresetSettings("waterPump2", {
                          ...editPreset.settings.waterPump2,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {editPreset.settings.waterPump2.enabled && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-pump2-name">펌프 이름</Label>
                        <Input
                          id="edit-pump2-name"
                          value={editPreset.settings.waterPump2.name}
                          onChange={(e) =>
                            updateEditPresetSettings("waterPump2", {
                              ...editPreset.settings.waterPump2,
                              name: e.target.value,
                            })
                          }
                          placeholder="예: 상추 급수"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-pump2-start">작동 시작 습도 (%)</Label>
                          <Input
                            id="edit-pump2-start"
                            type="number"
                            value={editPreset.settings.waterPump2.startHumidity}
                            onChange={(e) =>
                              updateEditPresetSettings("waterPump2", {
                                ...editPreset.settings.waterPump2,
                                startHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-pump2-end">작동 종료 습도 (%)</Label>
                          <Input
                            id="edit-pump2-end"
                            type="number"
                            value={editPreset.settings.waterPump2.endHumidity}
                            onChange={(e) =>
                              updateEditPresetSettings("waterPump2", {
                                ...editPreset.settings.waterPump2,
                                endHumidity: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        토양 습도가 시작 습도 이하로 떨어지면 작동하고, 종료 습도에 도달하면 정지합니다.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button onClick={saveEditPreset}>
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowEditPreset(false)}>
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
