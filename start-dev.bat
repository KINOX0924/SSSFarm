@echo off
echo 🌱 SSSFarm Frontend 개발 환경을 시작합니다...

REM 환경 파일 확인
if not exist ".env.local" (
    echo ⚠️  .env.local 파일이 없습니다. 생성 중...
    (
        echo # FastAPI 서버 URL
        echo NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com
        echo.
        echo # 개발 중 목 데이터 사용 ^(true/false^)
        echo NEXT_PUBLIC_USE_MOCK_DATA=false
    ) > .env.local
    echo ✅ .env.local 파일이 생성되었습니다.
)

REM 의존성 설치 확인
if not exist "node_modules" (
    echo 📦 의존성을 설치합니다...
    npm install
)

echo 🚀 개발 서버를 시작합니다...
echo 📖 API 문서: https://sssfarm-fast-api.onrender.com/docs
echo 🌐 프론트엔드: http://localhost:3000
echo.

REM 개발 서버 시작
npm run dev

pause
