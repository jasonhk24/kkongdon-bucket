const express = require('express');
const router = express.Router();
const dataProcessor = require('../services/dataProcessor');

// 모든 금융상품 조회
router.get('/products', (req, res) => {
  try {
    const { category, recommended } = req.query;
    
    let products = dataProcessor.getFinanceProducts(category);
    
    if (recommended === 'true') {
      products = products.filter(product => product.isRecommended);
    }
    
    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('금융상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '금융상품 조회 중 오류가 발생했습니다.'
    });
  }
});

// 추천 금융상품 조회
router.get('/products/recommended', (req, res) => {
  try {
    const recommendedProducts = dataProcessor.getRecommendedProducts();
    
    res.json({
      success: true,
      data: recommendedProducts
    });

  } catch (error) {
    console.error('추천 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '추천 상품 조회 중 오류가 발생했습니다.'
    });
  }
});

// 절세 팁 조회
router.get('/tips', (req, res) => {
  try {
    const { category } = req.query;
    const tips = dataProcessor.getTaxTips(category);
    
    res.json({
      success: true,
      data: tips
    });

  } catch (error) {
    console.error('절세 팁 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '절세 팁 조회 중 오류가 발생했습니다.'
    });
  }
});

// 맞춤 추천 (더미 로직)
router.post('/recommend', (req, res) => {
  try {
    const { age, income, hasHouse, bucketGoals } = req.body;
    
    // 간단한 추천 로직
    let recommendations = [];
    
    if (age >= 19 && age <= 34) {
      recommendations.push({
        type: 'account',
        product: dataProcessor.financeProducts.find(p => p.name.includes('청년도약계좌')),
        reason: '청년 대상 정부 지원 혜택이 있어요',
        priority: 'high'
      });
    }
    
    if (!hasHouse && income <= 70000000) {
      recommendations.push({
        type: 'tax',
        product: { name: '월세 세액공제', expectedSavings: 750000 },
        reason: '월세 부담을 줄일 수 있어요',
        priority: 'high'
      });
    }
    
    if (bucketGoals && bucketGoals.includes('여행')) {
      recommendations.push({
        type: 'card',
        product: dataProcessor.financeProducts.find(p => p.category === '신용카드'),
        reason: '여행 관련 혜택이 있는 카드예요',
        priority: 'medium'
      });
    }

    // 기본 추천
    if (recommendations.length === 0) {
      recommendations = dataProcessor.getRecommendedProducts().map(product => ({
        type: 'general',
        product,
        reason: '많은 분들이 선택한 상품이에요',
        priority: 'medium'
      }));
    }

    res.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 3),
        totalCount: recommendations.length
      }
    });

  } catch (error) {
    console.error('맞춤 추천 오류:', error);
    res.status(500).json({
      success: false,
      error: '추천 처리 중 오류가 발생했습니다.'
    });
  }
});

// 금융상품 비교
router.post('/compare', (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: '비교할 상품 ID가 필요합니다.'
      });
    }

    const products = dataProcessor.financeProducts.filter(product => 
      productIds.includes(product.id)
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 상품들을 찾을 수 없습니다.'
      });
    }

    // 비교 분석
    const comparison = {
      products,
      analysis: {
        highestSavings: products.reduce((max, product) => 
          product.expectedSavings > max.expectedSavings ? product : max
        ),
        categories: [...new Set(products.map(p => p.category))],
        avgSavings: Math.round(
          products.reduce((sum, p) => sum + p.expectedSavings, 0) / products.length
        )
      }
    };

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('상품 비교 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 비교 중 오류가 발생했습니다.'
    });
  }
});

// 절세 계산기
router.post('/calculator', (req, res) => {
  try {
    const { income, deductions = [], family = 1 } = req.body;
    
    if (!income) {
      return res.status(400).json({
        success: false,
        error: '소득 정보가 필요합니다.'
      });
    }

    // 간단한 절세 계산 (실제로는 더 복잡한 로직 필요)
    let totalDeduction = deductions.reduce((sum, deduction) => {
      return sum + (deduction.amount || 0);
    }, 0);

    // 기본 공제
    const basicDeduction = 1500000; // 기본공제
    const familyDeduction = family * 1500000; // 가족공제
    
    totalDeduction += basicDeduction + familyDeduction;

    const taxableIncome = Math.max(0, income - totalDeduction);
    
    // 단순화된 세율 적용
    let tax = 0;
    if (taxableIncome <= 12000000) {
      tax = taxableIncome * 0.06;
    } else if (taxableIncome <= 46000000) {
      tax = 720000 + (taxableIncome - 12000000) * 0.15;
    } else {
      tax = 5820000 + (taxableIncome - 46000000) * 0.24;
    }

    const result = {
      income,
      totalDeduction,
      taxableIncome,
      estimatedTax: Math.round(tax),
      potentialSavings: Math.round(totalDeduction * 0.1), // 대략적 절세액
      recommendations: [
        '월세 세액공제 신청하기',
        '개인연금저축 가입하기',
        '의료비 공제 신청하기'
      ]
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('절세 계산 오류:', error);
    res.status(500).json({
      success: false,
      error: '절세 계산 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
