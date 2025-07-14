// 사용자 데이터 (실제 구현에서는 서버에서 관리)
const users = JSON.parse(localStorage.getItem("users")) || [{ id: "admin", password: "1234" }]
const lucide = window.lucide // Declare the lucide variable

// 비밀번호 표시/숨김 토글
function togglePassword(inputId) {
  const input = document.getElementById(inputId)
  const icon = document.getElementById(
    inputId.replace("-password", "-eye-icon").replace("-confirm-password", "-confirm-eye-icon"),
  )

  if (input.type === "password") {
    input.type = "text"
    icon.setAttribute("data-lucide", "eye-off")
  } else {
    input.type = "password"
    icon.setAttribute("data-lucide", "eye")
  }

  lucide.createIcons()
}

// 로그인 폼 표시
function showLoginForm() {
  document.getElementById("login-form").style.display = "block"
  document.getElementById("register-form").style.display = "none"
}

// 회원가입 폼 표시
function showRegisterForm() {
  document.getElementById("login-form").style.display = "none"
  document.getElementById("register-form").style.display = "block"
}

// 로딩 상태 설정
function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId)
  const btnText = button.querySelector(".btn-text")
  const spinner = button.querySelector(".loading-spinner")

  if (isLoading) {
    btnText.style.display = "none"
    spinner.style.display = "flex"
    button.disabled = true
  } else {
    btnText.style.display = "block"
    spinner.style.display = "none"
    button.disabled = false
  }
}

// 로그인 처리
function handleLogin(event) {
  event.preventDefault()

  const id = document.getElementById("login-id").value
  const password = document.getElementById("login-password").value

  setLoading("login-btn", true)

  // 실제 구현에서는 서버 API 호출
  setTimeout(() => {
    const user = users.find((u) => u.id === id && u.password === password)

    if (user) {
      // 로그인 성공
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("username", id)
      window.location.href = "index.html"
    } else {
      // 로그인 실패
      alert("아이디 또는 비밀번호가 올바르지 않습니다.")
      setLoading("login-btn", false)
    }
  }, 1000)
}

// 회원가입 처리
function handleRegister(event) {
  event.preventDefault()

  const id = document.getElementById("register-id").value
  const password = document.getElementById("register-password").value
  const confirmPassword = document.getElementById("register-confirm-password").value

  // 비밀번호 확인
  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.")
    return
  }

  // 아이디 중복 확인
  if (users.find((u) => u.id === id)) {
    alert("이미 존재하는 아이디입니다.")
    return
  }

  setLoading("register-btn", true)

  // 실제 구현에서는 서버 API 호출
  setTimeout(() => {
    // 새 사용자 추가
    users.push({ id, password })
    localStorage.setItem("users", JSON.stringify(users))

    alert("회원가입이 완료되었습니다. 로그인해주세요.")
    showLoginForm()
    setLoading("register-btn", false)

    // 폼 초기화
    document.getElementById("register-id").value = ""
    document.getElementById("register-password").value = ""
    document.getElementById("register-confirm-password").value = ""
  }, 1000)
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "index.html"
  }
})
