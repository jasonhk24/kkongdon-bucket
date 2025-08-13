const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// CSV에서 직접 복지 데이터 읽기 (임베딩 없이)
router.get('/csv', async (req, res) => {
  try {
    console.log('📄 CSV에서 복지 데이터 직접 읽기 요청');
    const { q: query, category, limit = 20, page = 1 } = req.query;
    
    const csvPath = path.join(__dirname, '../data/welfare_data.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        error: 'CSV 파일을 찾을 수 없습니다.'
      });
    }

    const results = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // 한글 헤더 처리
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            cleanRow[cleanKey] = row[key];
          });

          // 검색 필터링
          if (query) {
            const searchText = query.toLowerCase();
            const matches = 
              (cleanRow['policy_name'] && cleanRow['policy_name'].toLowerCase().includes(searchText)) ||
              (cleanRow['service_content_detail'] && cleanRow['service_content_detail'].toLowerCase().includes(searchText)) ||
              (cleanRow['policy_summary'] && cleanRow['policy_summary'].toLowerCase().includes(searchText)) ||
              (cleanRow['target_audience_description'] && cleanRow['target_audience_description'].toLowerCase().includes(searchText));
            
            if (!matches) return;
          }

          // 카테고리 필터링 (region_name을 카테고리로 사용)
          if (category && cleanRow['region_name'] && !cleanRow['region_name'].includes(category)) {
            return;
          }

          results.push({
            name: cleanRow['policy_name'] || '정책명 없음',
            category: cleanRow['region_name'] || '지역 미정',
            agency: cleanRow['governing_body_name'] || '기관 미정',
            content: cleanRow['policy_summary'] || cleanRow['service_content_detail'] || '내용 없음',
            targetGroup: cleanRow['target_audience_description'] || '대상 미정',
            applyMethod: cleanRow['application_method_description'] || '신청방법 미정',
            period: cleanRow['support_cycle'] || '기간 미정',
            contact: cleanRow['contact_info_phone'] || '연락처 미정',
            link: cleanRow['application_link'] || ''
          });
        })
        .on('end', () => {
          console.log(`📊 CSV에서 총 ${results.length}개 데이터 읽기 완료`);
          
          // 페이지네이션
          const numericLimit = Math.max(1, parseInt(limit));
          const numericPage = Math.max(1, parseInt(page));
          const startIndex = (numericPage - 1) * numericLimit;
          const endIndex = startIndex + numericLimit;
          
          const paginatedResults = results.slice(startIndex, endIndex);
          const totalPages = Math.ceil(results.length / numericLimit);
          
          res.json({
            success: true,
            data: {
              results: paginatedResults,
              total: results.length,
              showing: paginatedResults.length,
              query: query || 'all',
              page: numericPage,
              limit: numericLimit,
              totalPages
            }
          });
          resolve();
        })
        .on('error', (error) => {
          console.error('CSV 읽기 오류:', error);
          res.status(500).json({
            success: false,
            error: 'CSV 파일 읽기 중 오류가 발생했습니다.'
          });
          reject(error);
        });
    });

  } catch (error) {
    console.error('CSV 복지 데이터 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// 간단한 복지 데이터 테스트 엔드포인트
router.get('/test', (req, res) => {
  try {
    console.log('🧪 복지 데이터 테스트 요청');
    const testData = [
      {
        name: "청년도약계좌",
        category: "금융지원",
        agency: "기획재정부",
        content: "만 19~34세 청년의 자산형성을 지원하는 정책으로 최고 6% 금리 제공",
        targetGroup: "만 19~34세 청년"
      },
      {
        name: "청년월세 한 달치 지원사업",
        category: "주거지원", 
        agency: "국토교통부",
        content: "무주택 청년의 월세 부담 완화를 위한 월세 지원",
        targetGroup: "만 19~34세 무주택 청년"
      }
    ];
    
    res.json({
      success: true,
      data: {
        results: testData,
        total: testData.length,
        showing: testData.length,
        query: 'test',
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('복지 테스트 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// 복지 정보 검색 (페이지네이션/정렬 지원)
router.get('/search', (req, res) => {
  try {
    console.log('🔍 복지 정보 검색 요청:', req.query);
    console.log('📊 데이터 프로세서 상태:', {
      welfareDataLength: dataProcessor.welfareData.length,
      hasSearchFunction: typeof dataProcessor.searchWelfare === 'function'
    });
    
    const { q: query, category, limit = 10, page, offset, sortBy = 'latest' } = req.query;
    
    let allResults = dataProcessor.searchWelfare(query || '');
    console.log('🔎 검색 결과:', allResults.length, '개');
    
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
