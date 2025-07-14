// 모의 데이터
const devices = {
  "greenhouse-1": { name: "온실 A동", status: "online" },
  "greenhouse-2": { name: "온실 B동", status: "online" },
  "greenhouse-3": { name: "온실 C동", status: "offline" },
}

const sensorData = {
  "greenhouse-1": {
    light: { value: 850, unit: "lux", status: "normal" },
    humidity: { value: 65, unit: "%", status: "normal" },
    waterLevel: { value: 78, unit: "%", status: "normal" },
    soilMoisture1: { value: 42, unit: "%", status: "low" },
    soilMoisture2: { value: 58, unit: "%", status: "normal" },
  },
  "greenhouse-2": {
    light: { value: 920, unit: "lux", status: "high" },
    humidity: { value: 58, unit: "%", status: "normal" },
    waterLevel: { value: 34, unit: "%", status: "low" },
    soilMoisture1: { value: 67, unit: "%", status: "normal" },
    soilMoisture2: { value: 35, unit: "%", status: "low" },
  },
  "greenhouse-3": {
    light: { value: 0, unit: "lux", status: "offline" },
    humidity: { value: 0, unit: "%", status: "offline" },
    waterLevel: { value: 0, unit: "%", status: "offline" },
    soilMoisture1: { value: 0, unit: "%", status: "offline" },
    soilMoisture2: { value: 0, unit: "%", status: "offline" },
  },
}

const eventLogs = {
  "greenhouse-1": [
    { time: "14:30", trigger: "토양습도 센서", action: "토마토 화분 급수 시작 (습도 42% → 70%)" },
    { time: "13:15", trigger: "자동 스케줄", action: "LED 조명 자동 점등" },
    { time: "12:00", trigger: "조도 센서", action: "조도 850lux 감지, 환기팬 작동" },
    { time: "11:45", trigger: "온도 센서", action: "온도 28°C 도달, 환기팬 가동" },
    { time: "11:30", trigger: "물탱크 센서", action: "물 잔량 78% 확인" },
    { time: "11:15", trigger: "시스템", action: "센서 데이터 수집 완료" },
    { time: "11:00", trigger: "사용자", action: "상추 급수 수동 정지" },
    { time: "10:45", trigger: "토양습도 센서", action: "상추 화분 급수 완료 (습도 58%)" },
  ],
  "greenhouse-2": [
    { time: "14:25", trigger: "물탱크 센서", action: "물 잔량 34% 경고 알림" },
    { time: "13:50", trigger: "습도 센서", action: "습도 58% 적정 수준 유지" },
    { time: "12:30", trigger: "시스템", action: "최적 환경 조건 달성" },
    { time: "11:20", trigger: "자동 스케줄", action: "오이 화분 급수 시작" },
    { time: "11:05", trigger: "온도 센서", action: "온도 26°C, 환기팬 정지" },
    { time: "10:50", trigger: "조도 센서", action: "조도 920lux, LED 조명 자동 소등" },
    { time: "10:30", trigger: "사용자", action: "파프리카 급수 수동 시작" },
    { time: "10:15", trigger: "시스템", action: "전체 센서 상태 점검 완료" },
  ],
  "greenhouse-3": [
    { time: "14:00", trigger: "시스템", action: "네트워크 연결 끊어짐" },
    { time: "13:30", trigger: "시스템", action: "센서 응답 없음 - 점검 필요" },
    { time: "12:45", trigger: "시스템", action: "통신 불안정 감지" },
    { time: "12:00", trigger: "시스템", action: "마지막 정상 데이터 수신" },
    { time: "11:30", trigger: "시스템", action: "연결 재시도 실패" },
  ],
}

const deviceControls = {
  "greenhouse-1": {
    ledLight: true,
    waterPump1: false,
    waterPump2: true,
    ventilationFan: true,
  },
  "greenhouse-2": {
    ledLight: false,
    waterPump1: true,
    waterPump2: false,
    ventilationFan: false,
  },
  "greenhouse-3": {
    ledLight: false,
    waterPump1: false,
    waterPump2: false,
    ventilationFan: false,
  },
}

const sensorNames = {
  "greenhouse-1": {
    soil1: "토마토 화분",
    soil2: "상추 화분",
    pump1: "토마토 급수",
    pump2: "상추 급수",
  },
  "greenhouse-2": {
    soil1: "오이 화분",
    soil2: "파프리카 화분",
    pump1: "오이 급수",
    pump2: "파프리카 급수",
  },
  "greenhouse-3": {
    soil1: "화분 1",
    soil2: "화분 2",
    pump1: "급수펌프 1",
    pump2: "급수펌프 2",
  },
}

// 현재 선택된 기기
let currentDevice = "greenhouse-1"
let editingElement = null

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 상태 확인
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html"
    return
  }

  updateDashboard()
})

// 네비게이션 함수
function navigateTo(page) {
  window.location.href = page
}

// 기기 변경 핸들러
function handleDeviceChange(deviceId) {
  currentDevice = deviceId
  updateDashboard()
}

// 대시보드 업데이트
function updateDashboard() {
  const device = devices[currentDevice]
  const sensors = sensorData[currentDevice]
  const logs = eventLogs[currentDevice]
  const controls = deviceControls[currentDevice]
  const names = sensorNames[currentDevice]

  // 센서 데이터 업데이트
  updateSensorData(sensors)

  // 센서 이름 업데이트
  updateSensorNames(names)

  // 이벤트 로그 업데이트
  updateEventLogs(logs, device.name)

  // 제어 패널 업데이트
  updateControlPanel(device, controls, names)
}

// 센서 데이터 업데이트
function updateSensorData(sensors) {
  document.getElementById("light-value").textContent = sensors.light.value
  document.getElementById("humidity-value").textContent = sensors.humidity.value
  document.getElementById("water-value").textContent = sensors.waterLevel.value
  document.getElementById("soil1-value").textContent = sensors.soilMoisture1.value
  document.getElementById("soil2-value").textContent = sensors.soilMoisture2.value

  // 상태별 색상 적용
  applyStatusColor("light-unit", sensors.light.status)
  applyStatusColor("humidity-unit", sensors.humidity.status)
  applyStatusColor("water-unit", sensors.waterLevel.status)
  applyStatusColor("soil1-unit", sensors.soilMoisture1.status)
  applyStatusColor("soil2-unit", sensors.soilMoisture2.status)
}

// 센서 이름 업데이트
function updateSensorNames(names) {
  document.getElementById("soil1-name").textContent = names.soil1
  document.getElementById("soil2-name").textContent = names.soil2
  document.getElementById("pump1-name").textContent = names.pump1
  document.getElementById("pump2-name").textContent = names.pump2
}

// 상태별 색상 적용
function applyStatusColor(elementId, status) {
  const element = document.getElementById(elementId)
  element.className = `sensor-unit status-${status}`
}

// 이벤트 로그 업데이트
function updateEventLogs(logs, deviceName) {
  const tbody = document.getElementById("event-log-body")
  const description = document.getElementById("device-description")

  description.textContent = `${deviceName}의 최근 활동 내역`

  tbody.innerHTML = ""
  logs.forEach((log) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td class="event-time">${log.time}</td>
            <td class="event-trigger">${log.trigger}</td>
            <td class="event-action">${log.action}</td>
        `
    tbody.appendChild(row)
  })
}

// 제어 패널 업데이트
function updateControlPanel(device, controls, names) {
  const description = document.getElementById("control-description")
  const onlineControls = document.getElementById("controls-online")
  const offlineControls = document.getElementById("controls-offline")

  description.textContent = device.name

  if (device.status === "offline") {
    onlineControls.style.display = "none"
    offlineControls.style.display = "block"
  } else {
    onlineControls.style.display = "flex"
    offlineControls.style.display = "none"

    // 스위치 상태 업데이트
    document.getElementById("led-switch").checked = controls.ledLight
    document.getElementById("pump1-switch").checked = controls.waterPump1
    document.getElementById("pump2-switch").checked = controls.waterPump2
    document.getElementById("fan-switch").checked = controls.ventilationFan
  }
}

// 제어 변경 핸들러
function handleControlChange(controlName, value) {
  deviceControls[currentDevice][controlName] = value
  console.log(`${currentDevice} - ${controlName}: ${value}`)
}

// 이름 편집
function editName(elementId) {
  editingElement = elementId
  const element = document.getElementById(elementId)
  const currentName = element.textContent

  const modal = document.getElementById("edit-modal")
  const input = document.getElementById("edit-input")

  input.value = currentName
  modal.style.display = "flex"

  setTimeout(() => {
    input.focus()
    input.select()
  }, 100)
}

// 이름 저장
function saveName() {
  if (!editingElement) return

  const input = document.getElementById("edit-input")
  const newName = input.value.trim()

  if (newName) {
    document.getElementById(editingElement).textContent = newName

    // 데이터 업데이트
    const nameKey = editingElement.replace("-name", "")
    sensorNames[currentDevice][nameKey] = newName

    console.log(`이름 변경: ${editingElement} -> ${newName}`)
  }

  cancelEdit()
}

// 편집 취소
function cancelEdit() {
  document.getElementById("edit-modal").style.display = "none"
  editingElement = null
}

// 전체 설정 초기화
function resetAllControls() {
  if (confirm("모든 기기 설정을 초기화하시겠습니까?")) {
    deviceControls[currentDevice] = {
      ledLight: false,
      waterPump1: false,
      waterPump2: false,
      ventilationFan: false,
    }

    updateDashboard()
    console.log("전체 설정 초기화됨")
  }
}

// 로그아웃
function handleLogout() {
  if (confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("username")
    window.location.href = "login.html"
  }
}

// 키보드 이벤트 처리
document.addEventListener("keydown", (e) => {
  if (editingElement) {
    if (e.key === "Enter") {
      saveName()
    } else if (e.key === "Escape") {
      cancelEdit()
    }
  }
})

// 모달 외부 클릭 시 닫기
document.getElementById("edit-modal").addEventListener("click", function (e) {
  if (e.target === this) {
    cancelEdit()
  }
})
