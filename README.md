# 꽁돈버킷 - 절세로 꿈을 이루다

절세로 모은 꽁돈으로 버킷리스트를 이뤄보는 웹 애플리케이션입니다.

## 📋 주요 기능

- 📱 **버킷리스트 관리**: 목표 설정 및 진행률 추적
- 💰 **절세 현황 대시보드**: 실시간 절세 금액 및 월별 통계
- 🤖 **AI 세법 도우미**: Gemini API 기반 챗봇으로 절세 상담
- 📊 **맞춤 금융상품 추천**: 개인 상황에 맞는 상품 추천
- 🎯 **절세 미션**: 일일 절세 팁 및 마감 임박 정보

## 🛠 기술 스택

### Frontend
- React 18
- Tailwind CSS
- Lucide React (아이콘)
- Axios (API 통신)

### Backend
- Node.js
- Express.js
- Google Generative AI (Gemini)
- CSV Parser (복지 데이터 처리)

## 🚀 실행 방법

### 1. 의존성 설치

```bash
# 루트 디렉토리에서
npm install

# 서버 의존성 설치
cd server && npm install

# 클라이언트 의존성 설치 
cd ../client && npm install && npx tailwindcss init
```

### 2. 환경 변수 설정

`server/.env` 파일을 생성하고 다음을 설정하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

### 3. 애플리케이션 실행

```bash
# 루트 디렉토리에서 (프론트엔드 + 백엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run server  # 백엔드만
npm run client  # 프론트엔드만
```

### 4. 브라우저에서 확인

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

## 📁 프로젝트 구조

```
꽁돈버킷-app/
├── client/              # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── services/    # API 통신
│   │   ├── App.js       # 메인 컴포넌트
│   │   └── index.js
│   └── package.json
├── server/              # Express 백엔드
│   ├── routes/          # API 라우트
│   ├── services/        # 비즈니스 로직
│   ├── data/            # 데이터 파일
│   └── index.js
└── package.json         # 루트 설정
```

## 🔧 API 엔드포인트

### 버킷리스트 관리
- `GET /api/bucket` - 모든 버킷리스트 조회
- `POST /api/bucket` - 새 버킷리스트 생성
- `PUT /api/bucket/:id` - 버킷리스트 수정
- `DELETE /api/bucket/:id` - 버킷리스트 삭제

### 챗봇
- `POST /api/chatbot/chat` - 채팅 메시지 전송
- `GET /api/chatbot/faq` - 자주 묻는 질문

### 금융상품
- `GET /api/finance/products` - 금융상품 조회
- `GET /api/finance/products/recommended` - 추천 상품
- `GET /api/finance/tips` - 절세 팁

### 복지정보
- `GET /api/welfare/search` - 복지 정보 검색
- `GET /api/welfare/all` - 모든 복지 정보

## 🎯 주요 특징

1. **RAG 시스템**: 복지 CSV 데이터를 활용한 검색 기반 응답
2. **반응형 디자인**: 모바일 우선 설계
3. **실시간 애니메이션**: 카운트업 효과 및 진행률 표시
4. **AI 챗봇**: Gemini API를 활용한 자연어 상담
5. **더미 데이터**: 개발/테스트용 샘플 데이터 포함

## 📝 사용법

1. **온보딩**: 첫 방문 시 버킷리스트와 목표 금액 설정
2. **대시보드**: 절세 현황과 목표 달성률 확인
3. **챗봇 상담**: 절세 관련 질문으로 맞춤 조언 받기
4. **상품 추천**: 개인 상황에 맞는 금융상품 탐색

## 🌐 배포하기

### ⚡ 5분 만에 전 세계 접속 가능한 웹사이트 만들기

1. **GitHub 업로드**: 코드를 GitHub 저장소에 업로드
2. **Railway 백엔드 배포**: [Railway.app](https://railway.app)에서 GitHub 연동
3. **Vercel 프론트엔드 배포**: [Vercel.com](https://vercel.com)에서 GitHub 연동
4. **환경변수 설정**: Gemini API 키 및 URL 설정
5. **완료!** 📱 모바일에서도 바로 접속 가능

**상세 가이드**: [`quick-deploy.md`](./quick-deploy.md) 확인

### 📱 모바일 최적화

- **PWA 지원**: 홈 화면에 앱처럼 설치 가능
- **반응형 디자인**: 모든 화면 크기에 최적화
- **터치 인터페이스**: 모바일 사용성 완벽 지원
- **오프라인 대응**: 네트워크 오류 시에도 기본 기능 동작

## 🎯 실제 사용 시나리오

1. **회사에서**: 데스크톱으로 절세 계획 수립
2. **지하철에서**: 스마트폰으로 AI 세법 도우미 상담
3. **카페에서**: 태블릿으로 금융상품 비교
4. **집에서**: 가족과 함께 버킷리스트 업데이트

## ⚠️ 주의사항

- Gemini API 키가 필요합니다 (Google AI Studio에서 발급)
- 배포 시 환경변수 설정이 필요합니다
- 실제 금융상품 신청은 해당 기관에서 진행하세요

## 🚀 다음 단계

- [ ] 실제 사용자 테스트
- [ ] 피드백 수집 및 개선
- [ ] 추가 기능 개발
- [ ] 마케팅 및 배포

## 🤝 기여하기

이슈나 개선사항이 있으시면 언제든 연락해주세요!

## 📄 라이선스

MIT License
