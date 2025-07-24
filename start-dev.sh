#!/bin/bash

# SSSFarm Frontend 개발 환경 시작 스크립트

echo "🌱 SSSFarm Frontend 개발 환경을 시작합니다..."

# 환경 확인
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local 파일이 없습니다. 생성 중..."
    cat > .env.local << EOL
# FastAPI 서버 URL
NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com

# 개발 중 목 데이터 사용 (true/false)
NEXT_PUBLIC_USE_MOCK_DATA=false
EOL
    echo "✅ .env.local 파일이 생성되었습니다."
fi

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm install
fi

echo "🚀 개발 서버를 시작합니다..."
echo "📖 API 문서: https://sssfarm-fast-api.onrender.com/docs"
echo "🌐 프론트엔드: http://localhost:3000"
echo ""

# 개발 서버 시작
npm run dev
