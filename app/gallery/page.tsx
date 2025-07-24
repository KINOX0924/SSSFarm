"use client"

import { useState, useEffect } from "react"
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
  Grid3X3,
  Maximize2,
  X,
  AlertCircle,
  Download,
  Eye,
  Play,
  Pause,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useGalleryImages, useGalleryFilters, useImageSlideshow } from "@/hooks/useGallery"

// 시간 간격 옵션
const timeIntervals = [
  { id: "all", name: "전체 사진", minutes: 0 },
  { id: "15min", name: "15분 간격", minutes: 15 },
  { id: "1hour", name: "1시간 간격", minutes: 60 },
  { id: "6hour", name: "6시간 간격", minutes: 360 },
  { id: "1day", name: "1일 간격", minutes: 1440 },
]

export default function GalleryPage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("gallery")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // 갤러리 상태
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid")
  
  // API 훅 사용
  const { images, devices, loading: imagesLoading, error: imagesError, refetch } = useGalleryImages(300000) // 5분마다 자동 갱신
  
  // 필터 훅 사용
  const { filteredImages, filters, updateFilter, resetFilters } = useGalleryFilters(images)
  
  // 슬라이드쇼 훅 사용
  const { 
    currentImage, 
    currentIndex, 
    isPlaying, 
    setIsPlaying, 
    nextImage, 
    prevImage, 
    goToImage 
  } = useImageSlideshow(filteredImages)

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

  // 이미지 다운로드
  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = imageName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드에 실패했습니다.')
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
              <div className={`w-2 h-2 rounded-full ${images.length > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={images.length > 0 ? 'API 연결됨' : 'API 연결 끊어짐'} />
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
                onClick={refetch}
                className="gap-2"
                disabled={imagesLoading}
              >
                <RefreshCw className={`w-4 h-4 ${imagesLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>

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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">갤러리</h2>
            <p className="text-gray-600">식물 성장 과정을 시각적으로 확인하세요 (5분마다 자동 갱신)</p>
          </div>

          {/* Error Messages */}
          {imagesError && <ErrorAlert error={imagesError} onRetry={refetch} />}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                필터 옵션
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 기기 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">기기</label>
                  <Select 
                    value={filters.deviceId?.toString() || "all"} 
                    onValueChange={(value) => updateFilter('deviceId', value === 'all' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="기기 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 기기</SelectItem>
                      {devices.map((device) => (
                        <SelectItem key={device.device_id} value={device.device_id.toString()}>
                          {device.device_name}
                          {device.location && <span className="text-xs text-gray-500"> ({device.location})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 시간 간격 */}
                <div>
                  <label className="block text-sm font-medium mb-2">시간 간격</label>
                  <Select 
                    value={filters.timeInterval.toString()} 
                    onValueChange={(value) => updateFilter('timeInterval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeIntervals.map((interval) => (
                        <SelectItem key={interval.id} value={interval.minutes.toString()}>
                          {interval.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 시작 날짜 */}
                <div>
                  <label className="block text-sm font-medium mb-2">시작 날짜</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                  />
                </div>

                {/* 종료 날짜 */}
                <div>
                  <label className="block text-sm font-medium mb-2">종료 날짜</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                  />
                </div>

                {/* 검색 */}
                <div>
                  <label className="block text-sm font-medium mb-2">검색</label>
                  <Input
                    placeholder="기기명, 위치 검색..."
                    value={filters.searchTerm}
                    onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  총 {filteredImages.length}개의 사진 (전체 {images.length}개)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      그리드
                    </Button>
                    <Button
                      variant={viewMode === "large" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("large")}
                    >
                      <Maximize2 className="w-4 h-4" />
                      슬라이드쇼
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 콘텐츠 표시 */}
          {imagesLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">이미지를 불러오는 중...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">사진이 없습니다</h3>
              <p className="text-gray-500">
                {images.length === 0 
                  ? "아직 촬영된 사진이 없습니다. 기기에서 사진이 촬영되면 자동으로 표시됩니다."
                  : "필터 조건에 맞는 사진이 없습니다. 필터를 조정해보세요."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {filteredImages.map((image, index) => (
                    <Card 
                      key={image.image_id} 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                      onClick={() => {
                        setSelectedImage(image)
                        goToImage(index)
                      }}
                    >
                      <div className="relative aspect-square">
                        <img
                          src={image.full_url}
                          alt={`${image.device_name} - ${new Date(image.captured_at).toLocaleDateString()}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">{image.device_name}</p>
                          <p className="text-white text-xs opacity-75">
                            {new Date(image.captured_at).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Large View - 슬라이드쇼 */}
              {viewMode === "large" && currentImage && (
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{currentImage.device_name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {new Date(currentImage.captured_at).toLocaleString('ko-KR')}
                          {currentImage.device_location && ` • ${currentImage.device_location}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {currentIndex + 1} / {filteredImages.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? '일시정지' : '재생'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(
                            currentImage.full_url, 
                            `${currentImage.device_name}_${new Date(currentImage.captured_at).toISOString().split('T')[0]}.jpg`
                          )}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          다운로드
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <img
                        src={currentImage.full_url}
                        alt={`${currentImage.device_name} - ${new Date(currentImage.captured_at).toLocaleDateString()}`}
                        className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                      />
                      
                      {/* 이전/다음 버튼 */}
                      {filteredImages.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* 썸네일 네비게이션 */}
                    {filteredImages.length > 1 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {filteredImages.map((image, index) => (
                          <button
                            key={image.image_id}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              index === currentIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => goToImage(index)}
                          >
                            <img
                              src={image.thumbnail_url || image.full_url}
                              alt="썸네일"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* 이미지 상세 모달 */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" hideCloseButton>
          <DialogTitle className="sr-only">이미지 상세 보기</DialogTitle>
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedImage.device_name}</h3>
                  <p className="text-sm text-gray-600">
                    촬영일시: {new Date(selectedImage.captured_at).toLocaleString('ko-KR')}
                  </p>
                  {selectedImage.device_location && (
                    <p className="text-sm text-gray-600">위치: {selectedImage.device_location}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(
                      selectedImage.full_url,
                      `${selectedImage.device_name}_${new Date(selectedImage.captured_at).toISOString().split('T')[0]}.jpg`
                    )}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    다운로드
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    닫기
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={selectedImage.full_url}
                  alt={`${selectedImage.device_name} - ${new Date(selectedImage.captured_at).toLocaleDateString()}`}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
