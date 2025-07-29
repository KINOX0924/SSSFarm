# 🌱 SSSFarm - 스마트농장 관리 시스템

## 📋 프로젝트 개요

SSSFarm은 IoT 기반 스마트농장을 위한 종합 관리 시스템입니다. 실시간 센서 모니터링, 기기 제어, 프리셋 관리, 갤러리, 로그 분석 등의 기능을 제공하여 농장 운영을 효율적으로 관리할 수 있습니다.

### 🎯 주요 특징

- **실시간 모니터링**: 온도, 습도, 토양습도, 조도, 물탱크 수위 실시간 추적
- **스마트 제어**: LED 조명, 급수펌프, 환기팬 등 기기 원격 제어
- **자동화 시스템**: 사용자 맞춤 프리셋을 통한 자동 농장 관리
- **시각적 모니터링**: 식물 성장 과정 이미지 갤러리
- **상세 로그**: 모든 시스템 활동 기록 및 분석

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (Radix UI 기반)
- **Icons**: Lucide React 0.454.0
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **HTTP Client**: Fetch API with custom wrapper

### Backend Integration
- **API Server**: FastAPI (Python)
- **API URL**: `https://sssfarm-fast-api.onrender.com`
- **Authentication**: JWT (OAuth2 Bearer Token)
- **Data Format**: JSON with UTF-8 encoding

### Development Tools
- **Package Manager**: pnpm
- **Build Tool**: Next.js built-in bundler
- **Linting**: ESLint (disabled during builds)
- **Type Checking**: TypeScript (build errors ignored for development)

## 📁 프로젝트 구조

```
SSSFarm-front/
├── 📱 app/                           # Next.js App Router
│   ├── page.tsx                     # 🏠 메인 대시보드
│   ├── login/page.tsx               # 🔐 로그인 페이지
│   ├── presets/page.tsx             # ⚙️ 설정 관리 (기기 + 프리셋)
│   ├── gallery/page.tsx             # 🖼️ 이미지 갤러리
│   ├── logs/page.tsx                # 📝 시스템 로그
│   ├── api/                         # API 프록시 라우트
│   ├── layout.tsx                   # 레이아웃 설정
│   └── globals.css                  # 글로벌 스타일
├── 🧩 components/                    # 재사용 가능한 컴포넌트
│   ├── ui/                          # shadcn/ui 컴포넌트 모음
│   └── theme-provider.tsx           # 테마 프로바이더
├── 🎣 hooks/                         # 커스텀 React 훅
│   ├── useDashboard.ts              # 대시보드 로직
│   ├── useSettings.ts               # 설정 관리 로직
│   ├── useGallery.ts                # 갤러리 로직
│   └── api.ts                       # API 훅
├── 📡 lib/                           # 핵심 라이브러리
│   ├── api/                         # API 연동 모듈
│   │   ├── client.ts                # HTTP 클라이언트
│   │   ├── auth.ts                  # 인증 관리
│   │   ├── dashboard.ts             # 대시보드 API
│   │   ├── presets.ts               # 프리셋 API
│   │   ├── gallery.ts               # 갤러리 API
│   │   ├── logs.ts                  # 로그 API
│   │   └── types.ts                 # TypeScript 타입 정의
│   └── utils.ts                     # 유틸리티 함수
├── 🎨 styles/                        # 스타일 파일
├── 🔧 public/                        # 정적 파일
└── ⚙️ 설정 파일들
    ├── next.config.mjs              # Next.js 설정
    ├── tailwind.config.ts           # Tailwind 설정
    ├── tsconfig.json                # TypeScript 설정
    ├── package.json                 # 프로젝트 의존성
    └── .env.local                   # 환경 변수
```

## 🌟 핵심 기능

### 1. 📊 실시간 대시보드
- **센서 데이터 모니터링**: 온도, 습도, 조도, 토양습도(×2), 물탱크 수위
- **스마트 상태 판단**: 4개 센서값 기반 자동 상태 평가 (😊 매우좋음/🙂 보통/😟 주의)
- **기기 제어 패널**: LED 조명, 급수펌프 1/2, 환기팬 원격 제어
- **10초 타이머 시스템**: 연속 클릭 방지 및 하드웨어 보호
- **실시간 갱신**: 1분마다 센서 데이터 자동 새로고침
- **이벤트 로그**: 최근 기기 활동 내역 실시간 표시

### 2. ⚙️ 설정 관리
**기기 관리**
- 스마트팜 기기 등록 및 관리
- 온라인/오프라인 상태 실시간 모니터링
- HD 기기 자동 필터링 (카메라 등 제외)
- 기기별 위치 및 MAC 주소 관리

**프리셋 관리**
- 사용자 맞춤 자동화 설정 생성/수정/삭제
- **LED 조명 제어**: 시간/조도 기반 자동 제어
- **환기팬 제어**: 온도 기반 자동 작동
- **급수펌프 제어**: 토양습도 기반 자동 급수
- 기기별 프리셋 적용 및 실시간 동기화

### 3. 🖼️ 이미지 갤러리
- **기기별 식물 이미지**: 성장 과정 시각적 추적
- **고급 필터링**: 날짜+시간 범위 세밀 조정
  - 특정 날짜의 특정 시간대 (예: 2024-01-24 09:00 ~ 18:00)
  - 여러 날에 걸친 전체 범위 (예: 2024-01-20 ~ 2024-01-25)
- **다양한 보기 모드**: 그리드뷰, 슬라이드쇼
- **이미지 다운로드**: 고화질 원본 이미지 저장
- **자동 갱신**: 5분마다 새 이미지 확인

### 4. 📝 시스템 로그
- **액션 로그**: 모든 기기 제어 이력 추적
- **스마트 필터링**: 기기별, 날짜별 세밀한 조회
- **실시간 검색**: 트리거, 작동내용 키워드 검색
- **CSV 내보내기**: 분석용 데이터 다운로드
- **한글 인코딩**: UTF-8 완벽 지원으로 한글 깨짐 방지
- **종료날짜 포함**: 설정한 날짜 하루 전체(00:00~23:59) 포함

### 5. 🔐 보안 인증
- **JWT 기반 인증**: OAuth2 표준 준수
- **자동 로그인 유지**: 토큰 기반 세션 관리
- **보안 토큰 관리**: 안전한 로컬 스토리지 활용

## 🎨 사용자 인터페이스

### 디자인 시스템
- **모던 UI**: shadcn/ui 컴포넌트 라이브러리 기반
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- **다크 모드 지원**: 사용자 선호도 기반 테마 전환
- **접근성**: Radix UI 기반 키보드 네비게이션 지원

### 시각적 피드백
- **로딩 상태**: 스켈레톤 UI와 로딩 애니메이션
- **상태 표시**: 색상 기반 직관적 상태 구분
- **알림 시스템**: 토스트 메시지와 얼럿 다이얼로그
- **아이콘 시스템**: Lucide React 일관된 아이콘 사용

## 🔧 설치 및 실행

### 1. 환경 요구사항
- **Node.js**: 18.17 이상
- **pnpm**: 8.0 이상 (권장)
- **브라우저**: Chrome 100+, Firefox 100+, Safari 15+

### 2. 프로젝트 복제
```bash
git clone <repository-url>
cd SSSFarm-front
```

### 3. 의존성 설치
```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm 사용
npm install
```

### 4. 환경 변수 설정
`.env.local` 파일 생성:
```env
# FastAPI 서버 URL
NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com

# 프록시 사용 안 함 (직접 API 호출)
NEXT_PUBLIC_USE_PROXY=false

# 목 데이터 사용 안 함 (실제 API 사용)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 5. 개발 서버 실행
```bash
# 개발 모드
pnpm dev

# 브라우저에서 http://localhost:3000 접속
```

### 6. 프로덕션 빌드
```bash
# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 🔗 API 연동

### 엔드포인트 구조
```typescript
// 인증
POST /token                              // 로그인
GET  /users/                            // 사용자 목록

// 기기 관리
GET  /devices/                          // 기기 목록
POST /devices/                          // 기기 생성
GET  /devices/{id}/historical-data      // 센서 데이터
POST /devices/{id}/control              // 기기 제어

// 프리셋 관리
GET  /users/{user_id}/user-presets/     // 사용자 프리셋
POST /user-presets/                     // 프리셋 생성
PUT  /user-presets/{preset_id}          // 프리셋 수정
DELETE /user-presets/{preset_id}        // 프리셋 삭제
PUT  /devices/{device_id}/apply-user-preset/{preset_id} // 프리셋 적용

// 갤러리
GET  /devices/{id}/images               // 기기별 이미지

// 로그 (기기 정보에 포함)
// action_logs 필드를 통해 액션 로그 조회
```

### 인증 헤더
```typescript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json; charset=utf-8'
}
```

## 🎯 주요 기능 상세

### 10초 타이머 시스템
하드웨어 보호를 위한 연속 클릭 방지 시스템
```typescript
// 컴포넌트별 독립적 타이머
const [componentTimers, setComponentTimers] = useState<{[key: string]: number}>({})

// 타이머 시작 함수
const startComponentTimer = (componentName: string) => {
  setComponentTimers(prev => ({ ...prev, [componentName]: 10 }))
  // 1초마다 카운트다운
}

// 사용자 피드백
if (componentTimers['led']) {
  return "명령 전송 중... (8초)"
}
```

### 스마트 상태 판단
4개 센서값 기반 자동 농장 상태 평가
```typescript
const tempGood = temp >= 20 && temp <= 25
const humidityGood = humidity >= 40 && humidity <= 60
const soil1Good = soil1 >= 2718 && soil1 <= 3177
const soil2Good = soil2 >= 2718 && soil2 <= 3177

const goodCount = [tempGood, humidityGood, soil1Good, soil2Good].filter(Boolean).length

if (goodCount >= 3) return "😊 매우 좋음"
if (goodCount >= 2) return "🙂 보통"
return "😟 주의 필요"
```

### 날짜 필터링 시스템
종료날짜 포함 정확한 날짜 범위 처리
```typescript
// 종료날짜 하루 전체 포함
if (endDate) {
  const endDateTime = new Date(endDate)
  endDateTime.setDate(endDateTime.getDate() + 1) // 다음날 00:00
  const nextDay = endDateTime.toISOString().split('T')[0]
  
  if (log.date >= nextDay) {
    return false // 다음날 이상만 제외
  }
}
```

## 🔄 상태 관리

### 커스텀 훅 활용
```typescript
// 대시보드 데이터
const { devices, loading, error, refetch } = useDashboardDevices()
const { sensorData } = useDeviceSensorData(deviceId, true) // 자동 갱신
const { controlStatus, controlDevice } = useDeviceControlStatus(deviceId)

// 설정 관리
const { presets, addPreset, editPreset, removePreset } = usePresets()
const { devices, addDevice, deleteDevice } = useDevices()

// 갤러리
const { images, loading, filters } = useGalleryImages(deviceId)
```

### 실시간 데이터 갱신
```typescript
// 1분마다 센서 데이터 갱신
useEffect(() => {
  if (autoRefresh && deviceId) {
    const interval = setInterval(fetchSensorData, 60000)
    return () => clearInterval(interval)
  }
}, [autoRefresh, deviceId])
```

## 🛠️ 개발 가이드

### 새로운 페이지 추가
1. `app/` 폴더에 새 폴더 생성
2. `page.tsx` 파일 작성
3. 네비게이션 바에 링크 추가

### API 통합
1. `lib/api/` 폴더에 새 API 모듈 생성
2. `types.ts`에 TypeScript 타입 정의
3. 커스텀 훅으로 API 로직 캡슐화

### UI 컴포넌트 추가
```bash
# shadcn/ui 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## 🐛 문제 해결

### 일반적인 문제들

**1. API 연결 실패**
```bash
# 서버 상태 확인
curl https://sssfarm-fast-api.onrender.com/docs

# 환경 변수 확인
cat .env.local
```

**2. 인증 오류**
```javascript
// 브라우저 콘솔에서 토큰 확인
console.log(localStorage.getItem('access_token'))

// 토큰 초기화
localStorage.clear()
```

**3. 한글 깨짐**
- API 응답에서 UTF-8 인코딩 확인
- 브라우저 개발자 도구에서 Network 탭 Response 확인

**4. 날짜 필터링 오류**
- 브라우저 콘솔에서 필터링 디버그 로그 확인
- 로그 데이터의 날짜 형식 검증

### 디버깅 도구

**콘솔 로그 활용**
```typescript
// API 요청/응답 추적
🔄 API Request: GET /devices/
🔑 Token: Present
✅ API Success: GET /devices/

// 필터링 과정 추적
🔍 필터링 전 로그: 50개
📅 필터 조건: 기기=all, 시작=2024-01-24, 종료=2024-01-25
✅ 필터링 후 로그: 12개
📆 날짜별 로그: {"2024-01-24": 7, "2024-01-25": 5}
```

## 📦 배포

### Vercel 배포 (권장)
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 실행

### 환경 변수 (프로덕션)
```env
NEXT_PUBLIC_API_BASE_URL=https://sssfarm-fast-api.onrender.com
NEXT_PUBLIC_USE_PROXY=false
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 빌드 최적화
- 이미지 최적화: `next/image` 컴포넌트 사용
- 코드 분할: 동적 import 활용
- 캐싱: API 응답 캐싱 전략

## 📈 성능 최적화

### 로딩 성능
- **스켈레톤 UI**: 로딩 중 시각적 피드백
- **지연 로딩**: 이미지와 컴포넌트 지연 로딩
- **메모이제이션**: `useMemo`, `useCallback` 활용

### 네트워크 최적화
- **자동 갱신**: 필요한 데이터만 정기적 갱신
- **오류 처리**: 네트워크 오류 시 재시도 로직
- **캐싱**: 브라우저 캐시 활용

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

### 개발 규칙
- **TypeScript**: 타입 안정성 준수
- **ESLint**: 코드 스타일 일관성
- **커밋 메시지**: 명확하고 설명적인 메시지
- **테스팅**: 새 기능에 대한 테스트 추가

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원 및 문의

### 문제 신고
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **API 문서**: `https://sssfarm-fast-api.onrender.com/docs`
- **서버 상태**: `https://sssfarm-fast-api.onrender.com/health`

### 개발팀 연락처
- **프로젝트 관리자**: [연락처 정보]
- **기술 지원**: [기술 지원 이메일]
- **버그 신고**: [버그 신고 이메일]

---

<div align="center">

**🌱 SSSFarm으로 스마트한 농장 관리를 시작하세요! 🌱**

Made with ❤️ by SSSFarm Team

</div>
