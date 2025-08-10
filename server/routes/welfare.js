const express = require('express');
const router = express.Router();
const dataProcessor = require('../services/dataProcessor');

// 복지 정보 검색
router.get('/search', (req, res) => {
  try {
    const { q: query, category, limit = 10 } = req.query;
    
    let results = dataProcessor.searchWelfare(query);
    
    // 카테고리 필터링
    if (category) {
      results = results.filter(item => item.category === category);
    }
    
    // 결과 제한
    results = results.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        results,
        total: results.length,
        query: query || 'all'
      }
    });

  } catch (error) {
    console.error('복지 정보 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '검색 중 오류가 발생했습니다.'
    });
  }
});

// 모든 복지 정보 가져오기
router.get('/all', (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    let welfareData = dataProcessor.welfareData;
    
    if (category) {
      welfareData = welfareData.filter(item => item.category === category);
    }
    
    const results = welfareData.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('복지 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 복지 정보 상세 조회
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const welfareInfo = dataProcessor.getWelfareById(id);
    
    if (!welfareInfo) {
      return res.status(404).json({
        success: false,
        error: '해당 복지 정보를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: welfareInfo
    });

  } catch (error) {
    console.error('복지 정보 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

// 카테고리 목록 가져오기
router.get('/meta/categories', (req, res) => {
  try {
    const categories = [...new Set(dataProcessor.welfareData.map(item => item.category))];
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
