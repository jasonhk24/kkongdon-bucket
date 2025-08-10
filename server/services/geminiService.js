const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataProcessor = require('./dataProcessor');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key 확인:', apiKey ? '설정됨' : '없음');
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
      this.genAI = null;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('Gemini AI 초기화 성공');
    } catch (error) {
      console.error('Gemini AI 초기화 실패:', error);
      this.genAI = null;
    }
    
    this.systemPrompt = `
당신은 한국의 절세 및 복지 제도 전문 상담사입니다. 
사용자의 질문에 대해 정확하고 도움이 되는 답변을 한국어로 제공해주세요.

주요 역할:
1. 절세 방법과 복지 혜택에 대한 상담
2. 연말정산, 세액공제, 소득공제 등 세무 관련 조언
3. 청년 지원 정책 안내
4. 금융상품 추천 및 비교

답변 시 주의사항:
- 친근하고 이해하기 쉬운 톤으로 답변
- 구체적인 금액이나 조건은 정확한 정보 확인 후 안내
- 개인 상황에 따라 달라질 수 있음을 명시
- 관련 기관이나 추가 확인이 필요한 경우 안내

현재 제공 가능한 주요 정보:
- 청년도약계좌, 월세 세액공제, 근로·자녀장려금 등
- 개인연금저축, 주택청약종합저축 등 금융상품
- 연말정산 준비 방법 및 절세 팁
`;
  }

  async chat(userMessage, context = []) {
    console.log('채팅 요청 받음:', userMessage);
    
    try {
      if (!this.genAI || !this.model) {
        console.log('Gemini AI 없음, fallback 사용');
        return this.getFallbackResponse(userMessage);
      }

      // 관련 복지 정보 검색
      const relevantWelfare = this.searchRelevantInfo(userMessage);
      console.log('관련 복지 정보 찾음:', relevantWelfare.length + '개');
      
      // 컨텍스트 구성
      let contextPrompt = this.systemPrompt;
      
      if (relevantWelfare.length > 0) {
        contextPrompt += `\n\n관련 복지/절세 정보:\n`;
        relevantWelfare.forEach(item => {
          contextPrompt += `- ${item.name}: ${item.summary}\n`;
          contextPrompt += `  혜택: ${item.benefits ? item.benefits.join(', ') : '정보 확인 필요'}\n`;
          contextPrompt += `  대상: ${item.target}\n\n`;
        });
      }

      // 이전 대화 컨텍스트 추가
      if (context.length > 0) {
        contextPrompt += `\n이전 대화:\n`;
        context.slice(-3).forEach(msg => {
          contextPrompt += `${msg.role}: ${msg.content}\n`;
        });
      }

      contextPrompt += `\n사용자 질문: ${userMessage}`;

      console.log('Gemini API 호출 시작...');
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini API 응답 성공');
      
      return {
        success: true,
        message: text,
        relevantInfo: relevantWelfare.slice(0, 3)
      };

    } catch (error) {
      console.error('Gemini API 오류 상세:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
      return this.getFallbackResponse(userMessage);
    }
  }

  searchRelevantInfo(query) {
    // 복지 정보 검색
    const welfareResults = dataProcessor.searchWelfare(query);
    
    // 키워드 기반 추가 검색
    const keywords = this.extractKeywords(query);
    const additionalResults = [];
    
    keywords.forEach(keyword => {
      const results = dataProcessor.searchWelfare(keyword);
      additionalResults.push(...results);
    });

    // 중복 제거 및 관련도 순 정렬
    const allResults = [...welfareResults, ...additionalResults];
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    return uniqueResults.slice(0, 5);
  }

  extractKeywords(query) {
    const commonKeywords = [
      '청년', '월세', '세액공제', '소득공제', '연말정산', '적금', '보험',
      '대출', '카드', '청약', '연금', '장려금', '지원금', '혜택',
      '절세', '환급', '공제', '비과세'
    ];

    return commonKeywords.filter(keyword => 
      query.includes(keyword)
    );
  }

  getFallbackResponse(userMessage) {
    // API 키가 없거나 오류 발생 시 기본 응답
    const fallbackResponses = {
      '월세': {
        message: `월세 세액공제에 대해 문의하셨네요! 

💡 **월세 세액공제 주요 정보**
- 대상: 총급여 7천만원 이하 무주택 세대주
- 혜택: 연간 월세액의 12% (최대 75만원까지)
- 신청: 연말정산 또는 종합소득세 신고 시

📝 **필요 서류**
- 월세 계약서
- 월세 납입증명서
- 주민등록등본

더 자세한 내용은 국세청 홈택스에서 확인하실 수 있어요!`,
        relevantInfo: dataProcessor.searchWelfare('월세')
      },
      '청년도약계좌': {
        message: `청년도약계좌에 관심이 있으시군요! 

💰 **청년도약계좌 혜택**
- 월 최대 40만원 납입 가능
- 정부 기여금 연 6% 지급
- 5년 만기 시 최대 3,600만원 수령

✅ **가입 조건**
- 만 19~34세 청년
- 기준중위소득 180% 이하
- 병역의무 이행자 우대

가까운 은행에서 신청하실 수 있어요!`,
        relevantInfo: dataProcessor.searchWelfare('청년도약계좌')
      },
      'default': {
        message: `안녕하세요! 절세 및 복지 혜택 상담을 도와드릴게요 😊

🔥 **인기 질문 TOP 3**
1. 월세 세액공제 받는 방법이 궁금해요
2. 청년도약계좌 조건이 어떻게 되나요?
3. 연말정산에서 놓치면 안 되는 공제 항목은?

궁금한 것이 있으시면 언제든 물어보세요!`,
        relevantInfo: []
      }
    };

    // 키워드 매칭해서 적절한 응답 선택
    for (const [keyword, response] of Object.entries(fallbackResponses)) {
      if (keyword !== 'default' && userMessage.includes(keyword)) {
        return {
          success: true,
          message: response.message,
          relevantInfo: response.relevantInfo.slice(0, 3)
        };
      }
    }

    return {
      success: true,
      message: fallbackResponses.default.message,
      relevantInfo: fallbackResponses.default.relevantInfo
    };
  }

  async getQuickResponse(category) {
    const quickResponses = {
      hot: {
        title: "🔥 최신 절세 정보",
        content: "2025년 청년 월세 세액공제가 75만원으로 확대되었어요! 놓치지 마세요."
      },
      deadline: {
        title: "⏰ 마감 임박",
        content: "연말정산 준비는 지금부터! 공제 서류를 미리 준비하세요."
      },
      youth: {
        title: "👥 청년 혜택",
        content: "청년도약계좌, 청년내일채움공제 등 다양한 청년 지원 정책을 확인해보세요."
      }
    };

    return quickResponses[category] || quickResponses.hot;
  }
}

module.exports = new GeminiService();
