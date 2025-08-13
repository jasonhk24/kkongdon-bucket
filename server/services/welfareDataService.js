const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class WelfareDataService {
  constructor() {
    this.welfareData = [];
    this.isLoaded = false;
  }

  async loadWelfareData() {
    return new Promise((resolve, reject) => {
      console.log('📊 복지 데이터 로딩 시작...');
      const csvPath = path.join(__dirname, '../data/welfare_data.csv');
      
      if (!fs.existsSync(csvPath)) {
        const error = new Error('CSV 파일을 찾을 수 없습니다.');
        console.error('❌ 복지 데이터 로딩 실패:', error.message);
        reject(error);
        return;
      }

      const results = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // 한글 헤더 처리
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            cleanRow[cleanKey] = row[key];
          });

          results.push({
            name: cleanRow['policy_name'] || '정책명 없음',
            category: cleanRow['region_name'] || '지역 미정',
            agency: cleanRow['governing_body_name'] || '기관 미정',
            content: cleanRow['policy_summary'] || cleanRow['service_content_detail'] || '내용 없음',
            targetGroup: cleanRow['target_audience_description'] || '대상 미정',
            applyMethod: cleanRow['application_method_description'] || '신청방법 미정',
            period: cleanRow['support_cycle'] || '기간 미정',
            contact: cleanRow['contact_info_phone'] || '연락처 미정',
            link: cleanRow['application_link'] || '',
            // 검색을 위한 원본 데이터도 보관
            originalData: cleanRow
          });
        })
        .on('end', () => {
          this.welfareData = results;
          this.isLoaded = true;
          console.log(`✅ 복지 데이터 로딩 완료: ${results.length}개 항목`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('❌ 복지 데이터 로딩 중 오류:', error);
          reject(error);
        });
    });
  }

  searchWelfareData(query, category, limit = 20, page = 1) {
    if (!this.isLoaded) {
      throw new Error('복지 데이터가 아직 로딩되지 않았습니다.');
    }

    let filteredResults = [...this.welfareData];

    // 검색 필터링
    if (query) {
      const searchText = query.toLowerCase();
      filteredResults = filteredResults.filter(item => {
        const originalData = item.originalData;
        return (
          (originalData['policy_name'] && originalData['policy_name'].toLowerCase().includes(searchText)) ||
          (originalData['service_content_detail'] && originalData['service_content_detail'].toLowerCase().includes(searchText)) ||
          (originalData['policy_summary'] && originalData['policy_summary'].toLowerCase().includes(searchText)) ||
          (originalData['target_audience_description'] && originalData['target_audience_description'].toLowerCase().includes(searchText))
        );
      });
    }

    // 카테고리 필터링
    if (category) {
      filteredResults = filteredResults.filter(item => 
        item.category && item.category.includes(category)
      );
    }

    // 페이지네이션
    const numericLimit = Math.max(1, parseInt(limit));
    const numericPage = Math.max(1, parseInt(page));
    const startIndex = (numericPage - 1) * numericLimit;
    const endIndex = startIndex + numericLimit;
    
    const paginatedResults = filteredResults.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredResults.length / numericLimit);

    // originalData 제거 (응답에서는 필요 없음)
    const cleanResults = paginatedResults.map(item => {
      const { originalData, ...cleanItem } = item;
      return cleanItem;
    });

    return {
      results: cleanResults,
      total: filteredResults.length,
      totalPages,
      currentPage: numericPage,
      hasNext: numericPage < totalPages,
      hasPrev: numericPage > 1
    };
  }

  getDataCount() {
    return this.welfareData.length;
  }

  isDataLoaded() {
    return this.isLoaded;
  }
}

// 싱글톤 인스턴스
const welfareDataService = new WelfareDataService();

module.exports = welfareDataService;
