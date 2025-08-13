const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 금융상품 데이터베이스 (실제로는 데이터베이스에서 가져올 데이터)
const financialProducts = [
  {
    id: 'kb-diy-savings',
    name: 'KB내맘대로적금',
    type: '자유적립식 적금',
    target: '만 14세 이상',
    period: '6개월 ~ 36개월',
    minAmount: 10000,
    maxAmount: 3000000,
    rate: 3.55,
    category: 'savings',
    purpose: ['여행', '결혼', '내집마련', '교육', '창업'],
    features: 'DIY형 비대면 전용 상품, 고객 맞춤 설계',
    riskLevel: 'low'
  },
  {
    id: 'kb-star-deposit',
    name: 'KB Star 정기예금',
    type: '정기예금',
    target: '개인 및 개인사업자',
    period: '1개월 ~ 36개월',
    minAmount: 1000000,
    maxAmount: 100000000,
    rate: 3.20,
    category: 'deposit',
    purpose: ['안전자산', '단기저축', '비상자금'],
    features: '안정적인 금리, 원금보장',
    riskLevel: 'very_low'
  },
  {
    id: 'housing-savings',
    name: '주택청약종합저축',
    type: '청약저축',
    target: '무주택자',
    period: '장기',
    minAmount: 20000,
    maxAmount: 500000,
    rate: 1.8,
    category: 'housing',
    purpose: ['내집마련', '주택청약'],
    features: '소득공제 혜택, 청약 우선권',
    riskLevel: 'low'
  },
  {
    id: 'pension-savings',
    name: '개인연금저축',
    type: '연금저축',
    target: '근로소득자',
    period: '장기 (5년 이상)',
    minAmount: 100000,
    maxAmount: 1800000,
    rate: 3.0,
    category: 'pension',
    purpose: ['노후준비', '세금절약'],
    features: '세액공제 혜택, 노후 안정',
    riskLevel: 'low'
  },
  {
    id: 'investment-trust',
    name: '펀드 투자',
    type: '투자신탁',
    target: '투자 경험자',
    period: '1년 이상',
    minAmount: 100000,
    maxAmount: 50000000,
    rate: 5.5,
    category: 'investment',
    purpose: ['재산증식', '투자', '창업자금'],
    features: '높은 수익 가능성, 포트폴리오 다양화',
    riskLevel: 'medium'
  }
];

// 금융상품 추천 API
router.post('/recommend', async (req, res) => {
  try {
    console.log('💰 금융상품 추천 요청:', req.body);
    
    const { bucketGoal, targetAmount, timeFrame, riskTolerance, age, income } = req.body;
    
    if (!bucketGoal || !targetAmount) {
      return res.status(400).json({
        success: false,
        error: '버킷리스트 목표와 목표금액은 필수입니다.'
      });
    }

    // 1단계: 기본 필터링 (금액, 기간 기반) - 완화된 조건
    let filteredProducts = financialProducts.filter(product => {
      const monthlyAmount = targetAmount / (timeFrame || 12); // 월 저축액 계산
      console.log(`💰 상품 체크: ${product.name}, 월저축액: ${monthlyAmount}, 범위: ${product.minAmount * 0.8} ~ ${product.maxAmount * 1.2}`);
      // 조건을 완화: 월 저축액이 최소금액의 80% 이상이거나 최대금액의 120% 이하까지 허용
      return monthlyAmount >= (product.minAmount * 0.8) && monthlyAmount <= (product.maxAmount * 1.2);
    });
    
    console.log(`📊 1단계 필터링 결과: ${filteredProducts.length}개`);

    // 2단계: 고급 목적 기반 스코어링 시스템
    const purposeKeywords = extractPurposeKeywords(bucketGoal);
    console.log(`🎯 추출된 목적 키워드: ${purposeKeywords.join(', ')}`);
    
    const scoredProducts = filteredProducts.map(product => {
      let purposeScore = 0;
      let matchedPurposes = [];
      
      // 정확 매칭 점수 (높은 가중치)
      product.purpose.forEach(purpose => {
        if (purposeKeywords.includes(purpose)) {
          purposeScore += 1.0;
          matchedPurposes.push(purpose);
        }
      });
      
      // 부분 매칭 점수 (낮은 가중치)
      product.purpose.forEach(purpose => {
        purposeKeywords.forEach(keyword => {
          if (purpose.includes(keyword) && !matchedPurposes.includes(purpose)) {
            purposeScore += 0.3;
            matchedPurposes.push(`${purpose}(부분)`);
          }
        });
      });
      
      // 위험성향 매칭 점수
      let riskScore = 0;
      const riskMapping = {
        'conservative': { 'very_low': 1.0, 'low': 0.8, 'medium': 0.3, 'high': 0.1 },
        'moderate': { 'very_low': 0.6, 'low': 0.9, 'medium': 1.0, 'high': 0.7 },
        'aggressive': { 'very_low': 0.2, 'low': 0.4, 'medium': 0.8, 'high': 1.0 }
      };
      riskScore = riskMapping[riskTolerance]?.[product.riskLevel] || 0.5;
      
      // 수익률 정규화 점수 (0-1 범위)
      const maxRate = Math.max(...filteredProducts.map(p => p.rate));
      const rateScore = product.rate / maxRate;
      
      // 총 점수 계산 (가중평균)
      const totalScore = (
        purposeScore * 0.4 +     // 목적 매칭 40%
        riskScore * 0.3 +        // 위험성향 30%  
        rateScore * 0.3          // 수익률 30%
      );
      
      console.log(`📊 ${product.name} 점수 분석:`, {
        목적점수: purposeScore.toFixed(2),
        위험점수: riskScore.toFixed(2), 
        수익점수: rateScore.toFixed(2),
        총점: totalScore.toFixed(2),
        매칭목적: matchedPurposes
      });
      
      return {
        ...product,
        purposeScore,
        riskScore,
        rateScore,
        totalScore,
        matchedPurposes
      };
    });
    
    // 점수순으로 정렬
    scoredProducts.sort((a, b) => b.totalScore - a.totalScore);
    
    // 최소 점수 임계값 설정 (0.3 이상만 추천)
    const qualifiedProducts = scoredProducts.filter(product => product.totalScore >= 0.3);
    
    console.log(`📊 고급 필터링 결과: ${qualifiedProducts.length}개 (임계값 0.3 이상)`);

    // 추천할 상품이 없으면 상위 3개라도 선택
    if (qualifiedProducts.length === 0) {
      console.log('⚠️ 임계값을 충족하는 상품이 없어서 상위 점수 상품 선택');
      filteredProducts = scoredProducts.slice(0, 3);
    } else {
      filteredProducts = qualifiedProducts.slice(0, 3); // 최대 3개
    }

    // 3단계: Gemini AI를 통한 개인화 추천
    const aiRecommendations = await getAIRecommendations({
      bucketGoal,
      targetAmount,
      timeFrame,
      riskTolerance,
      age,
      income,
      filteredProducts
    });

    // 4단계: 최종 추천 상품 선별 및 적합도 순 정렬 (최대 3개)
    const finalRecommendations = filteredProducts
      .slice(0, 3)
      .map((product, index) => ({
        ...product,
        aiAnalysis: aiRecommendations.productAnalysis?.[index] || '개인 맞춤 추천 상품입니다.',
        monthlyAmount: Math.ceil(targetAmount / (timeFrame || 12)),
        projectedReturn: calculateProjectedReturn(product, targetAmount, timeFrame),
        suitabilityScore: calculateSuitabilityScore(product, { bucketGoal, targetAmount, timeFrame, riskTolerance, age, income })
      }))
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore); // 적합도 점수 내림차순 정렬

    res.json({
      success: true,
      data: {
        recommendations: finalRecommendations,
        aiSummary: aiRecommendations.summary,
        bucketGoal,
        targetAmount,
        timeFrame: timeFrame || 12,
        totalProducts: filteredProducts.length
      }
    });

  } catch (error) {
    console.error('금융상품 추천 오류:', error);
    res.status(500).json({
      success: false,
      error: '추천 시스템에 오류가 발생했습니다.'
    });
  }
});

// 고급 목적 분석 및 키워드 추출 함수
function extractPurposeKeywords(bucketGoal) {
  const goalLower = bucketGoal.toLowerCase();
  
  // 목적별 가중치 및 연관 키워드 매핑
  const purposeMap = {
    '여행': {
      keywords: ['여행', '휴가', '해외', '국내여행', '배낭여행', '신혼여행'],
      related: ['단기저축', '안전자산'],
      weight: 0.9,
      timePreference: 'short'
    },
    '결혼': {
      keywords: ['결혼', '웨딩', '혼인', '신혼', '예식'],
      related: ['결혼자금', '단기저축'],
      weight: 0.95,
      timePreference: 'medium'
    },
    '내집마련': {
      keywords: ['집', '주택', '부동산', '아파트', '전세', '매매'],
      related: ['주택청약', '장기저축'],
      weight: 1.0,
      timePreference: 'long'
    },
    '교육': {
      keywords: ['교육', '학비', '공부', '대학', '유학', '자격증'],
      related: ['교육자금', '안전자산'],
      weight: 0.85,
      timePreference: 'medium'
    },
    '창업': {
      keywords: ['창업', '사업', '스타트업', '개업', '자영업'],
      related: ['창업자금', '재산증식'],
      weight: 0.8,
      timePreference: 'medium'
    },
    '노후준비': {
      keywords: ['노후', '은퇴', '연금', '퇴직'],
      related: ['노후자금', '장기저축'],
      weight: 1.0,
      timePreference: 'long'
    }
  };

  const matchedPurposes = [];
  
  // 각 목적별로 매칭 점수 계산
  for (const [purpose, config] of Object.entries(purposeMap)) {
    let score = 0;
    let matchCount = 0;
    
    // 키워드 매칭 점수 계산
    for (const keyword of config.keywords) {
      if (goalLower.includes(keyword)) {
        score += config.weight;
        matchCount++;
      }
    }
    
    // 부분 매칭 보너스 (유사한 단어 감지)
    if (matchCount > 0) {
      score += matchCount * 0.1; // 매칭된 키워드 수만큼 보너스
    }
    
    if (score > 0) {
      matchedPurposes.push({
        purpose,
        score,
        keywords: [purpose, ...config.related],
        timePreference: config.timePreference
      });
    }
  }
  
  // 점수순으로 정렬
  matchedPurposes.sort((a, b) => b.score - a.score);
  
  // 최고 점수 목적의 키워드들 추출
  const finalKeywords = new Set();
  
  if (matchedPurposes.length > 0) {
    // 가장 높은 점수의 목적 추가
    const topPurpose = matchedPurposes[0];
    topPurpose.keywords.forEach(keyword => finalKeywords.add(keyword));
    
    // 점수가 80% 이상인 다른 목적들도 추가
    const threshold = topPurpose.score * 0.8;
    matchedPurposes.forEach(purpose => {
      if (purpose.score >= threshold) {
        purpose.keywords.forEach(keyword => finalKeywords.add(keyword));
      }
    });
  } else {
    // 매칭되지 않은 경우 범용 키워드
    finalKeywords.add('단기저축');
    finalKeywords.add('안전자산');
  }
  
  console.log(`🎯 목적 분석 결과:`, matchedPurposes.map(p => `${p.purpose}(${p.score.toFixed(2)})`));
  
  return Array.from(finalKeywords);
}

// Gemini AI 추천 분석
async function getAIRecommendations(userData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
당신은 전문 금융 상담사입니다. 다음 고객 정보를 바탕으로 금융상품을 추천해주세요.

고객 정보:
- 버킷리스트 목표: ${userData.bucketGoal}
- 목표 금액: ${userData.targetAmount?.toLocaleString()}원
- 달성 기간: ${userData.timeFrame || 12}개월
- 위험 성향: ${userData.riskTolerance || '중간'}
- 나이: ${userData.age || '미제공'}세
- 소득: ${userData.income ? userData.income.toLocaleString() + '원' : '미제공'}

추천 가능한 상품들:
${userData.filteredProducts.map((p, i) => 
  `${i+1}. ${p.name} (${p.type}, 금리: ${p.rate}%, 위험도: ${p.riskLevel})`
).join('\n')}

다음 형식으로 응답해주세요:
1. 전체 추천 요약 (2-3문장)
2. 각 상품별 추천 이유 (1-2문장씩)

전문적이면서도 이해하기 쉽게 설명해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // 응답 파싱
    const lines = response.split('\n').filter(line => line.trim());
    const summary = lines.slice(0, 3).join(' ');
    const productAnalysis = lines.slice(3);
    
    return {
      summary,
      productAnalysis
    };
    
  } catch (error) {
    console.error('AI 추천 생성 오류:', error);
    return {
      summary: `${userData.bucketGoal} 달성을 위한 맞춤형 금융상품을 추천드립니다. 목표 금액과 기간을 고려하여 안정적이면서도 효율적인 상품들을 선별했습니다.`,
      productAnalysis: userData.filteredProducts.map(() => '고객님의 목표에 적합한 추천 상품입니다.')
    };
  }
}

// 예상 수익 계산
function calculateProjectedReturn(product, targetAmount, timeFrame) {
  const monthlyAmount = targetAmount / (timeFrame || 12);
  const months = timeFrame || 12;
  const monthlyRate = (product.rate / 100) / 12;
  
  // 복리 계산
  let totalAmount = 0;
  for (let i = 0; i < months; i++) {
    totalAmount = (totalAmount + monthlyAmount) * (1 + monthlyRate);
  }
  
  return {
    totalSaved: monthlyAmount * months,
    totalAmount: Math.round(totalAmount),
    interest: Math.round(totalAmount - (monthlyAmount * months))
  };
}

// 고급 적합성 점수 계산 (머신러닝 스타일)
function calculateSuitabilityScore(product, userData) {
  const weights = {
    purpose: 0.25,      // 목적 적합도 25%
    financial: 0.25,    // 재정 적합도 25%
    risk: 0.20,         // 위험성향 20%
    demographics: 0.15, // 인구통계학적 적합도 15%
    behavioral: 0.15    // 행동패턴 적합도 15%
  };
  
  let scores = {};
  
  // 1. 목적 적합도 점수 (0-100)
  const purposeKeywords = extractPurposeKeywords(userData.bucketGoal);
  let purposeScore = 0;
  let totalPurposeWeight = 0;
  
  product.purpose.forEach(purpose => {
    const exactMatch = purposeKeywords.includes(purpose);
    const partialMatch = purposeKeywords.some(keyword => 
      purpose.includes(keyword) || keyword.includes(purpose)
    );
    
    if (exactMatch) {
      purposeScore += 100;
      totalPurposeWeight += 1;
    } else if (partialMatch) {
      purposeScore += 60;
      totalPurposeWeight += 0.6;
    }
  });
  
  scores.purpose = totalPurposeWeight > 0 ? purposeScore / totalPurposeWeight : 0;
  
  // 2. 재정 적합도 점수 (금액 + 기간 + 소득 대비)
  const monthlyAmount = userData.targetAmount / (userData.timeFrame || 12);
  const incomeRatio = monthlyAmount / (userData.income || 3000000) * 100;
  
  let financialScore = 0;
  
  // 금액 범위 적합도
  if (monthlyAmount >= product.minAmount && monthlyAmount <= product.maxAmount) {
    const midPoint = (product.minAmount + product.maxAmount) / 2;
    const deviation = Math.abs(monthlyAmount - midPoint) / (product.maxAmount - product.minAmount);
    financialScore += 40 * (1 - deviation); // 중앙값에 가까울수록 높은 점수
  }
  
  // 소득 대비 저축률 적합도 (10-30%가 적정)
  if (incomeRatio >= 10 && incomeRatio <= 30) {
    financialScore += 40;
  } else if (incomeRatio < 10) {
    financialScore += 20; // 여유있는 저축
  } else {
    financialScore += Math.max(0, 40 - (incomeRatio - 30) * 2); // 과도한 저축 페널티
  }
  
  // 기간 적합도
  const timeFrameMonths = userData.timeFrame || 12;
  if (product.period) {
    const periodRange = product.period.match(/(\d+)/g);
    if (periodRange) {
      const minPeriod = parseInt(periodRange[0]);
      const maxPeriod = periodRange.length > 1 ? parseInt(periodRange[1]) : minPeriod;
      
      if (timeFrameMonths >= minPeriod && timeFrameMonths <= maxPeriod) {
        financialScore += 20;
      }
    }
  }
  
  scores.financial = Math.min(financialScore, 100);
  
  // 3. 위험성향 적합도 점수
  const riskCompatibility = {
    'conservative': { 'very_low': 100, 'low': 80, 'medium': 40, 'high': 10 },
    'moderate': { 'very_low': 60, 'low': 90, 'medium': 100, 'high': 70 },
    'aggressive': { 'very_low': 20, 'low': 50, 'medium': 80, 'high': 100 }
  };
  
  const userRisk = userData.riskTolerance || 'moderate';
  scores.risk = riskCompatibility[userRisk]?.[product.riskLevel] || 50;
  
  // 4. 인구통계학적 적합도 (나이 기반)
  const age = userData.age || 30;
  let demographicsScore = 50; // 기본 점수
  
  // 나이별 상품 선호도 가중치
  if (age < 30) {
    // 젊은층: 적극적 저축 선호
    if (product.category === 'savings' || product.riskLevel === 'medium') {
      demographicsScore += 30;
    }
  } else if (age >= 30 && age < 50) {
    // 중년층: 안정성과 수익성 균형
    if (product.riskLevel === 'low' || product.riskLevel === 'medium') {
      demographicsScore += 25;
    }
  } else {
    // 장년층: 안정성 우선
    if (product.riskLevel === 'very_low' || product.riskLevel === 'low') {
      demographicsScore += 35;
    }
  }
  
  scores.demographics = Math.min(demographicsScore, 100);
  
  // 5. 행동패턴 적합도 (목표 달성 가능성)
  let behavioralScore = 50;
  
  // 목표 금액의 현실성 평가
  const targetAmount = userData.targetAmount || 5000000;
  const totalIncome = (userData.income || 3000000) * (timeFrameMonths / 12);
  const targetRatio = targetAmount / totalIncome;
  
  if (targetRatio <= 0.1) {
    behavioralScore += 30; // 매우 달성 가능
  } else if (targetRatio <= 0.2) {
    behavioralScore += 20; // 달성 가능
  } else if (targetRatio <= 0.3) {
    behavioralScore += 10; // 도전적이지만 가능
  } else {
    behavioralScore -= 10; // 다소 무리한 목표
  }
  
  // 상품의 유연성 점수
  if (product.features && product.features.includes('자유')) {
    behavioralScore += 15; // 유연한 상품 선호
  }
  
  scores.behavioral = Math.min(Math.max(behavioralScore, 0), 100);
  
  // 6. 가중평균으로 최종 점수 계산
  const finalScore = Math.round(
    scores.purpose * weights.purpose +
    scores.financial * weights.financial +
    scores.risk * weights.risk +
    scores.demographics * weights.demographics +
    scores.behavioral * weights.behavioral
  );
  
  console.log(`🧮 ${product.name} 상세 점수:`, {
    목적: scores.purpose.toFixed(1),
    재정: scores.financial.toFixed(1),
    위험: scores.risk.toFixed(1),
    연령: scores.demographics.toFixed(1),
    행동: scores.behavioral.toFixed(1),
    최종: finalScore
  });
  
  return finalScore;
}

module.exports = router;
