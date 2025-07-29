import { useState, useEffect, useCallback } from 'react'
import { 
  getAllImages, 
  getDeviceImages, 
  filterImagesByDevice,
  filterImagesByDateTimeRange,
  transformToGalleryImages,
  GalleryImage 
} from '@/lib/api/gallery'
import { Device } from '@/lib/api/types'
import { get } from '@/lib/api/client'

/**
 * 갤러리 이미지 목록 관리 훅
 */
export function useGalleryImages(refreshInterval = 300000) { // 5분마다 자동 갱신
  const [images, setImages] = useState<GalleryImage[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 기기 목록 가져오기
  const fetchDevices = useCallback(async () => {
    try {
      const deviceList = await get<Device[]>('/devices/')
      setDevices(deviceList)
      return deviceList
    } catch (err) {
      console.error('Failed to fetch devices:', err)
      throw new Error('기기 목록을 불러오는데 실패했습니다')
    }
  }, [])

  // 이미지 목록 가져오기
  const fetchImages = useCallback(async () => {
    try {
      setError(null)
      const imageList = await getAllImages()
      const galleryImages = transformToGalleryImages(imageList)
      setImages(galleryImages)
      return galleryImages
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이미지를 불러오는데 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchDevices(), fetchImages()])
      } catch (err) {
        console.error('Failed to load initial gallery data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [fetchDevices, fetchImages])

  // 자동 갱신
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return

    const interval = setInterval(() => {
      fetchImages().catch(err => {
        console.error('Auto refresh failed:', err)
      })
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchImages, refreshInterval])

  // 수동 새로고침
  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchDevices(), fetchImages()])
    } finally {
      setLoading(false)
    }
  }, [fetchDevices, fetchImages])

  return {
    images,
    devices,
    loading,
    error,
    refetch
  }
}

/**
 * 특정 기기의 이미지 관리 훅
 */
export function useDeviceImages(deviceId: number | null, refreshInterval = 300000) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    if (!deviceId) {
      setImages([])
      return []
    }

    try {
      setError(null)
      setLoading(true)
      const imageList = await getDeviceImages(deviceId)
      const galleryImages = transformToGalleryImages(imageList)
      setImages(galleryImages)
      return galleryImages
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이미지를 불러오는데 실패했습니다'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  // 기기 변경 시 이미지 로드
  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // 자동 갱신
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !deviceId) return

    const interval = setInterval(() => {
      fetchImages().catch(err => {
        console.error('Auto refresh failed:', err)
      })
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchImages, refreshInterval, deviceId])

  return {
    images,
    loading,
    error,
    refetch: fetchImages
  }
}

/**
 * 갤러리 필터 관리 훅
 */
export function useGalleryFilters(images: GalleryImage[]) {
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>(images)
  const [filters, setFilters] = useState({
    deviceId: null as number | null,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    searchTerm: ''
  })

  // 필터 적용
  useEffect(() => {
    let result = [...images]

    // 기기별 필터
    if (filters.deviceId) {
      result = filterImagesByDevice(result, filters.deviceId)
    }

    // 날짜+시간 범위 필터
    if (filters.startDate || filters.endDate || filters.startTime || filters.endTime) {
      result = filterImagesByDateTimeRange(result, filters.startDate, filters.startTime, filters.endDate, filters.endTime)
    }

    // 검색어 필터 (기기 이름, 위치로 검색)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      result = result.filter(image => 
        image.device_name?.toLowerCase().includes(searchLower) ||
        image.device_location?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredImages(result)
  }, [images, filters])

  // 필터 업데이트 함수들
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      deviceId: null,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      searchTerm: ''
    })
  }, [])

  return {
    filteredImages,
    filters,
    updateFilter,
    resetFilters
  }
}

/**
 * 이미지 슬라이드쇼 관리 훅
 */
export function useImageSlideshow(images: GalleryImage[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [interval, setIntervalDuration] = useState(3000) // 3초

  // 다음 이미지
  const nextImage = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length)
  }, [images.length])

  // 이전 이미지
  const prevImage = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }, [images.length])

  // 특정 인덱스로 이동
  const goToImage = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)))
  }, [images.length])

  // 자동 재생
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const timer = setInterval(nextImage, interval)
    return () => clearInterval(timer)
  }, [isPlaying, interval, nextImage, images.length])

  // 이미지 목록 변경 시 인덱스 조정
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0)
    }
  }, [images.length, currentIndex])

  const currentImage = images[currentIndex] || null

  return {
    currentImage,
    currentIndex,
    isPlaying,
    setIsPlaying,
    interval,
    setIntervalDuration,
    nextImage,
    prevImage,
    goToImage
  }
}
