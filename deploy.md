# 🚀 꽁돈버킷 배포 가이드

무료로 웹에 배포하여 어디서나 접속 가능한 프로토타입을 만들어보세요!

## 📋 배포 순서

### 1단계: 백엔드 배포 (Railway) 🚂

1. [Railway](https://railway.app) 회원가입
2. GitHub 연동 후 이 프로젝트 연결
3. 환경변수 설정:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://kkongdon-bucket.vercel.app
   ```
4. 자동 배포 완료!

### 2단계: 프론트엔드 배포 (Vercel) ⚡

1. [Vercel](https://vercel.com) 회원가입
2. GitHub 연동 후 이 프로젝트 연결
3. 빌드 설정:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. 환경변수 설정:
   ```
   REACT_APP_API_URL=https://your-railway-url.railway.app/api
   GENERATE_SOURCEMAP=false
   ```
5. 배포 완료!

## 🔧 상세 설정 방법

### Railway 백엔드 배포

1. **프로젝트 생성**
   - Railway 대시보드에서 "New Project"
   - "Deploy from GitHub repo" 선택
   - 꽁돈버킷-app 저장소 선택

2. **환경변수 설정**
   ```bash
   # Railway 대시보드 > Variables 탭에서 추가
   GEMINI_API_KEY=AIzaSyB...    # Google AI Studio에서 발급
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://kkongdon-bucket.vercel.app
   ```

3. **빌드 설정**
   - Railway가 자동으로 감지하지만, 필요시 수동 설정:
   ```json
   {
     "buildCommand": "cd server && npm install",
     "startCommand": "cd server && npm start"
   }
   ```

### Vercel 프론트엔드 배포

1. **프로젝트 생성**
   - Vercel 대시보드에서 "New Project"
   - GitHub 저장소 선택
   - **Root Directory**: `client` 설정

2. **빌드 설정**
   ```
   Framework: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **환경변수 설정**
   ```bash
   # Vercel 대시보드 > Settings > Environment Variables
   REACT_APP_API_URL=https://your-app-name.railway.app/api
   GENERATE_SOURCEMAP=false
   ```

## 🌐 배포 후 접속 URL

- **프론트엔드**: `https://kkongdon-bucket.vercel.app`
- **백엔드 API**: `https://your-app-name.railway.app`

## ⚠️ 중요한 설정들

### 1. CORS 설정
백엔드에서 Vercel 도메인을 허용하도록 설정됨:
```javascript
const corsOptions = {
  origin: [
    'https://kkongdon-bucket.vercel.app',
    'https://*.vercel.app'
  ]
};
```

### 2. API URL 설정
프론트엔드에서 배포된 백엔드 URL을 사용:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

### 3. Health Check
배포 상태 확인: `https://your-backend-url.railway.app/health`

## 🔄 업데이트 방법

1. **코드 수정 후 GitHub에 푸시**
2. **Railway & Vercel이 자동으로 재배포**
3. **몇 분 후 변경사항 반영**

## 📱 모바일 접속

배포 후 생성된 URL을 통해:
- 📱 스마트폰 브라우저에서 바로 접속
- 💻 태블릿에서 접속  
- 🌍 전 세계 어디서나 접속 가능

## 🛠 트러블슈팅

### API 연결 실패 시
1. Railway 백엔드 URL이 올바른지 확인
2. 환경변수 REACT_APP_API_URL 확인
3. Railway 서비스가 실행 중인지 확인

### 빌드 실패 시
1. 로컬에서 `npm run build` 테스트
2. Node.js 버전 호환성 확인
3. 의존성 충돌 확인

### Gemini API 오류 시
1. API 키가 올바른지 확인
2. Google AI Studio에서 할당량 확인
3. Railway 환경변수에 키가 제대로 설정되었는지 확인

## 🎉 완료!

이제 전 세계 어디서나 접속 가능한 꽁돈버킷 프로토타입이 완성되었습니다!

**최종 URL**: `https://kkongdon-bucket.vercel.app` 🎯
