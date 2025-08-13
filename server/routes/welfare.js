const express = require('express');
const router = express.Router();
const dataProcessor = require('../services/dataProcessor');

// 복지 정보 검색 (페이지네이션/정렬 지원)
router.get('/search', (req, res) => {
  try {
    const { q: query, category, limit = 10, page, offset, sortBy = 'latest' } = req.query;
    
    let allResults = dataProcessor.searchWelfare(query || '');
    
    // 카테고리 필터링
    if (category) {
      allResults = allResults.filter(item => item.category === category);
    }
    
    // 정렬 (latest: 최근 업데이트 순, popular: 간단히 이름 기준)
    allResults = [...allResults].sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.benefits?.length || 0) - (a.benefits?.length || 0);
      }
      const aTime = new Date(a.lastUpdated || 0).getTime();
      const bTime = new Date(b.lastUpdated || 0).getTime();
      return bTime - aTime;
    });
    
    const totalCount = allResults.length;
    const numericLimit = Math.max(1, parseInt(limit));
    const numericOffset = offset !== undefined ? parseInt(offset) : (Math.max(1, parseInt(page) || 1) - 1) * numericLimit;
    
    // 페이지 슬라이싱
    const limitedResults = allResults.slice(numericOffset, numericOffset + numericLimit);
    const currentPage = Math.floor(numericOffset / numericLimit) + 1;
    const totalPages = Math.max(1, Math.ceil(totalCount / numericLimit));
    
    res.json({
      success: true,
      data: {
        results: limitedResults,
        total: totalCount,
        showing: limitedResults.length,
        query: query || 'all',
        page: currentPage,
        limit: numericLimit,
        totalPages
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

// 모든 복지 정보 가져오기 (페이지네이션/정렬 지원)
router.get('/all', (req, res) => {
  try {
    const { category, limit = 20, page, offset, sortBy = 'latest' } = req.query;
    
    let allWelfareData = dataProcessor.welfareData;
    
    if (category) {
      allWelfareData = allWelfareData.filter(item => item.category === category);
    }
    // 정렬
    allWelfareData = [...allWelfareData].sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.benefits?.length || 0) - (a.benefits?.length || 0);
      }
      const aTime = new Date(a.lastUpdated || 0).getTime();
      const bTime = new Date(b.lastUpdated || 0).getTime();
      return bTime - aTime;
    });

    const totalCount = allWelfareData.length;
    const numericLimit = Math.max(1, parseInt(limit));
    const numericOffset = offset !== undefined ? parseInt(offset) : (Math.max(1, parseInt(page) || 1) - 1) * numericLimit;
    const limitedResults = allWelfareData.slice(numericOffset, numericOffset + numericLimit);
    const currentPage = Math.floor(numericOffset / numericLimit) + 1;
    const totalPages = Math.max(1, Math.ceil(totalCount / numericLimit));
    
    res.json({
      success: true,
      data: {
        results: limitedResults,
        total: totalCount,
        showing: limitedResults.length,
        page: currentPage,
        limit: numericLimit,
        totalPages
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
