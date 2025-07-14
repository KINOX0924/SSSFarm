"use client"

import { useState, useMemo } from "react"
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

// 모의 갤러리 데이터 (더 많은 데이터로 타임랩스 효과 확인)
const allPhotos = [
  // 2024-01-09 데이터
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
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "13:45",
  },
  {
    id: 5,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "13:30",
  },
  {
    id: 6,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "13:15",
  },
  {
    id: 7,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "13:00",
  },
  {
    id: 8,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:45",
  },
  {
    id: 9,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:30",
  },
  {
    id: 10,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:15",
  },
  {
    id: 11,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:00",
  },

  // 2024-01-08 데이터
  {
    id: 12,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "18:00",
  },
  {
    id: 13,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "12:00",
  },
  {
    id: 14,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "06:00",
  },

  // 2024-01-07 데이터
  {
    id: 15,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-07",
    time: "18:00",
  },
  {
    id: 16,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-07",
    time: "12:00",
  },
  {
    id: 17,
    deviceId: "greenhouse-1",
    deviceName: "온실 A동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-07",
    time: "06:00",
  },

  // 온실 B동 데이터
  {
    id: 18,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:30",
  },
  {
    id: 19,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:15",
  },
  {
    id: 20,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "14:00",
  },
  {
    id: 21,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "18:00",
  },
  {
    id: 22,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "12:00",
  },
  {
    id: 23,
    deviceId: "greenhouse-2",
    deviceName: "온실 B동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-07",
    time: "18:00",
  },

  // 온실 C동 데이터
  {
    id: 24,
    deviceId: "greenhouse-3",
    deviceName: "온실 C동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-09",
    time: "12:00",
  },
  {
    id: 25,
    deviceId: "greenhouse-3",
    deviceName: "온실 C동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-08",
    time: "12:00",
  },
  {
    id: 26,
    deviceId: "greenhouse-3",
    deviceName: "온실 C동",
    url: "/placeholder.svg?height=300&width=400",
    thumbnail: "/placeholder.svg?height=200&width=300",
    date: "2024-01-07",
    time: "12:00",
  },
]

export default function GalleryPage() {
  const [activeNav, setActiveNav] = useState("gallery")
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [selectedInterval, setSelectedInterval] = useState("all")
  const [startDate, setStartDate] = useState("2024-01-07")
  const [endDate, setEndDate] = useState("2024-01-09")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [gridSize, setGridSize] = useState("medium") // small, medium, large
  const [sortOrder, setSortOrder] = useState("newest") // newest, oldest
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof allPhotos)[0] | null>(null)

  const router = useRouter()

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

  // 시간 간격에 따른 사진 필터링 함수
  const filterByTimeInterval = (photos: typeof allPhotos, intervalMinutes: number) => {
    if (intervalMinutes === 0) return photos // 전체 사진

    const filtered: typeof allPhotos = []
    const photosByDevice: { [key: string]: typeof allPhotos } = {}

    // 기기별로 그룹화
    photos.forEach((photo) => {
      if (!photosByDevice[photo.deviceId]) {
        photosByDevice[photo.deviceId] = []
      }
      photosByDevice[photo.deviceId].push(photo)
    })

    // 각 기기별로 시간 간격 필터링
    Object.values(photosByDevice).forEach((devicePhotos) => {
      const sortedPhotos = devicePhotos.sort((a, b) => {
        const dateTimeA = new Date(`${a.date} ${a.time}`)
        const dateTimeB = new Date(`${b.date} ${b.time}`)
        return dateTimeA.getTime() - dateTimeB.getTime()
      })

      if (sortedPhotos.length > 0) {
        filtered.push(sortedPhotos[0]) // 첫 번째 사진은 항상 포함

        let lastIncludedTime = new Date(`${sortedPhotos[0].date} ${sortedPhotos[0].time}`)

        for (let i = 1; i < sortedPhotos.length; i++) {
          const currentTime = new Date(`${sortedPhotos[i].date} ${sortedPhotos[i].time}`)
          const timeDiff = (currentTime.getTime() - lastIncludedTime.getTime()) / (1000 * 60) // 분 단위

          if (timeDiff >= intervalMinutes) {
            filtered.push(sortedPhotos[i])
            lastIncludedTime = currentTime
          }
        }
      }
    })

    return filtered
  }

  // 필터링된 사진 데이터
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

    // 시간 간격 필터
    const intervalOption = timeIntervals.find((interval) => interval.id === selectedInterval)
    if (intervalOption) {
      filtered = filterByTimeInterval(filtered, intervalOption.minutes)
    }

    // 정렬
    return filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`)
      const dateTimeB = new Date(`${b.date} ${b.time}`)
      return sortOrder === "newest"
        ? dateTimeB.getTime() - dateTimeA.getTime()
        : dateTimeA.getTime() - dateTimeB.getTime()
    })
  }, [selectedDevice, selectedInterval, startDate, endDate, sortOrder])

  // 페이지네이션
  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPhotos = filteredPhotos.slice(startIndex, startIndex + itemsPerPage)

  // 그리드 크기 설정
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

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      alert("로그아웃 되었습니다.")
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
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 text-green-600 text-2xl flex items-center justify-center">🌱</div>
              <h1 className="text-xl font-bold text-gray-900">SSSFarm</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[
                  { id: "dashboard", icon: Home, label: "대시보드" },
                  { id: "presets", icon: Settings, label: "프리셋설정" },
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">생장 갤러리</h2>
            <p className="text-gray-600">작물의 성장 과정을 시각적으로 확인하고 관리하세요</p>
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
                {/* 기기 선택 */}
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

                {/* 시간 간격 */}
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

                {/* 시작 날짜 */}
                <div>
                  <label className="block text-sm font-medium mb-2">시작 날짜</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                {/* 종료 날짜 */}
                <div>
                  <label className="block text-sm font-medium mb-2">종료 날짜</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                {/* 액션 버튼 */}
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* 정렬 */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                </SelectContent>
              </Select>

              {/* 그리드 크기 */}
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

              {/* 타임랩스 안내 */}
            </div>

            {/* 결과 요약 */}
            <div className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredPhotos.length}</span>장의 사진
              {selectedDevice !== "all" && <span> - {devices.find((d) => d.id === selectedDevice)?.name}</span>}
              {selectedInterval !== "all" && (
                <span> ({timeIntervals.find((i) => i.id === selectedInterval)?.name})</span>
              )}
            </div>
          </div>

          {/* Photo Grid */}
          <div className={`grid ${getGridClass()} gap-4 mb-6`}>
            {paginatedPhotos.map((photo) => {
              return (
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
              )
            })}
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
                {(() => {
                  const pages = []
                  const maxVisiblePages = 5
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                  // 끝 페이지가 총 페이지보다 작으면 시작 페이지를 조정
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </Button>,
                    )
                  }
                  return pages
                })()}
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
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          {selectedPhoto && (
            <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{selectedPhoto.deviceName}</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Photo Display */}
              <div className="flex-1 relative bg-black">
                <img
                  src={selectedPhoto.url || "/placeholder.svg"}
                  alt={selectedPhoto.deviceName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Photo Info */}
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
