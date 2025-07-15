"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [currentCredentials, setCurrentCredentials] = useState({ username: 'admin', password: 'admin' })

  // 저장된 계정 정보 로드
  useEffect(() => {
    const savedCredentials = localStorage.getItem('adminCredentials')
    if (savedCredentials) {
      try {
        const parsedCredentials = JSON.parse(savedCredentials)
        setCurrentCredentials(parsedCredentials)
      } catch (e) {
        console.warn('저장된 계정 정보 로드 실패')
      }
    }
  }, [])

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

      // 저장된 계정 정보 확인
      const savedCredentials = localStorage.getItem('adminCredentials')
      let adminCredentials = { username: 'admin', password: 'admin' }
      
      if (savedCredentials) {
        try {
          adminCredentials = JSON.parse(savedCredentials)
        } catch (e) {
          console.warn('저장된 계정 정보 파싱 실패')
        }
      }

      // 인증 확인
      if (formData.username === adminCredentials.username && formData.password === adminCredentials.password) {
        sessionStorage.setItem('isLoggedIn', 'true')
        alert("로그인 성공!")
        router.push("/")
      } else {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.")
      }
      setLoading(false)
    }, 1000)
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

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">로그인</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              관리자 계정으로 로그인하여 농장을 관리하세요
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "처리 중..." : "로그인"}
              </Button>
            </form>

            {/* 테스트 계정 안내 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>관리자 계정:</strong> {currentCredentials.username} / {currentCredentials.password}
              </p>
            </div>
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
