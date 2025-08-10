# ⚡ 5분 만에 배포하기

## 🎯 목표
전 세계 어디서나 접속 가능한 꽁돈버킷 웹앱 배포

## 🚀 초간단 배포 (GitHub 사용)

### 1️⃣ GitHub에 업로드 (1분)
```bash
# GitHub에 새 저장소 생성 후
cd 꽁돈버킷-app
git init
git add .
git commit -m "꽁돈버킷 앱 초기 배포"
git remote add origin https://github.com/your-username/kkongdon-bucket.git
git push -u origin main
```

### 2️⃣ Railway 백엔드 배포 (2분)
1. [Railway.app](https://railway.app) 접속 → GitHub 로그인
2. "New Project" → "Deploy from GitHub repo"
3. 방금 올린 저장소 선택
4. **Variables** 탭에서 환경변수 추가:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=production
   FRONTEND_URL=https://kkongdon-bucket.vercel.app
   ```
5. 자동 배포 완료! URL 복사 📋

### 3️⃣ Vercel 프론트엔드 배포 (2분)
1. [Vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. "New Project" → 저장소 선택
3. **Configure Project**:
   - Root Directory: `client`
   - Framework: Create React App
4. **Environment Variables** 추가:
   ```
   REACT_APP_API_URL=https://your-railway-url.railway.app/api
   ```
5. "Deploy" 클릭! 🎉

## 📱 완성!

- **웹사이트**: `https://kkongdon-bucket.vercel.app`
- **모바일에서 바로 접속 가능!**
- **전 세계 어디서나 사용 가능!**

## 🔑 API 키 발급 (필수)

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. Railway Variables에 추가

## ✅ 체크리스트

- [ ] GitHub 저장소 생성 및 업로드
- [ ] Railway 배포 및 환경변수 설정
- [ ] Vercel 배포 및 API URL 설정
- [ ] Gemini API 키 발급 및 설정
- [ ] 모바일에서 접속 테스트

## 🛠 문제 해결

### Railway 배포 실패 시
- 저장소 루트에 `railway.json` 파일 확인
- 환경변수 올바른지 확인

### Vercel 빌드 실패 시
- Root Directory가 `client`로 설정되었는지 확인
- REACT_APP_API_URL 환경변수 확인

### API 연결 안 될 시
- Railway URL이 올바른지 확인
- `/api` 경로가 포함되었는지 확인

## 🎉 성공!

이제 친구들에게 URL을 공유하고 어디서나 꽁돈버킷을 사용할 수 있습니다!

**최종 URL**: `https://kkongdon-bucket.vercel.app` 🌐📱
