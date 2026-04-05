# Free-B Admin Web

운영자(관리자)가 수업 생성·배정, 강사 관리, 전자 계약 발송, 정산 확인까지 전체 업무를 처리하는 어드민 웹 대시보드입니다.

관련 저장소: [강사 앱](https://github.com/Douce1/AppWebProject) · [백엔드 API](https://github.com/kimi26yg/free-b) · [랜딩 페이지](https://github.com/kimi26yg/freebee-landing)

---

## 스크린샷

### 종합 대시보드
![대시보드](../screenshots/web-updated-dashboard.png)

### 수업 관리 — 새 수업 생성 (3단계 플로우)
![수업 생성](../screenshots/schedules-modal.png)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 종합 대시보드 | 오늘 수업 수, 미확정 수업, 이번 달 예상 지급액 등 운영 현황 한눈에 확인 |
| 수업 관리 | 날짜·장소·시간 기반 수업 생성 및 캘린더 뷰 관리 |
| 강사 관리 | 강사 프로필, 가용 일정, 계약 이력, 배정 상태 통합 조회 |
| 배정 요청 | 가용 강사 필터링 후 수업 배정 요청 발송 및 수락 상태 추적 |
| 전자 계약 | 계약서 초안 생성 → 강사 발송 → 서명 상태 실시간 추적 → PDF 다운로드 |
| 실시간 채팅 | Socket.IO 기반 강사와의 1:1 채팅 |
| 정산 관리 | 수업 완료 후 강사별 정산 금액 집계 및 지급 상태 관리 |
| Live 체크인 | 강사 출발·도착 위치를 대시보드에서 실시간 확인 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | MUI (Material-UI), Tailwind CSS, Emotion |
| Data Fetching | TanStack Query (React Query) |
| Calendar | FullCalendar |
| Real-time | Socket.IO Client |
| Auth | JWT (Access/Refresh Token) |

---

## 아키텍처

```
web/
├── app/                  # Next.js App Router 페이지
│   ├── (auth)/           # 로그인 화면
│   └── (dashboard)/      # 인증 후 메인 레이아웃
│       ├── dashboard/    # 종합 대시보드
│       ├── instructors/  # 강사 관리
│       ├── schedules/    # 수업 관리
│       ├── contracts/    # 계약 관리
│       ├── settlements/  # 정산 관리
│       └── settings/     # 설정
└── src/
    ├── components/       # 재사용 UI 컴포넌트
    ├── hooks/            # 커스텀 훅 (API 연동)
    └── types/            # 공유 TypeScript 타입
```

---

## 실행 방법

```bash
cd web

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm run start
```

---

## 환경 변수

`.env.local` 파일을 `web/` 루트에 생성하세요.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API 서버 주소 |
