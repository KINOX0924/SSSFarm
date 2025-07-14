"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 간단한 유효성 검사
    if (!formData.username || !formData.password) {
      alert("아이디와 비밀번호를 입력해주세요.")
      setLoading(false)
      return
    }

    // 임시 로그인 처리 (실제로는 API 호출)
    setTimeout(() => {
      console.log("로그인 시도:", { username: formData.username, password: formData.password })

      // 임시 인증 (실제로는 서버에서 검증)
      if (formData.username === "admin" && formData.password === "1234") {
        alert("로그인 성공!")
        router.push("/")
      } else {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.")
      }
      setLoading(false)
    }, 1000)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 유효성 검사
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      alert("모든 필드를 입력해주세요.")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      setLoading(false)
      return
    }

    if (formData.password.length < 4) {
      alert("비밀번호는 4자 이상이어야 합니다.")
      setLoading(false)
      return
    }

    // 임시 회원가입 처리 (실제로는 API 호출)
    setTimeout(() => {
      console.log("회원가입 시도:", {
        username: formData.username,
        password: formData.password,
        email: formData.email,
      })

      alert("회원가입이 완료되었습니다! 로그인해주세요.")
      setIsLogin(true)
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
      })
      setLoading(false)
    }, 1000)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 text-4xl">🌱</div>
            <h1 className="text-3xl font-bold text-gray-900">SSSFarm</h1>
          </div>
          <p className="text-gray-600">스마트 농장 관리 시스템</p>
        </div>

        {/* Login/Signup Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{isLogin ? "로그인" : "회원가입"}</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              {isLogin ? "계정에 로그인하여 농장을 관리하세요" : "새 계정을 만들어 시작하세요"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              {/* 아이디 */}
              <div className="space-y-2">
                <Label htmlFor="username">아이디</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 이메일 (회원가입 시에만) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 (선택사항)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 비밀번호 확인 (회원가입 시에만) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
              </Button>
            </form>

            {/* 모드 전환 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 ml-1 h-auto font-semibold text-green-600 hover:text-green-700"
                  onClick={toggleMode}
                >
                  {isLogin ? "회원가입" : "로그인"}
                </Button>
              </p>
            </div>

            {/* 테스트 계정 안내 (개발용) */}
            {isLogin && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  <strong>테스트 계정:</strong> admin / 1234
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 SSSFarm. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
