const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// 채팅 메시지 처리
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    
    console.log('📨 채팅 요청:', { message: message?.substring(0, 50), contextLength: context.length });

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다.'
      });
    }

    const response = await geminiService.chat(message, context);
    
    console.log('✅ 채팅 응답 성공:', { success: response.success, messageLength: response.message?.length });
    
    res.json({
      success: true,
      data: {
        message: response.message,
        relevantInfo: response.relevantInfo || [],
        timestamp: new Date().toISOString(),
        source: response.success ? 'gemini' : 'fallback'
      }
    });

  } catch (error) {
    console.error('❌ 채팅 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '채팅 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 빠른 응답 가져오기
router.get('/quick-response/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const response = await geminiService.getQuickResponse(category);
    
    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('빠른 응답 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '빠른 응답 처리 중 오류가 발생했습니다.'
    });
  }
});

// 자주 묻는 질문
router.get('/faq', (req, res) => {
  const faqData = [
    {
      id: 1,
      question: "연말정산 공제 항목이 뭐가 있나요?",
      answer: "의료비, 교육비, 기부금, 월세 등 다양한 공제 항목이 있어요.",
      category: "tax"
    },
    {
      id: 2,
      question: "청년도약계좌 조건이 어떻게 되나요?",
      answer: "만 19~34세, 기준중위소득 180% 이하 청년이 가입 가능해요.",
      category: "youth"
    },
    {
      id: 3,
      question: "홈택스에서 증빙서류는 어떻게 올리나요?",
      answer: "홈택스 로그인 > 신고/납부 > 연말정산간소화에서 업로드할 수 있어요.",
      category: "procedure"
    },
    {
      id: 4,
      question: "국민카드 세액공제 혜택은 뭐가 있나요?",
      answer: "대중교통, 의료비, 교육비 등에서 세액공제 혜택을 받을 수 있어요.",
      category: "finance"
    }
  ];

  res.json({
    success: true,
    data: faqData
  });
});

module.exports = router;
