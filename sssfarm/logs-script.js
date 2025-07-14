// 로그 데이터
const logData = [
  {
    id: 1,
    time: "2024-01-15 14:30:25",
    device: "greenhouse-1",
    type: "sensor",
    content: "토양 습도 센서 값: 42% → 자동 급수 시작",
    status: "success",
    data: { sensor: "soil_moisture_1", value: 42, action: "watering_start" },
  },
  {
    id: 2,
    time: "2024-01-15 14:25:10",
    device: "greenhouse-2",
    type: "control",
    content: "사용자가 LED 조명을 수동으로 켬",
    status: "success",
    data: { device: "led_light", action: "manual_on", user: "admin" },
  },
  {
    id: 3,
    time: "2024-01-15 14:20:45",
    device: "greenhouse-1",
    type: "automation",
    content: "조도 센서 기반 자동 조명 제어 실행",
    status: "success",
    data: { sensor: "light_sensor", value: 450, threshold: 500, action: "light_on" },
  },
  {
    id: 4,
    time: "2024-01-15 14:15:30",
    device: "greenhouse-3",
    type: "system",
    content: "기기 연결 끊어짐 - 네트워크 점검 필요",
    status: "error",
    data: { error: "connection_lost", last_seen: "2024-01-15 14:00:00" },
  },
  {
    id: 5,
    time: "2024-01-15 14:10:15",
    device: "greenhouse-2",
    type: "sensor",
    content: "물 잔량 센서: 34% - 보충 권장",
    status: "warning",
    data: { sensor: "water_level", value: 34, threshold: 40 },
  },
  {
    id: 6,
    time: "2024-01-15 14:05:00",
    device: "greenhouse-1",
    type: "control",
    content: "환기팬 자동 작동 (온도: 28°C)",
    status: "success",
    data: { device: "ventilation_fan", trigger: "temperature", value: 28, threshold: 27 },
  },
  {
    id: 7,
    time: "2024-01-15 14:00:45",
    device: "greenhouse-2",
    type: "automation",
    content: "스케줄 기반 급수 시스템 작동",
    status: "success",
    data: { schedule: "daily_watering", time: "14:00", duration: 30 },
  },
  {
    id: 8,
    time: "2024-01-15 13:55:30",
    device: "greenhouse-1",
    type: "sensor",
    content: "습도 센서 정상 작동 확인: 65%",
    status: "success",
    data: { sensor: "humidity", value: 65, status: "normal" },
  },
  {
    id: 9,
    time: "2024-01-15 13:50:15",
    device: "greenhouse-3",
    type: "error",
    content: "토양 습도 센서 응답 없음",
    status: "error",
    data: { sensor: "soil_moisture_2", error: "no_response", attempts: 3 },
  },
  {
    id: 10,
    time: "2024-01-15 13:45:00",
    device: "greenhouse-2",
    type: "system",
    content: "시스템 정기 점검 완료",
    status: "success",
    data: { check_type: "routine", sensors_ok: 4, devices_ok: 3 },
  },
]

let filteredLogs = [...logData]
let currentPage = 1
const logsPerPage = 10
let currentLogDetail = null

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 상태 확인
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html"
    return
  }

  renderLogs()
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

// 로그 필터링
function filterLogs() {
  const deviceFilter = document.getElementById("log-device-filter").value
  const typeFilter = document.getElementById("log-type-filter").value
  const dateFilter = document.getElementById("log-date-filter").value

  filteredLogs = [...logData]

  // 기기 필터
  if (deviceFilter !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.device === deviceFilter)
  }

  // 유형 필터
  if (typeFilter !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.type === typeFilter)
  }

  // 날짜 필터
  if (dateFilter !== "all") {
    const today = new Date()
    const filterDate = new Date()

    switch (dateFilter) {
      case "today":
        const todayStr = today.toISOString().split("T")[0]
        filteredLogs = filteredLogs.filter((log) => log.time.startsWith(todayStr))
        break
      case "week":
        filterDate.setDate(today.getDate() - 7)
        filteredLogs = filteredLogs.filter((log) => new Date(log.time) >= filterDate)
        break
      case "month":
        filterDate.setMonth(today.getMonth() - 1)
        filteredLogs = filteredLogs.filter((log) => new Date(log.time) >= filterDate)
        break
    }
  }

  currentPage = 1
  renderLogs()
}

// 로그 렌더링
function renderLogs() {
  const tbody = document.getElementById("log-table-body")
  const emptyState = document.getElementById("log-empty-state")
  const tableContainer = document.querySelector(".log-table-container")

  if (filteredLogs.length === 0) {
    tableContainer.style.display = "none"
    emptyState.style.display = "block"
    document.getElementById("pagination").style.display = "none"
    return
  }

  tableContainer.style.display = "block"
  emptyState.style.display = "none"
  document.getElementById("pagination").style.display = "flex"

  // 페이지네이션 계산
  const startIndex = (currentPage - 1) * logsPerPage
  const endIndex = startIndex + logsPerPage
  const pageData = filteredLogs.slice(startIndex, endIndex)

  tbody.innerHTML = ""

  pageData.forEach((log) => {
    const row = document.createElement("tr")
    row.onclick = () => openLogModal(log)

    const deviceName = getDeviceName(log.device)
    const typeLabel = getTypeLabel(log.type)

    row.innerHTML = `
            <td>${formatTime(log.time)}</td>
            <td>${deviceName}</td>
            <td><span class="log-type ${log.type}">${typeLabel}</span></td>
            <td>${log.content}</td>
            <td><span class="log-status ${log.status}">${getStatusLabel(log.status)}</span></td>
        `

    tbody.appendChild(row)
  })

  renderPagination()
}

// 기기 이름 변환
function getDeviceName(device) {
  const deviceNames = {
    "greenhouse-1": "온실 A동",
    "greenhouse-2": "온실 B동",
    "greenhouse-3": "온실 C동",
  }
  return deviceNames[device] || device
}

// 유형 라벨 변환
function getTypeLabel(type) {
  const typeLabels = {
    sensor: "센서 데이터",
    control: "기기 제어",
    automation: "자동화",
    system: "시스템",
    error: "오류",
  }
  return typeLabels[type] || type
}

// 상태 라벨 변환
function getStatusLabel(status) {
  const statusLabels = {
    success: "정상",
    warning: "경고",
    error: "오류",
  }
  return statusLabels[status] || status
}

// 시간 포맷팅
function formatTime(timeString) {
  const date = new Date(timeString)
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// 페이지네이션 렌더링
function renderPagination() {
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const pageNumbers = document.getElementById("page-numbers")
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")

  // 이전/다음 버튼 상태
  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages

  // 페이지 번호 생성
  pageNumbers.innerHTML = ""
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button")
    pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`
    pageBtn.textContent = i
    pageBtn.onclick = () => {
      currentPage = i
      renderLogs()
    }
    pageNumbers.appendChild(pageBtn)
  }
}

// 페이지 변경
function changePage(direction) {
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  if (direction === "prev" && currentPage > 1) {
    currentPage--
  } else if (direction === "next" && currentPage < totalPages) {
    currentPage++
  }

  renderLogs()
}

// 로그 상세 모달 열기
function openLogModal(log) {
  currentLogDetail = log
  const modal = document.getElementById("log-modal")

  document.getElementById("detail-time").textContent = formatTime(log.time)
  document.getElementById("detail-device").textContent = getDeviceName(log.device)
  document.getElementById("detail-type").textContent = getTypeLabel(log.type)
  document.getElementById("detail-type").className = `log-type ${log.type}`
  document.getElementById("detail-status").textContent = getStatusLabel(log.status)
  document.getElementById("detail-status").className = `log-status ${log.status}`
  document.getElementById("detail-content").textContent = log.content

  // 상세 데이터 표시
  if (log.data) {
    document.getElementById("detail-data-row").style.display = "flex"
    document.getElementById("detail-data").textContent = JSON.stringify(log.data, null, 2)
  } else {
    document.getElementById("detail-data-row").style.display = "none"
  }

  modal.style.display = "flex"
}

// 로그 상세 모달 닫기
function closeLogModal() {
  document.getElementById("log-modal").style.display = "none"
  currentLogDetail = null
}

// 로그 내보내기
function exportLogs() {
  if (filteredLogs.length === 0) {
    alert("내보낼 로그가 없습니다.")
    return
  }

  // CSV 형식으로 데이터 변환
  const headers = ["시간", "기기", "유형", "내용", "상태"]
  const csvData = [
    headers.join(","),
    ...filteredLogs.map((log) =>
      [
        `"${log.time}"`,
        `"${getDeviceName(log.device)}"`,
        `"${getTypeLabel(log.type)}"`,
        `"${log.content}"`,
        `"${getStatusLabel(log.status)}"`,
      ].join(","),
    ),
  ].join("\n")

  // 파일 다운로드
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `logs_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  alert("로그가 CSV 파일로 내보내졌습니다.")
}

// 로그 삭제
function clearLogs() {
  if (confirm("모든 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
    logData.length = 0
    filteredLogs.length = 0
    renderLogs()
    alert("모든 로그가 삭제되었습니다.")
  }
}
