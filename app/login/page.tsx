"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login, saveToken, saveUserInfo, getCurrentUser, isAuthenticated } from "@/lib/api/auth"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // 입력 시 에러 메시지 제거
    if (error) {
      setError(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 간단한 유효성 검사
    if (!formData.username || !formData.password) {
      setError("아이디와 비밀번호를 입력해주세요.")
      setLoading(false)
      return
    }

    try {
      // API 로그인 시도
      const loginResponse = await login({
        username: formData.username,
        password: formData.password
      })

      console.log('Login response:', loginResponse)

      // 토큰 저장
      saveToken(loginResponse.access_token)

      // 사용자 정보 가져오기 (username 전달)
      try {
        const userInfo = await getCurrentUser(loginResponse.access_token, formData.username)
        if (userInfo) {
          saveUserInfo(userInfo)
          console.log('User info saved:', userInfo)
        } else {
          console.log('User info not available, using token only')
        }
      } catch (userError) {
        console.warn('Failed to fetch user info:', userError)
        // 사용자 정보 가져오기 실패해도 로그인은 계속 진행
      }

      // 로그인 성공
      alert("로그인 성공!")
      router.push("/")
      
    } catch (apiError) {
      console.error('API Login failed:', apiError)
      
      // API 로그인 실패 시 로컬 인증 시도 (백업)
      if (formData.username === 'admin' && formData.password === 'admin') {
        console.log('Using fallback local authentication')
        sessionStorage.setItem('isLoggedIn', 'true')
        alert("로그인 성공! (로컬 인증)")
        router.push("/")
      } else {
        setError(apiError instanceof Error ? apiError.message : '로그인에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <CardTitle className="text-2xl font-bold">SSSFarm 로그인</CardTitle>
          <p className="text-gray-600">스마트팜 관리 시스템에 로그인하세요</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">아이디</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>테스트 계정:</p>
            <p>아이디: admin / 비밀번호: admin</p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              API 인증 상태: 
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                활성화됨
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              API 우선, 로컬 백업
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
