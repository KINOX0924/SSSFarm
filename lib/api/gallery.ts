import { get } from './client'
import { Device, PlantImage } from './types'

// 갤러리 관련 API 함수들

/**
 * 모든 기기의 이미지 목록 가져오기
 */
export async function getAllImages(): Promise<PlantImage[]> {
  try {
    // 먼저 기기 목록을 가져옴
    const devices = await get<Device[]>('/devices/')
    console.log('Fetched devices:', devices)
    
    // 모든 기기의 이미지를 합치기
    const allImages: PlantImage[] = []
    
    for (const device of devices) {
      try {
        // 각 기기별로 이미지 목록을 직접 호출
        const deviceImages = await get<PlantImage[]>(`/devices/${device.device_id}/images`)
        console.log(`Device ${device.device_id} images:`, deviceImages)
        
        // 이미지에 device 정보 추가
        const imagesWithDevice = deviceImages.map(image => ({
          ...image,
          device_name: device.device_name,
          device_location: device.location
        }))
        allImages.push(...imagesWithDevice)
      } catch (imageError) {
        console.warn(`Failed to fetch images for device ${device.device_id}:`, imageError)
        // 개별 기기 이미지 로드 실패는 무시하고 계속 진행
      }
    }
    
    console.log('All images collected:', allImages)
    
    // 촬영 시간 기준으로 최신순 정렬
    return allImages.sort((a, b) => 
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    )
  } catch (error) {
    console.error('Failed to fetch all images:', error)
    throw new Error('이미지 목록을 불러오는데 실패했습니다')
  }
}

/**
 * 특정 기기의 이미지 목록 가져오기
 */
export async function getDeviceImages(deviceId: number): Promise<PlantImage[]> {
  try {
    console.log(`Fetching images for device ${deviceId}`)
    const response = await get<PlantImage[]>(`/devices/${deviceId}/images`)
    console.log(`Device ${deviceId} images response:`, response)
    
    // 촬영 시간 기준으로 최신순 정렬
    return response.sort((a, b) => 
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    )
  } catch (error) {
    console.error(`Failed to fetch images for device ${deviceId}:`, error)
    throw new Error('기기 이미지를 불러오는데 실패했습니다')
  }
}

/**
 * 이미지 필터링 함수들
 */

// 시간 간격으로 필터링
export function filterImagesByTimeInterval(images: PlantImage[], intervalMinutes: number): PlantImage[] {
  if (intervalMinutes === 0) return images // 전체 사진
  
  const interval = intervalMinutes * 60 * 1000 // 밀리초로 변환
  const filtered: PlantImage[] = []
  let lastTimestamp = 0
  
  for (const image of images) {
    const currentTimestamp = new Date(image.captured_at).getTime()
    
    if (currentTimestamp - lastTimestamp >= interval) {
      filtered.push(image)
      lastTimestamp = currentTimestamp
    }
  }
  
  return filtered
}

// 날짜 범위로 필터링
export function filterImagesByDateRange(
  images: PlantImage[], 
  startDate?: string, 
  endDate?: string
): PlantImage[] {
  return images.filter(image => {
    const imageDate = new Date(image.captured_at)
    
    if (startDate && imageDate < new Date(startDate)) {
      return false
    }
    
    if (endDate && imageDate > new Date(endDate + 'T23:59:59')) {
      return false
    }
    
    return true
  })
}

// 기기별 필터링
export function filterImagesByDevice(images: PlantImage[], deviceId?: number): PlantImage[] {
  if (!deviceId) return images
  return images.filter(image => image.device_id === deviceId)
}

/**
 * 이미지 URL 생성 (API 서버의 이미지 경로를 절대 URL로 변환)
 */
export function getImageUrl(imagePath: string): string {
  // 이미지 경로가 이미 절대 URL인지 확인
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // API 서버 베이스 URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sssfarm-fast-api.onrender.com'
  
  // 상대 경로를 절대 URL로 변환
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

/**
 * 확장된 이미지 정보 타입 (갤러리에서 사용)
 */
export interface GalleryImage extends PlantImage {
  device_name?: string
  device_location?: string
  thumbnail_url?: string
  full_url?: string
}

/**
 * 갤러리용 이미지 데이터 변환
 */
export function transformToGalleryImages(images: PlantImage[]): GalleryImage[] {
  return images.map(image => ({
    ...image,
    thumbnail_url: image.image_path, // API에서 이미 전체 URL을 제공
    full_url: image.image_path
  }))
}
