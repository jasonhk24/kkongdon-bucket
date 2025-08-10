const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const welfareRoutes = require('./routes/welfare');
const chatbotRoutes = require('./routes/chatbot');
const bucketRoutes = require('./routes/bucket');
const financeRoutes = require('./routes/finance');

const app = express();
const PORT = process.env.PORT || 5000;

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
    environment: process.env.NODE_ENV 
  });
});

// 라우트
app.use('/api/welfare', welfareRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/bucket', bucketRoutes);
app.use('/api/finance', financeRoutes);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});