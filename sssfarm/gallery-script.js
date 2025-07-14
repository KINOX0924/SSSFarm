// 갤러리 데이터
const galleryData = [
  {
    id: 1,
    title: "토마토 성장 상태",
    location: "greenhouse-1",
    date: "2024-01-15",
    time: "14:30",
    description: "토마토가 잘 자라고 있습니다",
    image: "/placeholder.svg?height=200&width=250",
  },
  {
    id: 2,
    title: "상추 수확 준비",
    location: "greenhouse-1",
    date: "2024-01-14",
    time: "10:15",
    description: "상추가 수확 가능한 크기로 자랐습니다",
    image: "/placeholder.svg?height=200&width=250",
  },
  {
    id: 3,
    title: "오이 꽃 개화",
    location: "greenhouse-2",
    date: "2024-01-13",
    time: "16:45",
    description: "오이에 꽃이 피기 시작했습니다",
    image: "/placeholder.svg?height=200&width=250",
  },
  {
    id: 4,
    title: "파프리카 열매",
    location: "greenhouse-2",
    date: "2024-01-12",
    time: "09:20",
    description: "파프리카에 작은 열매가 맺혔습니다",
    image: "/placeholder.svg?height=200&width=250",
  },
  {
    id: 5,
    title: "전체 온실 전경",
    location: "greenhouse-1",
    date: "2024-01-11",
    time: "12:00",
    description: "온실 A동 전체 모습",
    image: "/placeholder.svg?height=200&width=250",
  },
  {
    id: 6,
    title: "LED 조명 설치",
    location: "greenhouse-3",
    date: "2024-01-10",
    time: "15:30",
    description: "새로운 LED 조명을 설치했습니다",
    image: "/placeholder.svg?height=200&width=250",
  },
]

let filteredData = [...galleryData]
let currentPhoto = null

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 상태 확인
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html"
    return
  }

  renderGallery()
})

// 네비게이션 함수
function navigateTo(page) {
  window.location.href = page
}

// 로그아웃
function handleLogout() {
  if (confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("username")
    window.location.href = "login.html"
  }
}

// 갤러리 필터링
function filterGallery() {
  const locationFilter = document.getElementById("location-filter").value
  const dateFilter = document.getElementById("date-filter").value
  const sortFilter = document.getElementById("sort-filter").value

  filteredData = [...galleryData]

  // 위치 필터
  if (locationFilter !== "all") {
    filteredData = filteredData.filter((item) => item.location === locationFilter)
  }

  // 날짜 필터
  if (dateFilter !== "all") {
    const today = new Date()
    const filterDate = new Date()

    switch (dateFilter) {
      case "today":
        filteredData = filteredData.filter((item) => item.date === today.toISOString().split("T")[0])
        break
      case "week":
        filterDate.setDate(today.getDate() - 7)
        filteredData = filteredData.filter((item) => new Date(item.date) >= filterDate)
        break
      case "month":
        filterDate.setMonth(today.getMonth() - 1)
        filteredData = filteredData.filter((item) => new Date(item.date) >= filterDate)
        break
    }
  }

  // 정렬
  switch (sortFilter) {
    case "newest":
      filteredData.sort((a, b) => new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time))
      break
    case "oldest":
      filteredData.sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time))
      break
    case "name":
      filteredData.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  renderGallery()
}

// 갤러리 렌더링
function renderGallery() {
  const grid = document.getElementById("gallery-grid")
  const emptyState = document.getElementById("empty-state")

  if (filteredData.length === 0) {
    grid.style.display = "none"
    emptyState.style.display = "block"
    return
  }

  grid.style.display = "grid"
  emptyState.style.display = "none"

  grid.innerHTML = ""

  filteredData.forEach((photo) => {
    const photoItem = document.createElement("div")
    photoItem.className = "photo-item"
    photoItem.onclick = () => openPhotoModal(photo)

    const locationName = getLocationName(photo.location)

    photoItem.innerHTML = `
            <img src="${photo.image}" alt="${photo.title}" class="photo-image">
            <div class="photo-info">
                <div class="photo-title">${photo.title}</div>
                <div class="photo-meta">${photo.date} ${photo.time} • ${locationName}</div>
            </div>
        `

    grid.appendChild(photoItem)
  })
}

// 위치 이름 변환
function getLocationName(location) {
  const locationNames = {
    "greenhouse-1": "온실 A동",
    "greenhouse-2": "온실 B동",
    "greenhouse-3": "온실 C동",
  }
  return locationNames[location] || location
}

// 사진 상세 모달 열기
function openPhotoModal(photo) {
  currentPhoto = photo
  const modal = document.getElementById("photo-modal")

  document.getElementById("modal-title").textContent = photo.title
  document.getElementById("modal-image").src = photo.image
  document.getElementById("modal-date").textContent = `${photo.date} ${photo.time}`
  document.getElementById("modal-location").textContent = getLocationName(photo.location)
  document.getElementById("modal-description").textContent = photo.description

  modal.style.display = "flex"
}

// 사진 상세 모달 닫기
function closePhotoModal() {
  document.getElementById("photo-modal").style.display = "none"
  currentPhoto = null
}

// 사진 다운로드
function downloadPhoto() {
  if (currentPhoto) {
    // 실제 구현에서는 실제 이미지 다운로드
    alert(`${currentPhoto.title} 사진을 다운로드합니다.`)
  }
}

// 사진 삭제
function deletePhoto() {
  if (currentPhoto && confirm("이 사진을 삭제하시겠습니까?")) {
    const index = galleryData.findIndex((photo) => photo.id === currentPhoto.id)
    if (index > -1) {
      galleryData.splice(index, 1)
      filterGallery()
      closePhotoModal()
      alert("사진이 삭제되었습니다.")
    }
  }
}

// 사진 업로드 모달 열기
function uploadPhoto() {
  document.getElementById("upload-modal").style.display = "flex"
  document.getElementById("upload-form").style.display = "none"
  document.getElementById("upload-actions").style.display = "none"
}

//  업로드 모달 닫기
function closeUploadModal() {
  document.getElementById("upload-modal").style.display = "none"
  document.getElementById("photo-title").value = ""
  document.getElementById("photo-description").value = ""
  document.getElementById("file-input").value = ""
}

// 파일 선택 처리
function handleFileSelect(event) {
  const files = event.target.files
  if (files.length > 0) {
    document.getElementById("upload-form").style.display = "block"
    document.getElementById("upload-actions").style.display = "flex"
  }
}

// 업로드 확인
function confirmUpload() {
  const title = document.getElementById("photo-title").value.trim()
  const location = document.getElementById("photo-location").value
  const description = document.getElementById("photo-description").value.trim()
  const files = document.getElementById("file-input").files

  if (!title) {
    alert("제목을 입력해주세요.")
    return
  }

  if (files.length === 0) {
    alert("사진을 선택해주세요.")
    return
  }

  // 새 사진 데이터 생성
  const now = new Date()
  const newPhoto = {
    id: Date.now(),
    title: title,
    location: location,
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0].substring(0, 5),
    description: description || "설명 없음",
    image: "/placeholder.svg?height=200&width=250", // 실제 구현에서는 업로드된 이미지 URL
  }

  galleryData.unshift(newPhoto)
  filterGallery()
  closeUploadModal()
  alert("사진이 업로드되었습니다.")
}

// 드래그 앤 드롭 처리
const uploadArea = document.getElementById("upload-area")

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault()
  uploadArea.style.backgroundColor = "#f0f9ff"
})

uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault()
  uploadArea.style.backgroundColor = ""
})

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault()
  uploadArea.style.backgroundColor = ""

  const files = e.dataTransfer.files
  if (files.length > 0) {
    document.getElementById("file-input").files = files
    handleFileSelect({ target: { files } })
  }
})

uploadArea.addEventListener("click", () => {
  document.getElementById("file-input").click()
})
