// 프리셋 데이터
const presetData = {
  "greenhouse-1": {
    automation: {
      autoWatering: true,
      autoLighting: true,
      autoVentilation: true,
    },
    thresholds: {
      soilMoisture: 40,
      lightLevel: 500,
      temperature: 28,
      waterLevel: 20,
    },
    schedule: {
      lightingSchedule: true,
      wateringSchedule: false,
      lightOnTime: "06:00",
      lightOffTime: "22:00",
      wateringTime: "08:00",
      wateringInterval: "daily",
    },
    notifications: {
      waterLowAlert: true,
      offlineAlert: true,
      sensorErrorAlert: true,
    },
    settings: {
      wateringDuration: 30,
    },
  },
  "greenhouse-2": {
    automation: {
      autoWatering: true,
      autoLighting: false,
      autoVentilation: true,
    },
    thresholds: {
      soilMoisture: 35,
      lightLevel: 600,
      temperature: 30,
      waterLevel: 15,
    },
    schedule: {
      lightingSchedule: false,
      wateringSchedule: true,
      lightOnTime: "07:00",
      lightOffTime: "21:00",
      wateringTime: "09:00",
      wateringInterval: "every-2-days",
    },
    notifications: {
      waterLowAlert: true,
      offlineAlert: true,
      sensorErrorAlert: false,
    },
    settings: {
      wateringDuration: 45,
    },
  },
  "greenhouse-3": {
    automation: {
      autoWatering: false,
      autoLighting: false,
      autoVentilation: false,
    },
    thresholds: {
      soilMoisture: 50,
      lightLevel: 400,
      temperature: 25,
      waterLevel: 25,
    },
    schedule: {
      lightingSchedule: false,
      wateringSchedule: false,
      lightOnTime: "06:30",
      lightOffTime: "22:30",
      wateringTime: "07:30",
      wateringInterval: "weekly",
    },
    notifications: {
      waterLowAlert: false,
      offlineAlert: true,
      sensorErrorAlert: false,
    },
    settings: {
      wateringDuration: 20,
    },
  },
}

let currentPresetDevice = "greenhouse-1"

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 로그인 상태 확인
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html"
    return
  }

  loadPresets()
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

// 기기 변경 핸들러
function handlePresetDeviceChange(deviceId) {
  currentPresetDevice = deviceId
  loadPresets()
}

// 프리셋 로드
function loadPresets() {
  const data = presetData[currentPresetDevice]

  // 자동화 규칙 설정
  document.getElementById("auto-watering").checked = data.automation.autoWatering
  document.getElementById("auto-lighting").checked = data.automation.autoLighting
  document.getElementById("auto-ventilation").checked = data.automation.autoVentilation

  // 임계값 설정
  document.getElementById("soil-threshold").value = data.thresholds.soilMoisture
  document.getElementById("light-threshold").value = data.thresholds.lightLevel
  document.getElementById("temp-threshold").value = data.thresholds.temperature
  document.getElementById("water-alert-threshold").value = data.thresholds.waterLevel

  // 스케줄 설정
  document.getElementById("lighting-schedule").checked = data.schedule.lightingSchedule
  document.getElementById("watering-schedule").checked = data.schedule.wateringSchedule
  document.getElementById("light-on-time").value = data.schedule.lightOnTime
  document.getElementById("light-off-time").value = data.schedule.lightOffTime
  document.getElementById("watering-time").value = data.schedule.wateringTime
  document.getElementById("watering-interval").value = data.schedule.wateringInterval

  // 알림 설정
  document.getElementById("water-low-alert").checked = data.notifications.waterLowAlert
  document.getElementById("offline-alert").checked = data.notifications.offlineAlert
  document.getElementById("sensor-error-alert").checked = data.notifications.sensorErrorAlert

  // 기타 설정
  document.getElementById("watering-duration").value = data.settings.wateringDuration
}

// 자동화 규칙 토글
function handleRuleToggle(ruleName, enabled) {
  presetData[currentPresetDevice].automation[ruleName] = enabled
  console.log(`${currentPresetDevice} - ${ruleName}: ${enabled}`)
}

// 스케줄 토글
function handleScheduleToggle(scheduleName, enabled) {
  presetData[currentPresetDevice].schedule[scheduleName] = enabled
  console.log(`${currentPresetDevice} - ${scheduleName}: ${enabled}`)
}

// 알림 토글
function handleNotificationToggle(notificationName, enabled) {
  presetData[currentPresetDevice].notifications[notificationName] = enabled
  console.log(`${currentPresetDevice} - ${notificationName}: ${enabled}`)
}

// 프리셋 저장
function savePresets() {
  const data = presetData[currentPresetDevice]

  // 임계값 업데이트
  data.thresholds.soilMoisture = Number.parseInt(document.getElementById("soil-threshold").value)
  data.thresholds.lightLevel = Number.parseInt(document.getElementById("light-threshold").value)
  data.thresholds.temperature = Number.parseInt(document.getElementById("temp-threshold").value)
  data.thresholds.waterLevel = Number.parseInt(document.getElementById("water-alert-threshold").value)

  // 스케줄 업데이트
  data.schedule.lightOnTime = document.getElementById("light-on-time").value
  data.schedule.lightOffTime = document.getElementById("light-off-time").value
  data.schedule.wateringTime = document.getElementById("watering-time").value
  data.schedule.wateringInterval = document.getElementById("watering-interval").value

  // 기타 설정 업데이트
  data.settings.wateringDuration = Number.parseInt(document.getElementById("watering-duration").value)

  // 실제 구현에서는 서버에 저장
  localStorage.setItem("presetData", JSON.stringify(presetData))

  alert("설정이 저장되었습니다.")
  console.log("프리셋 저장됨:", data)
}

// 프리셋 초기화
function resetPresets() {
  if (confirm("모든 설정을 기본값으로 초기화하시겠습니까?")) {
    // 기본값으로 초기화
    presetData[currentPresetDevice] = {
      automation: {
        autoWatering: true,
        autoLighting: true,
        autoVentilation: true,
      },
      thresholds: {
        soilMoisture: 40,
        lightLevel: 500,
        temperature: 28,
        waterLevel: 20,
      },
      schedule: {
        lightingSchedule: true,
        wateringSchedule: false,
        lightOnTime: "06:00",
        lightOffTime: "22:00",
        wateringTime: "08:00",
        wateringInterval: "daily",
      },
      notifications: {
        waterLowAlert: true,
        offlineAlert: true,
        sensorErrorAlert: true,
      },
      settings: {
        wateringDuration: 30,
      },
    }

    loadPresets()
    alert("설정이 기본값으로 초기화되었습니다.")
  }
}
