# 꽁돈버킷 앱 시작 가이드

## 🚀 빠른 시작

### 1단계: 자동 설정 실행
```bash
cd 꽁돈버킷-app
node setup.js
```

### 2단계: API 키 설정
`server/.env` 파일을 열고 실제 Gemini API 키로 변경:
```env
GEMINI_API_KEY=your_real_api_key_here
PORT=5000
NODE_ENV=development
```

### 3단계: 앱 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속!

## 🔑 Gemini API 키 발급 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 키를 `server/.env`에 설정

## 📱 주요 기능 사용법

### 온보딩
- 첫 방문 시 원하는 버킷리스트와 목표 금액 입력
- "시작하기" 버튼으로 대시보드로 이동

### 대시보드
- 실시간 절세 현황 확인
- 목표 달성률 애니메이션 확인
- 오늘의 절세 미션 체크

### 세법 도우미 (챗봇)
- 자연어로 절세 관련 질문
- AI가 복지 데이터를 기반으로 답변
- 자주 묻는 질문 바로 클릭

### 맞춤 추천
- 개인 상황에 맞는 금융상품 추천
- 예상 절세액 확인
- 신청 방법 안내

## 🛠 개발자 정보

- 프론트엔드: React 18 + Tailwind CSS
- 백엔드: Node.js + Express
- AI: Google Gemini API
- 데이터: 실제 복지 CSV + 더미 금융상품

## 📞 문제 해결

### 포트 충돌 시
```bash
# 다른 포트로 실행
PORT=5001 npm run server
```

### API 키 오류 시
- .env 파일 존재 확인
- API 키 유효성 확인
- 인터넷 연결 확인

### 데이터 로드 실패 시
```bash
cd server
node scripts/processWelfareData.js
```

행복한 절세 생활 되세요! 🎯💰
