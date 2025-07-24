"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Home,
  Settings,
  ImageIcon,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Wifi,
  WifiOff,
  Droplets,
  Lightbulb,
  Fan,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { usePresets, useDevices } from "@/hooks/useSettings"
import { isAuthenticated, getStoredToken, getStoredUserInfo, logout as apiLogout } from "@/lib/api/auth"

export default function PresetsPage() {
  const router = useRouter()
  
  const { 
    presets, 
    loading: presetsLoading, 
    error: presetsError, 
    addPreset, 
    editPreset, 
    removePreset, 
    applyPreset,
    fetchPresets
  } = usePresets()
  
  const { 
    devices, 
    loading: devicesLoading, 
    error: devicesError, 
    addDevice, 
    deleteDevice,
    fetchDevices
  } = useDevices()

  const [activeNav, setActiveNav] = useState("presets")
  const [activeTab, setActiveTab] = useState("devices")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false)
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPresetDeleteDialogOpen, setIsPresetDeleteDialogOpen] = useState(false)

  const [editingPreset, setEditingPreset] = useState<any>(null)
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [selectedPreset, setSelectedPreset] = useState<any>(null)

  const [newDevice, setNewDevice] = useState({ name: "", location: "", ip: "" })
  const [newPreset, setNewPreset] = useState({
    name: "",
    settings: {
      ledLight: { 
        enabled: false, 
        timeControl: false,
        lightControl: true,
        startTime: "06:00",
        endTime: "18:00",
        lightThreshold: 300 
      },
      ventilationFan: { 
        enabled: false, 
        startTemperature: 28,
        endTemperature: 22
      },
      waterPump1: { 
        enabled: false, 
        startHumidity: 40,
        endHumidity: 70,
        name: "급수펌프 1"
      },
      waterPump2: { 
        enabled: false, 
        startHumidity: 35,
        endHumidity: 65,
        name: "급수펌프 2"
      }
    }
  })

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      if (!authenticated) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
        // API 데이터 초기 로드
        fetchDevices()
        fetchPresets()
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [router, fetchDevices, fetchPresets])

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

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        const token = getStoredToken()
        if (token) await apiLogout(token)
        alert("로그아웃 되었습니다.")
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
        alert("로그아웃 되었습니다.")
        router.push('/login')
      }
    }
  }

  const handleRefresh = () => {
    fetchDevices()
    fetchPresets()
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar - 기존 대시보드와 동일한 디자인 */}
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
                disabled={devicesLoading || presetsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${(devicesLoading || presetsLoading) ? 'animate-spin' : ''}`} />
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

      {/* Main Content - 기존 대시보드와 동일한 레이아웃 */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header - 기존과 동일한 스타일 */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">설정 관리</h2>
              <p className="text-gray-600">기기 등록 및 프리셋 관리</p>
            </div>
          </div>

          {/* Error Messages */}
          {devicesError && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{devicesError}</AlertDescription>
            </Alert>
          )}
          {presetsError && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{presetsError}</AlertDescription>
            </Alert>
          )}
          
          {/* 디버그 정보 */}
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              디버그: 프리셋 {presets?.length || 0}개, 기기 {devices?.length || 0}개 로드됨. 
              로딩: {presetsLoading ? 'Y' : 'N'}, 에러: {presetsError ? 'Y' : 'N'}
              <br />
              사용자 ID: {getStoredUserInfo()?.id || 'N/A'}, 토큰: {getStoredToken() ? '있음' : '없음'}
            </AlertDescription>
          </Alert>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <Button
                  variant="ghost"
                  className={`border-b-2 rounded-none py-4 ${
                    activeTab === "devices" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveTab("devices")}
                >
                  기기 관리
                </Button>
                <Button
                  variant="ghost"
                  className={`border-b-2 rounded-none py-4 ${
                    activeTab === "presets" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveTab("presets")}
                >
                  프리셋 관리
                </Button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "devices" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">등록된 기기</h3>
                <Button onClick={() => setIsDeviceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  기기 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices?.map((device) => (
                  <Card key={device.device_id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{device.device_name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {device.last_active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Wifi className="w-3 h-3 mr-1" />
                              온라인
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <WifiOff className="w-3 h-3 mr-1" />
                              오프라인
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => {
                              setSelectedDevice(device)
                              setIsDeleteDialogOpen(true)
                            }}
                            title="기기 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div><strong>위치:</strong> {device.location || 'N/A'}</div>
                        <div><strong>MAC 주소:</strong> {device.device_serial}</div>
                        <div className="flex items-center"><strong>타입:</strong> 
                          <Badge variant="outline" className="ml-2">
                            {device.device_type === 'local' ? '로컬' : 'API'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!devices || devices.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    등록된 기기가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "presets" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">저장된 프리셋</h3>
                <Button onClick={() => setIsPresetDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  프리셋 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets?.map((preset) => (
                  <Card key={preset.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{preset.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={
                            preset.source === 'api' 
                              ? "text-blue-600 border-blue-600" 
                              : "text-orange-600 border-orange-600"
                          }>
                            {preset.source === 'api' ? 'API' : '로컬'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditingPreset({ ...preset })
                              setIsPresetDialogOpen(true)
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => {
                              setSelectedPreset(preset)
                              setIsPresetDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">LED</span>
                          </div>
                          <Badge variant={preset.settings.ledLight.enabled ? "default" : "secondary"}>
                            {preset.settings.ledLight.enabled ? "ON" : "OFF"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Fan className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">환기팬</span>
                          </div>
                          <Badge variant={preset.settings.ventilationFan.enabled ? "default" : "secondary"}>
                            {preset.settings.ventilationFan.enabled ? "ON" : "OFF"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">급수펌프</span>
                          </div>
                          <div className="flex space-x-1">
                            <Badge variant={preset.settings.waterPump1.enabled ? "default" : "secondary"} className="text-xs">
                              1
                            </Badge>
                            <Badge variant={preset.settings.waterPump2.enabled ? "default" : "secondary"} className="text-xs">
                              2
                            </Badge>
                          </div>
                        </div>

                        {devices && devices.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-2">기기에 적용:</p>
                            <div className="flex flex-wrap gap-1">
                              {devices.slice(0, 2).map((device) => (
                                <Button
                                  key={device.device_id}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={async () => {
                                    try {
                                      await applyPreset(preset.id, device.device_id)
                                      alert("프리셋이 기기에 적용되었습니다.")
                                    } catch (error) {
                                      alert("프리셋 적용에 실패했습니다.")
                                    }
                                  }}
                                  disabled={preset.source === 'local'}
                                >
                                  {device.device_name}
                                </Button>
                              ))}
                              {devices.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{devices.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!presets || presets.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    등록된 프리셋이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 기기 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="device-name">기기 이름</Label>
              <Input
                id="device-name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="예: 온실 A동"
              />
            </div>
            <div>
              <Label htmlFor="device-location">위치</Label>
              <Input
                id="device-location"
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                placeholder="예: 1층 동쪽"
              />
            </div>
            <div>
              <Label htmlFor="device-ip">MAC 주소</Label>
              <Input
                id="device-ip"
                value={newDevice.ip}
                onChange={(e) => setNewDevice({ ...newDevice, ip: e.target.value })}
                placeholder="예: AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeviceDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={async () => {
                if (!newDevice.name.trim() || !newDevice.location.trim() || !newDevice.ip.trim()) {
                  alert("모든 필드를 입력해주세요.")
                  return
                }
                try {
                  await addDevice(newDevice)
                  setNewDevice({ name: "", location: "", ip: "" })
                  setIsDeviceDialogOpen(false)
                  alert("기기가 추가되었습니다.")
                } catch (error) {
                  alert("기기 추가에 실패했습니다.")
                }
              }}>
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "프리셋 편집" : "새 프리셋 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="preset-name">프리셋 이름</Label>
              <Input
                id="preset-name"
                value={editingPreset ? editingPreset.name : newPreset.name}
                onChange={(e) => {
                  if (editingPreset) {
                    setEditingPreset({ ...editingPreset, name: e.target.value })
                  } else {
                    setNewPreset({ ...newPreset, name: e.target.value })
                  }
                }}
                placeholder="예: 여름 모드"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-medium">LED 설정</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="led-enabled">LED 사용</Label>
                  <Switch
                    id="led-enabled"
                    checked={editingPreset ? editingPreset.settings.ledLight.enabled : newPreset.settings.ledLight.enabled}
                    onCheckedChange={(checked) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, enabled: checked }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="led-time-control">시간 제어</Label>
                  <Switch
                    id="led-time-control"
                    checked={editingPreset ? editingPreset.settings.ledLight.timeControl : newPreset.settings.ledLight.timeControl}
                    onCheckedChange={(checked) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, timeControl: checked }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="led-light-control">조도 제어</Label>
                  <Switch
                    id="led-light-control"
                    checked={editingPreset ? editingPreset.settings.ledLight.lightControl : newPreset.settings.ledLight.lightControl}
                    onCheckedChange={(checked) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, lightControl: checked }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="light-threshold">조도 임계값</Label>
                  <Input
                    id="light-threshold"
                    type="number"
                    value={editingPreset ? editingPreset.settings.ledLight.lightThreshold : newPreset.settings.ledLight.lightThreshold}
                    onChange={(e) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, lightThreshold: parseInt(e.target.value) || 0 }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="led-start-time">시작 시간</Label>
                  <Input
                    id="led-start-time"
                    type="time"
                    value={editingPreset ? editingPreset.settings.ledLight.startTime : newPreset.settings.ledLight.startTime}
                    onChange={(e) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, startTime: e.target.value }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="led-end-time">종료 시간</Label>
                  <Input
                    id="led-end-time"
                    type="time"
                    value={editingPreset ? editingPreset.settings.ledLight.endTime : newPreset.settings.ledLight.endTime}
                    onChange={(e) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ledLight: { ...settings.ledLight, endTime: e.target.value }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Fan className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-medium">환기팬 설정</h3>
              </div>
              
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fan-enabled">환기팬 사용</Label>
                  <Switch
                    id="fan-enabled"
                    checked={editingPreset ? editingPreset.settings.ventilationFan.enabled : newPreset.settings.ventilationFan.enabled}
                    onCheckedChange={(checked) => {
                      const settings = editingPreset ? editingPreset.settings : newPreset.settings
                      const updatedSettings = {
                        ...settings,
                        ventilationFan: { ...settings.ventilationFan, enabled: checked }
                      }
                      if (editingPreset) {
                        setEditingPreset({ ...editingPreset, settings: updatedSettings })
                      } else {
                        setNewPreset({ ...newPreset, settings: updatedSettings })
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fan-start-temp">시작 온도 (°C)</Label>
                    <Input
                      id="fan-start-temp"
                      type="number"
                      value={editingPreset ? editingPreset.settings.ventilationFan.startTemperature : newPreset.settings.ventilationFan.startTemperature}
                      onChange={(e) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          ventilationFan: { ...settings.ventilationFan, startTemperature: parseInt(e.target.value) || 0 }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fan-end-temp">종료 온도 (°C)</Label>
                    <Input
                      id="fan-end-temp"
                      type="number"
                      value={editingPreset ? editingPreset.settings.ventilationFan.endTemperature : newPreset.settings.ventilationFan.endTemperature}
                      onChange={(e) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          ventilationFan: { ...settings.ventilationFan, endTemperature: parseInt(e.target.value) || 0 }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium">급수펌프 설정</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">급수펌프 1</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pump1-enabled">사용</Label>
                    <Switch
                      id="pump1-enabled"
                      checked={editingPreset ? editingPreset.settings.waterPump1.enabled : newPreset.settings.waterPump1.enabled}
                      onCheckedChange={(checked) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          waterPump1: { ...settings.waterPump1, enabled: checked }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pump1-name">이름</Label>
                    <Input
                      id="pump1-name"
                      value={editingPreset ? editingPreset.settings.waterPump1.name : newPreset.settings.waterPump1.name}
                      onChange={(e) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          waterPump1: { ...settings.waterPump1, name: e.target.value }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pump1-start">시작 습도 (%)</Label>
                    <Input
                      id="pump1-start"
                      type="number"
                      value={editingPreset ? editingPreset.settings.waterPump1.startHumidity : newPreset.settings.waterPump1.startHumidity}
                      onChange={(e) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          waterPump1: { ...settings.waterPump1, startHumidity: parseInt(e.target.value) || 0 }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pump1-end">종료 습도 (%)</Label>
                    <Input
                      id="pump1-end"
                      type="number"
                      value={editingPreset ? editingPreset.settings.waterPump1.endHumidity : newPreset.settings.waterPump1.endHumidity}
                      onChange={(e) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          waterPump1: { ...settings.waterPump1, endHumidity: parseInt(e.target.value) || 0 }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">급수펌프 2</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pump2-enabled">사용</Label>
                    <Switch
                      id="pump2-enabled"
                      checked={editingPreset ? editingPreset.settings.waterPump2.enabled : newPreset.settings.waterPump2.enabled}
                      onCheckedChange={(checked) => {
                        const settings = editingPreset ? editingPreset.settings : newPreset.settings
                        const updatedSettings = {
                          ...settings,
                          waterPump2: { ...settings.waterPump2, enabled: checked }
                        }
                        if (editingPreset) {
                          setEditingPreset({ ...editingPreset, settings: updatedSettings })
                        } else {
                          setNewPreset({ ...newPreset, settings: updatedSettings })}
                     }}
                   />
                 </div>
                 <div>
                   <Label htmlFor="pump2-name">이름</Label>
                   <Input
                     id="pump2-name"
                     value={editingPreset ? editingPreset.settings.waterPump2.name : newPreset.settings.waterPump2.name}
                     onChange={(e) => {
                       const settings = editingPreset ? editingPreset.settings : newPreset.settings
                       const updatedSettings = {
                         ...settings,
                         waterPump2: { ...settings.waterPump2, name: e.target.value }
                       }
                       if (editingPreset) {
                         setEditingPreset({ ...editingPreset, settings: updatedSettings })
                       } else {
                         setNewPreset({ ...newPreset, settings: updatedSettings })
                       }
                     }}
                   />
                 </div>
                 <div>
                   <Label htmlFor="pump2-start">시작 습도 (%)</Label>
                   <Input
                     id="pump2-start"
                     type="number"
                     value={editingPreset ? editingPreset.settings.waterPump2.startHumidity : newPreset.settings.waterPump2.startHumidity}
                     onChange={(e) => {
                       const settings = editingPreset ? editingPreset.settings : newPreset.settings
                       const updatedSettings = {
                         ...settings,
                         waterPump2: { ...settings.waterPump2, startHumidity: parseInt(e.target.value) || 0 }
                       }
                       if (editingPreset) {
                         setEditingPreset({ ...editingPreset, settings: updatedSettings })
                       } else {
                         setNewPreset({ ...newPreset, settings: updatedSettings })
                       }
                     }}
                   />
                 </div>
                 <div>
                   <Label htmlFor="pump2-end">종료 습도 (%)</Label>
                   <Input
                     id="pump2-end"
                     type="number"
                     value={editingPreset ? editingPreset.settings.waterPump2.endHumidity : newPreset.settings.waterPump2.endHumidity}
                     onChange={(e) => {
                       const settings = editingPreset ? editingPreset.settings : newPreset.settings
                       const updatedSettings = {
                         ...settings,
                         waterPump2: { ...settings.waterPump2, endHumidity: parseInt(e.target.value) || 0 }
                       }
                       if (editingPreset) {
                         setEditingPreset({ ...editingPreset, settings: updatedSettings })
                       } else {
                         setNewPreset({ ...newPreset, settings: updatedSettings })
                       }
                     }}
                   />
                 </div>
               </div>
             </div>
           </div>

           <div className="flex justify-end space-x-2">
             <Button variant="outline" onClick={() => {
               setIsPresetDialogOpen(false)
               setEditingPreset(null)
             }}>
               취소
             </Button>
             <Button onClick={async () => {
               const preset = editingPreset || newPreset
               if (!preset.name.trim()) {
                 alert("프리셋 이름을 입력해주세요.")
                 return
               }
               try {
                 if (editingPreset) {
                   await editPreset(editingPreset.id, editingPreset)
                   alert("프리셋이 수정되었습니다.")
                 } else {
                   await addPreset(newPreset)
                   setNewPreset({
                     name: "",
                     settings: {
                       ledLight: { 
                         enabled: false, 
                         timeControl: false,
                         lightControl: true,
                         startTime: "06:00",
                         endTime: "18:00",
                         lightThreshold: 300 
                       },
                       ventilationFan: { 
                         enabled: false, 
                         startTemperature: 28,
                         endTemperature: 22
                       },
                       waterPump1: { 
                         enabled: false, 
                         startHumidity: 40,
                         endHumidity: 70,
                         name: "급수펌프 1"
                       },
                       waterPump2: { 
                         enabled: false, 
                         startHumidity: 35,
                         endHumidity: 65,
                         name: "급수펌프 2"
                       }
                     }
                   })
                   alert("프리셋이 추가되었습니다.")
                 }
                 setIsPresetDialogOpen(false)
                 setEditingPreset(null)
               } catch (error) {
                 alert("프리셋 저장에 실패했습니다.")
               }
             }}>
               {editingPreset ? "수정" : "추가"}
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>

     <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>기기 삭제</DialogTitle>
         </DialogHeader>
         <div className="space-y-3">
           <p>정말로 이 기기를 삭제하시겠습니까?</p>
           <p className="text-sm text-gray-600">
             <strong>{selectedDevice?.device_name}</strong> - {selectedDevice?.location}
           </p>
           {selectedDevice?.device_type === 'local' ? (
             <p className="text-sm text-blue-600">
               📝 로컬 기기는 이 브라우저에서만 삭제됩니다.
             </p>
           ) : (
             <p className="text-sm text-orange-600">
               ⚠️ API 기기는 로컬에서만 삭제되며, 서버에서는 유지됩니다.
             </p>
           )}
         </div>
         <div className="flex justify-end space-x-2">
           <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
             취소
           </Button>
           <Button variant="destructive" onClick={async () => {
             if (selectedDevice) {
               try {
                 await deleteDevice(selectedDevice.device_id)
                 setIsDeleteDialogOpen(false)
                 setSelectedDevice(null)
                 alert("기기가 삭제되었습니다.")
               } catch (error) {
                 alert("기기 삭제에 실패했습니다.")
               }
             }
           }}>
             삭제
           </Button>
         </div>
       </DialogContent>
     </Dialog>

     <Dialog open={isPresetDeleteDialogOpen} onOpenChange={setIsPresetDeleteDialogOpen}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>프리셋 삭제</DialogTitle>
         </DialogHeader>
         <p>정말로 이 프리셋을 삭제하시겠습니까?</p>
         <p className="text-sm text-gray-600">
           <strong>{selectedPreset?.name}</strong>
         </p>
         <div className="flex justify-end space-x-2">
           <Button variant="outline" onClick={() => setIsPresetDeleteDialogOpen(false)}>
             취소
           </Button>
           <Button variant="destructive" onClick={async () => {
             if (selectedPreset) {
               try {
                 await removePreset(selectedPreset.id)
                 setIsPresetDeleteDialogOpen(false)
                 setSelectedPreset(null)
                 alert("프리셋이 삭제되었습니다.")
               } catch (error) {
                 alert("프리셋 삭제에 실패했습니다.")
               }
             }
           }}>
             삭제
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   </div>
 )
}
                          