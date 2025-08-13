const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// 라우트만 import (다른 서비스는 제외)
const welfareRoutes = require('./routes/welfare');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS 설정 (배포용)
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://kkongdon-bucket.vercel.app',
    'https://*.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

// 미들웨어
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      chatbot: process.env.GEMINI_API_KEY ? 'enabled' : 'fallback',
      database: 'memory',
      cors: 'enabled'
    },
    endpoints: ['/api/welfare', '/api/chatbot', '/api/bucket', '/api/finance', '/api/recommendation']
  });
});

// 라우트
app.use('/api/welfare', welfareRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: '꽁돈버킷 API 서버가 실행 중입니다!',
    version: '1.0.0',
    endpoints: {
      welfare: '/api/welfare',
      chatbot: '/api/chatbot',
      bucket: '/api/bucket',
      finance: '/api/finance'
    }
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API 엔드포인트를 찾을 수 없습니다.' });
});

// 에러 핸들링
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({ 
    error: '내부 서버 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, '127.0.0.1', (err) => {
  if (err) {
    console.error('❌ 서버 시작 실패:', err);
    process.exit(1);
  }
  console.log(`🚀 서버가 포트 ${PORT} (localhost)에서 실행 중입니다.`);
  console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`🤖 챗봇 기능: ${process.env.GEMINI_API_KEY ? '활성화' : '비활성화 (fallback 모드)'}`);
  console.log('⚡ 서버 준비 완료 - API 요청을 받을 수 있습니다!');
  
  // 서버 시작 후 데이터 로딩
  console.log('📊 데이터 로딩 시작...');
  
  // RAG 시스템 초기화를 백그라운드에서 실행 (임시 비활성화)
  // console.log('🔄 RAG 시스템 초기화 시작...');
  // ragService.initialize()
  //   .then(() => {
  //     console.log('🎉 RAG 시스템 초기화 완료!');
  //   })
  //   .catch((error) => {
  //     console.error('⚠️ RAG 시스템 초기화 실패 (fallback 모드로 운영):', error.message);
  //   });
});

// Vercel 서버리스 함수용 export
module.exports = app;