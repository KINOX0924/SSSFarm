"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Home,
  Settings,
  ImageIcon,
  FileText,
  LogOut,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Grid3X3,
  Grid2X2,
  Maximize2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

// 기기 데이터
const devices = [
  { id: "all", name: "전체 기기" },
  { id: "greenhouse-1", name: "온실 A동" },
  { id: "greenhouse-2", name: "온실 B동" },
  { id: "greenhouse-3", name: "온실 C동" },
]

// 시간 간격 옵션
const timeIntervals = [
  { id: "all", name: "전체 사진", minutes: 0 },
  { id: "15min", name: "15분 간격", minutes: 15 },
  { id: "1hour", name: "1시간 간격", minutes: 60 },
  { id: "6hour", name: "6시간 간격", minutes: 360 },
  { id: "1day", name: "1일 간격", minutes: 1440 },
]

// 모의 갤러리 데이터
const allPhotos = [
  {
    id: 1,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:30",
  },
  {
    id: 2,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:15",
  },
  {
    id: 3,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:00",
  },
  {
    id: 4,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:30",
  },
  {
    id: 5,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:15",
  },
  {
    id: 6,
    deviceId: "greenhouse-3",
    deviceName: "온실 C동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:00",
  },
]

export default function GalleryPage() {
  // useState 훅들을 최상단에 선언
  const [activeNav, setActiveNav] = useState("gallery")
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [selectedInterval, setSelectedInterval] = useState("all")
  const [startDate, setStartDate] = useState("2024-01-07")
  const [endDate, setEndDate] = useState("2024-01-09")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [gridSize, setGridSize] = useState("medium")
  const [sortOrder, setSortOrder] = useState("newest")
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof allPhotos)[0] | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  // useEffect 훅들
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
  const filteredPhotos = useMemo(() => {
    let filtered = allPhotos

    // 기기 필터
    if (selectedDevice !== "all") {
      filtered = filtered.filter((photo) => photo.deviceId === selectedDevice)
    }

    // 날짜 범위 필터
    filtered = filtered.filter((photo) => {
      return photo.date >= startDate && photo.date <= endDate
    })

    // 정렬
    return filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`)
      const dateTimeB = new Date(`${b.date} ${b.time}`)
      return sortOrder === "newest"
        ? dateTimeB.getTime() - dateTimeA.getTime()
        : dateTimeA.getTime() - dateTimeB.getTime()
    })
  }, [selectedDevice, selectedInterval, startDate, endDate, sortOrder])

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

  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPhotos = filteredPhotos.slice(startIndex, startIndex + itemsPerPage)

  const getGridClass = () => {
    switch (gridSize) {
      case "small":
        return "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
      case "large":
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      default:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    }
  }

  const handleRefresh = () => {
    console.log("갤러리 새로고침")
    alert("갤러리가 새로고침되었습니다.")
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
      <main className="py-2 px-3">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">생장 갤러리</h2>
            <p className="text-gray-600">작물의 성장 과정을 시각적으로 확인하고 관리하세요</p>
          </div>

          {/* Filters */}
          <Card className="mb-3">
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
                  <label className="block text-sm font-medium mb-2">시간 간격</label>
                  <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeIntervals.map((interval) => (
                        <SelectItem key={interval.id} value={interval.id}>
                          {interval.name}
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
                  <label className="block text-sm font-medium mb-2">액션</label>
                  <Button
                    onClick={handleRefresh}
                    size="default"
                    variant="outline"
                    className="w-full bg-transparent h-10"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant={gridSize === "small" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridSize("small")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={gridSize === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridSize("medium")}
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={gridSize === "large" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridSize("large")}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredPhotos.length}</span>장의 사진
              {selectedDevice !== "all" && <span> - {devices.find((d) => d.id === selectedDevice)?.name}</span>}
            </div>
          </div>

          {/* Photo Grid */}
          <div className={`grid ${getGridClass()} gap-4 mb-4`}>
            {paginatedPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative">
                  <img
                    src={photo.thumbnail || "/placeholder.svg"}
                    alt="농장 사진"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{photo.deviceName}</span>
                    <span>
                      {photo.date} {photo.time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {paginatedPhotos.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">사진이 없습니다</h3>
              <p className="text-gray-500">조건에 맞는 사진을 찾을 수 없습니다.</p>
            </div>
          )}

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

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 [&>button]:hidden">
          {selectedPhoto && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{selectedPhoto.deviceName}</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 relative bg-black">
                <img
                  src={selectedPhoto.url || "/placeholder.svg"}
                  alt={selectedPhoto.deviceName}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedPhoto.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedPhoto.time}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{selectedPhoto.deviceName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
