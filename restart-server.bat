@echo off
echo 🔄 Next.js 개발 서버를 재시작합니다...
echo ⚠️  설정 변경으로 인해 서버 재시작이 필요합니다.
echo.
echo 1. 현재 실행 중인 서버를 중지하세요 (Ctrl+C)
echo 2. 다음 명령어로 서버를 재시작하세요:
echo.
echo    npm run dev
echo.
echo 3. 브라우저에서 다음을 확인하세요:
echo    - 메인 대시보드: http://localhost:3000
echo    - API 테스트: http://localhost:3000/api-test
echo.
echo 🔧 CORS 문제 해결을 위해 프록시를 설정했습니다:
echo    - 프론트엔드 -^> /api/backend/* -^> FastAPI 서버
echo    - 이제 CORS 없이 API에 접근할 수 있습니다!
echo.
echo 📖 백엔드 API 문서: https://sssfarm-fast-api.onrender.com/docs
echo.
pause
