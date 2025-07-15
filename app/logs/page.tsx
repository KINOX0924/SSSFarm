"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Home,
  Settings,
  ImageIcon,
  FileText,
  LogOut,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

// 기기 데이터
const devices = [
  { id: "all", name: "전체 기기" },
  { id: "greenhouse-1", name: "온실 A동" },
  { id: "greenhouse-2", name: "온실 B동" },
  { id: "greenhouse-3", name: "온실 C동" },
]

// 로그 데이터
const allLogs = [
  {
    id: 1,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    date: "2024-01-09",
    time: "14:30",
    trigger: "토양습도 센서 임계값 도달 알림 (42% 이하)",
    action: "토마토 화분 급수 시작 (습도 42% → 70%)",
  },
  {
    id: 2,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    date: "2024-01-09",
    time: "13:15",
    trigger: "자동 스케줄러 시간 기반 제어 실행",
    action: "LED 조명 자동 점등",
  },
  {
    id: 3,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    date: "2024-01-09",
    time: "12:00",
    trigger: "조도 센서 측정값 기준치 초과 감지",
    action: "조도 850lux 감지, 환기팬 작동",
  },
  {
    id: 4,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    date: "2024-01-09",
    time: "14:25",
    trigger: "물탱크 수위 센서 저수위 경고 발생",
    action: "물 잔량 34% 경고 알림",
  },
  {
    id: 5,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    date: "2024-01-09",
    time: "13:50",
    trigger: "습도 센서 적정 범위 유지 확인",
    action: "습도 58% 적정 수준 유지",
  },
  {
    id: 6,
    deviceId: "greenhouse-3",
    deviceName: "온실 C동",
    date: "2024-01-09",
    time: "14:00",
    trigger: "시스템 네트워크 연결 상태 오류",
    action: "네트워크 연결 끊어짐",
  },
]

export default function LogsPage() {
  // 모든 useState 훅을 최상단에 선언
  const [activeNav, setActiveNav] = useState("logs")
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [startDate, setStartDate] = useState("2024-01-08")
  const [endDate, setEndDate] = useState("2024-01-09")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  // useEffect 훅
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

  // useMemo 훅
  const filteredLogs = useMemo(() => {
    let filtered = allLogs

    // 기기 필터
    if (selectedDevice !== "all") {
      filtered = filtered.filter((log) => log.deviceId === selectedDevice)
    }

    // 날짜 범위 필터
    filtered = filtered.filter((log) => {
      return log.date >= startDate && log.date <= endDate
    })

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.deviceName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 시간순 정렬 (최신순)
    return filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`)
      const dateTimeB = new Date(`${b.date} ${b.time}`)
      return dateTimeB.getTime() - dateTimeA.getTime()
    })
  }, [selectedDevice, startDate, endDate, searchTerm])

  // 로딩 화면
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

  // 일반 함수들
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

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  const handleExport = () => {
    const csvContent = [
      ["날짜", "시간", "기기", "트리거", "작동내용"],
      ...filteredLogs.map((log) => [log.date, log.time, log.deviceName, log.trigger, log.action]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `logs_${startDate}_${endDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = () => {
    console.log("로그 새로고침")
    alert("로그가 새로고침되었습니다.")
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">시스템 로그</h2>
            <p className="text-gray-600">기기별 활동 로그 및 시스템 이벤트 조회</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                필터 및 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">기기 선택</label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">시작 날짜</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">종료 날짜</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">검색</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="트리거, 작동내용 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">액션</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefresh}
                      size="default"
                      variant="outline"
                      className="flex-1 bg-transparent h-10"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleExport}
                      size="default"
                      variant="outline"
                      className="flex-1 bg-transparent h-10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredLogs.length}</span>개의 로그
              {selectedDevice !== "all" && <span> - {devices.find((d) => d.id === selectedDevice)?.name}</span>}
            </div>
            <div className="text-sm text-gray-600">
              {startDate} ~ {endDate}
            </div>
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-44">날짜/시간</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-36">기기</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-80">트리거</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">작동내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 w-44 align-top">
                            <span className="text-sm font-medium text-gray-900">
                              {log.date} {log.time}
                            </span>
                          </td>
                          <td className="py-3 px-4 w-36 align-top">
                            <span className="text-sm font-medium text-gray-900 break-words">{log.deviceName}</span>
                          </td>
                          <td className="py-3 px-4 w-80 align-top">
                            <span className="text-sm text-gray-700 break-words leading-relaxed">{log.trigger}</span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="text-sm text-gray-700 break-words leading-relaxed">{log.action}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                          조건에 맞는 로그가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
