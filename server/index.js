// 전역 에러 핸들러 - 모든 처리되지 않은 예외를 잡아냅니다
process.on('uncaughtException', (err, origin) => {
  console.error(`
  ================================================
  💥 치명적인 예외 발생! (Uncaught Exception)
  ------------------------------------------------
  에러: ${err}
  원인: ${origin}
  스택: ${err.stack}
  ================================================
  `);
  // process.exit(1); // 서버 종료 비활성화 - 로그만 출력
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`
  ================================================
  💥 처리되지 않은 프로미스 거부! (Unhandled Rejection)
  ------------------------------------------------
  이유: ${reason}
  ================================================
  `);
  // process.exit(1); // 서버 종료 비활성화 - 로그만 출력
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// 라우트만 import (다른 서비스는 제외)
const welfareRoutes = require('./routes/welfare');
const recommendationRoutes = require('./routes/recommendation');

// 데이터 서비스 import
const welfareDataService = require('./services/welfareDataService');

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
app.use('/api/recommendation', recommendationRoutes);

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
  
  // 간단한 데이터 로딩 표시
  console.log('📊 데이터 로딩 시작...');
  console.log('✅ 기본 서비스 준비 완료');
  console.log('🎉 서버가 모든 요청을 처리할 준비가 되었습니다.');
  
  // 복지 데이터는 나중에 백그라운드에서 로딩
  setTimeout(async () => {
    try {
      await welfareDataService.loadWelfareData();
      console.log(`✅ 복지 데이터 준비 완료 (${welfareDataService.getDataCount()}개 항목)`);
    } catch (error) {
      console.error('❌ 복지 데이터 로딩 실패:', error.message);
    }
  }, 1000);
  
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