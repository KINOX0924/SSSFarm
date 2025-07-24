# SSSFarm Frontend

SSSFarm 스마트 농장 관리 시스템의 React/Next.js 프론트엔드입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
# 또는
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 추가하세요:

```env
# FastAPI 서버 URL
NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com

# 개발 중 목 데이터 사용 (선택사항)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 3. 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)를 열어 확인하세요.

## 🔗 API 연동

### FastAPI 서버와 연결

이 프론트엔드는 다음 FastAPI 서버와 통신합니다:
- **Production**: `https://sssfarm-fast-api.onrender.com`
- **API 문서**: `https://sssfarm-fast-api.onrender.com/docs`

### 주요 API 엔드포인트

- `GET /positions/` - 위치 목록 조회
- `GET /positions/{id}/sensors/latest` - 최신 센서 데이터
- `GET /positions/{id}/devices` - 기기 목록
- `POST /devices/{id}/control` - 기기 제어
- `GET /positions/{id}/logs` - 이벤트 로그

## 🛠️ 개발 설정

### 목 데이터 사용

API 서버가 준비되지 않았거나 오프라인에서 개발할 때 목 데이터를 사용할 수 있습니다:

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### 디버깅

개발 모드에서는 자동으로 API 연결 상태가 콘솔에 표시됩니다:

```
🌱 SSSFarm API 준비 완료: https://sssfarm-fast-api.onrender.com
📖 API 문서: https://sssfarm-fast-api.onrender.com/docs
```

## 📁 프로젝트 구조

```
├── app/                    # Next.js 앱 라우터
│   ├── page.tsx           # 메인 대시보드
│   ├── login/page.tsx     # 로그인 페이지
│   ├── gallery/page.tsx   # 갤러리 페이지
│   ├── logs/page.tsx      # 로그 페이지
│   └── presets/page.tsx   # 설정 페이지
├── components/ui/          # UI 컴포넌트 (shadcn/ui)
├── hooks/
│   └── api.ts             # API 관련 React 훅
├── lib/
│   ├── api/
│   │   ├── client.ts      # HTTP 클라이언트
│   │   ├── services.ts    # API 서비스 함수
│   │   ├── types.ts       # TypeScript 타입 정의
│   │   ├── mock.ts        # 목 데이터
│   │   └── debug.ts       # 디버깅 유틸리티
│   └── utils.ts           # 공통 유틸리티
└── public/                # 정적 파일
```

## 🎨 UI 컴포넌트

이 프로젝트는 다음 UI 라이브러리를 사용합니다:

- **Tailwind CSS**: 스타일링
- **shadcn/ui**: React 컴포넌트 라이브러리
- **Lucide React**: 아이콘
- **Radix UI**: 기본 컴포넌트

## 🔄 주요 기능

### 1. 실시간 모니터링
- 센서 데이터 자동 갱신 (5초마다)
- API 연결 상태 실시간 표시
- 온라인/오프라인 기기 상태

### 2. 기기 제어
- LED 조명 제어
- 급수펌프 제어
- 환기팬 제어
- 실시간 상태 업데이트

### 3. 이벤트 로깅
- 자동 이벤트 기록
- 시간순 정렬
- 실시간 로그 갱신 (30초마다)

### 4. 다중 위치 지원
- 여러 온실/위치 관리
- 위치별 독립적인 모니터링
- 위치 선택 UI

## 🔧 API 연동 가이드

### 기본 사용법

```typescript
import { usePositions, useSensorData, useDevices } from '@/hooks/api'

function MyComponent() {
  const { positions, loading, error } = usePositions()
  const { sensorData } = useSensorData(positionId)
  const { devices, controlDevice } = useDevices(positionId)
  
  const handleDeviceControl = async (deviceId: number, isEnabled: boolean) => {
    try {
      await controlDevice(deviceId, 'power', isEnabled)
    } catch (error) {
      console.error('제어 실패:', error)
    }
  }
  
  // ...
}
```

### 커스텀 API 호출

```typescript
import { positionsApi, sensorsApi } from '@/lib/api/services'

// 위치 생성
const newPosition = await positionsApi.create({
  name: '새 온실',
  description: '테스트 온실'
})

// 센서 데이터 조회
const sensors = await sensorsApi.getByPosition(positionId)
```

## 🐛 문제 해결

### API 연결 실패

1. **네트워크 확인**: API 서버가 실행 중인지 확인
2. **CORS 설정**: FastAPI 서버의 CORS 설정 확인
3. **환경 변수**: `.env.local` 파일의 API URL 확인
4. **목 데이터**: 임시로 `NEXT_PUBLIC_USE_MOCK_DATA=true` 설정

### 개발 모드 디버깅

브라우저 개발자 도구의 콘솔을 확인하세요:

```
🔍 API Response: /positions
Data: [...]

❌ API Error: /positions/{id}/sensors
Error: Failed to fetch
```

### 빌드 오류

```bash
# TypeScript 오류 무시 (임시)
npm run build -- --ignore-build-errors

# ESLint 오류 무시 (임시)
npm run build -- --ignore-eslint
```

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 import
3. 환경 변수 설정:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com
   ```
4. 배포 실행

### 다른 플랫폼

```bash
# 빌드
npm run build

# 정적 export (필요시)
npm run export
```

## 📋 TODO

- [ ] 사용자 인증 시스템 구현
- [ ] 실시간 알림 시스템
- [ ] 데이터 시각화 차트
- [ ] 모바일 반응형 개선
- [ ] PWA 지원
- [ ] 다국어 지원

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. **API 서버 상태**: `https://sssfarm-fast-api.onrender.com/docs`
2. **GitHub Issues**: 기존 이슈 확인
3. **개발자 도구**: 브라우저 콘솔 및 네트워크 탭

---

**SSSFarm Team** 🌱
