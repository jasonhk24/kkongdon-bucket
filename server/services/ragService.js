const { pipeline } = require('@xenova/transformers');
const fs = require('fs').promises;
const path = require('path');
const FinanceLegalDataProcessor = require('./financeLegalProcessor');

class RAGService {
  constructor() {
    this.embedder = null;
    this.welfareDocuments = [];
    this.financialDocuments = [];
    this.legalDocuments = [];
    this.welfareEmbeddings = [];
    this.financialEmbeddings = [];
    this.legalEmbeddings = [];
    this.isInitialized = false;
    this.legalProcessor = new FinanceLegalDataProcessor();
  }

  async initialize() {
    try {
      console.log('🤖 RAG 시스템 초기화 중...');
      
      // Hugging Face 임베딩 모델 로드
      this.embedder = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', {
        quantized: false,
      });
      
      console.log('✅ 임베딩 모델 로드 완료');
      
      // 문서 로드 및 벡터화
      await this.loadAndEmbedDocuments();
      
      this.isInitialized = true;
      console.log('🚀 RAG 시스템 초기화 완료');
      
    } catch (error) {
      console.error('❌ RAG 시스템 초기화 실패:', error);
      throw error;
    }
  }

  async loadAndEmbedDocuments() {
    try {
      // 복지 정보 로드
      await this.loadWelfareDocuments();
      console.log(`📋 복지 문서 로드 완료: ${this.welfareDocuments.length}개`);
      
      // KB 금융상품 문서 로드
      await this.loadFinancialDocuments();
      console.log(`💰 금융 문서 로드 완료: ${this.financialDocuments.length}개`);
      
      // 금융 법률 문서 로드
      await this.loadLegalDocuments();
      console.log(`🏛️ 법률 문서 로드 완료: ${this.legalDocuments.length}개`);
      
      // 임베딩 생성
      await this.generateEmbeddings();
      console.log('🔢 임베딩 벡터 생성 완료');
      
    } catch (error) {
      console.error('문서 로드 및 임베딩 실패:', error);
      throw error;
    }
  }

  async loadWelfareDocuments() {
    try {
      const dataPath = path.join(__dirname, '../data/processed_welfare_data.json');
      const welfareData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      this.welfareDocuments = welfareData.map((item, index) => ({
        id: `welfare_${index}`,
        type: 'welfare',
        title: item.name || item.정책명 || '',
        content: this.formatWelfareContent(item),
        metadata: {
          category: item.category || item.정책분야 || '',
          agency: item.agency || item.소관기관 || '',
          targetGroup: item.targetGroup || item.지원대상 || '',
          applicationPeriod: item.applicationPeriod || item.신청기간 || ''
        }
      }));
      
    } catch (error) {
      console.error('복지 문서 로드 실패:', error);
      this.welfareDocuments = [];
    }
  }

  async loadFinancialDocuments() {
    // KB 금융상품 데이터 (클라이언트에서 가져온 데이터를 서버로 이동)
    const kbProducts = [
      {
        id: 1,
        name: "KB Young Youth 통장",
        type: "입출금통장",
        category: "youth",
        target: "만 17세 이상 ~ 만 34세 이하",
        channel: "모바일, 영업점",
        period: "1년 (자동연장)",
        amount: "제한없음",
        rate: "2.45%",
        paymentType: "만기일시지급",
        features: "청년 전용 고금리 통장, 모바일 우대금리 제공",
        note: "KB스타뱅킹 가입 시 우대금리 적용"
      },
      {
        id: 2,
        name: "KB 청년도약계좌",
        type: "적립식 예금",
        category: "youth",
        target: "만 19세 이상 ~ 만 34세 이하, 개인소득 3600만원 이하",
        channel: "영업점",
        period: "5년",
        amount: "월 40만원 한도",
        rate: "6.00%",
        paymentType: "만기일시지급",
        features: "정부지원 청년 자산형성 상품, 최고 6% 금리",
        note: "가입 조건 엄격, 정부 매칭지원금 제공"
      },
      {
        id: 3,
        name: "KB Star 청년 예금",
        type: "정기예금",
        category: "youth",
        target: "만 17세 이상 ~ 만 34세 이하",
        channel: "모바일, 영업점",
        period: "1년, 2년, 3년",
        amount: "1만원 이상",
        rate: "4.50%",
        paymentType: "만기일시지급",
        features: "청년 전용 정기예금, 중도해지 시 90% 이자 지급",
        note: "KB스타뱅킹 전용상품"
      },
      {
        id: 4,
        name: "KB Star 적금",
        type: "적립식 예금",
        category: "savings",
        target: "개인",
        channel: "모바일, 영업점",
        period: "1년, 2년, 3년",
        amount: "월 1만원 ~ 100만원",
        rate: "3.20%",
        paymentType: "만기일시지급",
        features: "자유적립식, 우대금리 조건 다양",
        note: "KB스타뱅킹 가입 시 우대금리"
      },
      {
        id: 5,
        name: "KB 정기예금",
        type: "정기예금",
        category: "deposit",
        target: "개인, 법인",
        channel: "모바일, 영업점",
        period: "1개월 ~ 3년",
        amount: "1만원 이상",
        rate: "3.50%",
        paymentType: "만기일시지급",
        features: "기본 정기예금 상품, 안정성 높음",
        note: "예금자보호법에 따라 5천만원까지 보호"
      },
      {
        id: 6,
        name: "KB 골든라이프 예금",
        type: "정기예금",
        category: "special",
        target: "만 50세 이상",
        channel: "영업점",
        period: "1년, 2년, 3년",
        amount: "100만원 이상",
        rate: "4.20%",
        paymentType: "만기일시지급",
        features: "중장년층 전용 고금리 예금",
        note: "50세 이상 우대금리 제공"
      },
      {
        id: 7,
        name: "KB 부자되는 적금",
        type: "적립식 예금",
        category: "special",
        target: "개인",
        channel: "영업점",
        period: "2년, 3년",
        amount: "월 10만원 ~ 50만원",
        rate: "3.80%",
        paymentType: "만기일시지급",
        features: "목돈 마련 전용 적금, 중도인출 제한",
        note: "장기 저축 고객 우대"
      },
      {
        id: 8,
        name: "KB 내가 Green 적금",
        type: "적립식 예금",
        category: "special",
        target: "개인",
        channel: "모바일, 영업점",
        period: "1년, 2년",
        amount: "월 5만원 ~ 30만원",
        rate: "3.60%",
        paymentType: "만기일시지급",
        features: "ESG 연계 적금, 친환경 활동 시 우대금리",
        note: "대중교통 이용, 텀블러 사용 등 인증 시 금리 우대"
      },
      {
        id: 9,
        name: "KB 주거래 우대 예금",
        type: "정기예금",
        category: "special",
        target: "KB 주거래 고객",
        channel: "영업점",
        period: "1년",
        amount: "500만원 이상",
        rate: "4.00%",
        paymentType: "만기일시지급",
        features: "주거래 고객 전용, 높은 금리 제공",
        note: "급여이체, 적금 가입 등 주거래 조건 필요"
      }
    ];

    this.financialDocuments = kbProducts.map(product => ({
      id: `finance_${product.id}`,
      type: 'financial',
      title: product.name,
      content: this.formatFinancialContent(product),
      metadata: {
        category: product.category,
        productType: product.type,
        rate: product.rate,
        target: product.target,
        period: product.period
      }
    }));
  }

  formatWelfareContent(item) {
    return `
정책명: ${item.name || item.정책명 || ''}
담당기관: ${item.agency || item.소관기관 || ''}
정책분야: ${item.category || item.정책분야 || ''}
지원대상: ${item.targetGroup || item.지원대상 || ''}
내용: ${item.content || item.정책내용 || ''}
신청기간: ${item.applicationPeriod || item.신청기간 || ''}
`.trim();
  }

  async loadLegalDocuments() {
    try {
      const legalDocuments = await this.legalProcessor.loadAndProcessData();
      
      this.legalDocuments = legalDocuments.map(doc => ({
        id: doc.id,
        type: 'legal',
        title: doc.title,
        content: this.formatLegalContent(doc),
        metadata: {
          category: doc.category,
          source: doc.source,
          published: doc.published,
          doc_class: doc.doc_class,
          qa_pairs: doc.qas.length
        }
      }));
      
    } catch (error) {
      console.error('법률 문서 로드 실패:', error);
      this.legalDocuments = [];
    }
  }

  formatLegalContent(doc) {
    return `
제목: ${doc.title}
출처: ${doc.source}
분류: ${doc.doc_class}
내용: ${doc.content}
관련 질문답변: ${doc.qas.map(qa => `Q:${qa.question} A:${qa.answer}`).join(' | ')}
`.trim();
  }

  formatFinancialContent(product) {
    return `
상품명: ${product.name}
상품유형: ${product.type}
가입대상: ${product.target}
가입경로: ${product.channel || ''}
계약기간: ${product.period}
저축금액: ${product.amount}
최고금리: ${product.rate}
이자지급방식: ${product.paymentType}
상품특징: ${product.features}
비고: ${product.note || ''}
`.trim();
  }

  async generateEmbeddings() {
    console.log('복지 문서 임베딩 생성 중...');
    this.welfareEmbeddings = await this.embedDocuments(this.welfareDocuments);
    
    console.log('금융 문서 임베딩 생성 중...');
    this.financialEmbeddings = await this.embedDocuments(this.financialDocuments);
    
    console.log('법률 문서 임베딩 생성 중...');
    this.legalEmbeddings = await this.embedDocuments(this.legalDocuments);
  }

  async embedDocuments(documents) {
    const embeddings = [];
    const batchSize = 10; // 배치 처리
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchTexts = batch.map(doc => doc.content);
      
      try {
        const batchEmbeddings = await this.embedder(batchTexts);
        embeddings.push(...batchEmbeddings);
        
        if (i % 50 === 0) {
          console.log(`임베딩 진행률: ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
        }
      } catch (error) {
        console.error(`배치 ${i}-${i + batchSize} 임베딩 실패:`, error);
      }
    }
    
    return embeddings;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async searchSimilarDocuments(query, topK = 5) {
    if (!this.isInitialized) {
      throw new Error('RAG 시스템이 초기화되지 않았습니다.');
    }

    try {
      // 쿼리 임베딩
      const queryEmbedding = await this.embedder(query);
      const queryVector = Array.isArray(queryEmbedding.data) ? queryEmbedding.data : queryEmbedding;

      // 복지 문서 검색
      const welfareResults = this.searchInDocuments(
        queryVector, 
        this.welfareDocuments, 
        this.welfareEmbeddings, 
        Math.ceil(topK / 3)
      );

      // 금융 문서 검색
      const financialResults = this.searchInDocuments(
        queryVector, 
        this.financialDocuments, 
        this.financialEmbeddings, 
        Math.ceil(topK / 3)
      );

      // 법률 문서 검색
      const legalResults = this.searchInDocuments(
        queryVector, 
        this.legalDocuments, 
        this.legalEmbeddings, 
        Math.ceil(topK / 3)
      );

      // 결과 병합 및 리랭킹
      const allResults = [...welfareResults, ...financialResults, ...legalResults];
      const rerankedResults = this.rerank(query, allResults, topK);

      return rerankedResults;

    } catch (error) {
      console.error('문서 검색 실패:', error);
      return [];
    }
  }

  searchInDocuments(queryVector, documents, embeddings, topK) {
    const similarities = embeddings.map((embedding, index) => {
      const embeddingArray = Array.isArray(embedding.data) ? embedding.data : embedding;
      const similarity = this.cosineSimilarity(queryVector, embeddingArray);
      return { index, similarity, document: documents[index] };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  rerank(query, results, topK) {
    // 간단한 키워드 기반 리랭킹
    const queryLower = query.toLowerCase();
    const keywords = ['청년', '적금', '예금', '통장', '금리', '복지', '지원', '혜택', '법률', '규정', '조례', '법령'];
    
    return results
      .map(result => {
        let score = result.similarity;
        
        // 키워드 매칭 보너스
        const content = result.document.content.toLowerCase();
        const title = result.document.title.toLowerCase();
        
        keywords.forEach(keyword => {
          if (queryLower.includes(keyword)) {
            if (title.includes(keyword)) score += 0.1;
            if (content.includes(keyword)) score += 0.05;
          }
        });
        
        // 타입별 가중치 (사용자 쿼리에 따라)
        if (queryLower.includes('복지') || queryLower.includes('지원')) {
          if (result.document.type === 'welfare') score += 0.1;
        }
        if (queryLower.includes('금리') || queryLower.includes('적금') || queryLower.includes('예금')) {
          if (result.document.type === 'financial') score += 0.1;
        }
        if (queryLower.includes('법률') || queryLower.includes('규정') || queryLower.includes('법령')) {
          if (result.document.type === 'legal') score += 0.1;
        }
        
        return { ...result, finalScore: score };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK);
  }

  async generateAnswer(query, relevantDocs, chatHistory = []) {
    try {
      // 관련 문서 컨텍스트 생성
      const context = relevantDocs.map(doc => 
        `[${doc.document.type === 'welfare' ? '복지정보' : doc.document.type === 'financial' ? 'KB금융상품' : '법률정보'}] ${doc.document.title}\n${doc.document.content}`
      ).join('\n\n');

      // 채팅 히스토리 포함
      const historyContext = chatHistory.slice(-3).map(msg => 
        `${msg.role === 'user' ? '사용자' : '도우미'}: ${msg.content}`
      ).join('\n');

      // 더 자세한 정보 요청인지 확인
      const isDetailRequest = query.includes('더 자세히') || query.includes('더 알려') || query.includes('구체적으로') || query.includes('자세한');
      
      let prompt;
      
      if (isDetailRequest && relevantDocs.length > 0) {
        // 구체적인 상세 정보 제공 프롬프트
        prompt = `
당신은 절세와 금융 전문가입니다. 사용자가 더 자세한 정보를 요청했습니다. 다음 정보를 바탕으로 매우 구체적이고 실용적인 답변을 해주세요.

[관련 정보]
${context}

[이전 대화]
${historyContext}

[사용자 질문]
${query}

[상세 답변 가이드라인]
1. 제공된 정보에서 모든 구체적인 수치와 조건을 포함해주세요
2. 신청 방법, 필요 서류, 구체적인 절차를 단계별로 설명해주세요
3. 금리, 한도, 기간 등 모든 수치 정보를 명확히 제시해주세요
4. 주의사항이나 제외 조건도 함께 안내해주세요
5. 관련된 다른 상품이나 정책이 있다면 함께 추천해주세요
6. 실제 활용 예시나 시나리오를 들어 설명해주세요

구체적이고 실용적인 답변:`;
      } else if (relevantDocs.length === 0) {
        // 관련 문서가 없을 때의 프롬프트
        prompt = `
당신은 절세와 금융 전문가입니다. 직접적으로 관련된 정보를 찾지 못했지만, 일반적인 금융 및 세무 지식으로 도움을 드리겠습니다.

[이전 대화]
${historyContext}

[사용자 질문]
${query}

[답변 가이드라인]
1. 일반적인 금융 및 세무 상식으로 답변해주세요
2. 정확하지 않을 수 있음을 미리 안내해주세요
3. 공식 기관에 문의하도록 권유해주세요
4. 관련될 수 있는 일반적인 정보를 제공해주세요

답변:`;
      } else {
        // 일반적인 답변 프롬프트
        prompt = `
당신은 절세와 금융 전문가입니다. 다음 정보를 바탕으로 사용자의 질문에 정확하고 도움이 되는 답변을 해주세요.

[관련 정보]
${context}

[이전 대화]
${historyContext}

[사용자 질문]
${query}

[답변 가이드라인]
1. 제공된 정보를 바탕으로 정확한 답변을 해주세요
2. 복지 정보와 금융상품을 모두 고려해주세요
3. 구체적인 금리, 조건, 신청방법 등을 포함해주세요
4. 친근하고 이해하기 쉽게 설명해주세요
5. 추가로 도움이 될 만한 정보도 제안해주세요

답변:`;
      }

      // Gemini API 호출 (기존 서비스 활용)
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      return {
        message: answer,
        relevantInfo: relevantDocs.map(doc => ({
          title: doc.document.title,
          type: doc.document.type,
          similarity: doc.similarity,
          metadata: doc.document.metadata
        })),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('답변 생성 실패:', error);
      throw error;
    }
  }
}

module.exports = new RAGService();
