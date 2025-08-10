const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class WelfareDataProcessor {
  constructor() {
    this.originalDataPath = 'C:\\Users\\jason\\Desktop\\PythonProject1\\꽁돈 버킷\\PythonProject2\\crawl_everythng_2';
    this.outputPath = path.join(__dirname, '../data/processed_welfare_data.json');
    this.processedData = [];
  }

  async processAllData() {
    try {
      console.log('복지 데이터 처리를 시작합니다...');
      
      // 최신 통합 데이터 파일 처리
      const latestFile = path.join(this.originalDataPath, '통합복지데이터_20250517_171517_filtered.csv');
      
      if (await fs.pathExists(latestFile)) {
        console.log('최신 통합 복지 데이터 파일을 처리합니다:', latestFile);
        await this.processCSVFile(latestFile, 'integrated');
      } else {
        console.log('통합 데이터 파일을 찾을 수 없습니다. 개별 파일들을 처리합니다.');
        
        // 개별 파일들 처리
        const files = [
          { file: '민간기관_데이터.csv', type: 'private' },
          { file: '중앙부처_데이터.csv', type: 'central' },
          { file: '지방자치단체_데이터.csv', type: 'local' }
        ];

        for (const fileInfo of files) {
          const filePath = path.join(this.originalDataPath, fileInfo.file);
          if (await fs.pathExists(filePath)) {
            console.log(`${fileInfo.file} 처리 중...`);
            await this.processCSVFile(filePath, fileInfo.type);
          }
        }
      }

      // 결과 저장
      await this.saveProcessedData();
      console.log(`총 ${this.processedData.length}개의 복지 정책이 처리되었습니다.`);
      
    } catch (error) {
      console.error('데이터 처리 중 오류:', error);
      // 오류 발생 시 더미 데이터 생성
      await this.generateFallbackData();
    }
  }

  async processCSVFile(filePath, sourceType) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(csv())
        .on('data', (data) => {
          try {
            const processed = this.transformRowData(data, sourceType);
            if (processed) {
              results.push(processed);
            }
          } catch (error) {
            console.error('행 처리 오류:', error);
          }
        })
        .on('end', () => {
          console.log(`${path.basename(filePath)}: ${results.length}개 정책 처리 완료`);
          this.processedData.push(...results);
          resolve();
        })
        .on('error', (error) => {
          console.error('CSV 파일 읽기 오류:', error);
          reject(error);
        });
    });
  }

  transformRowData(row, sourceType) {
    try {
      // 통합 데이터 형식과 개별 데이터 형식 구분 처리
      let policyData;
      
      if (sourceType === 'integrated' && row.policy_id) {
        // 통합 데이터 형식
        policyData = {
          id: row.policy_id || `policy_${Date.now()}_${Math.random()}`,
          originalId: row.original_id || '',
          name: row.policy_name || '정책명 없음',
          summary: row.policy_summary || '',
          content: row.service_content_detail || row.summary || '',
          target: row.target_audience_description || '',
          targetTags: row.target_audience_tags ? row.target_audience_tags.split(',') : [],
          applicationMethod: row.application_method_description || '',
          applicationLink: row.application_link || '',
          onlineApplicationAvailable: row.online_application_available === 'Y',
          selectionCriteria: row.selection_criteria || '',
          region: row.region_name || '전국',
          governingBody: row.governing_body_name || '',
          contactPhone: row.contact_info_phone || '',
          serviceType: row.how_to_service || '',
          supportCycle: row.support_cycle || '',
          lastUpdated: row.last_updated || new Date().toISOString(),
          sourceDocument: row.source_document || sourceType
        };
      } else {
        // 개별 데이터 형식 (민간기관 등)
        policyData = {
          id: `${sourceType}_${Date.now()}_${Math.random()}`,
          originalId: row['서비스ID'] || row.serviceId || '',
          name: row['서비스명'] || row.serviceName || row['정책명'] || '정책명 없음',
          summary: row['서비스요약'] || row.summary || row['정책요약'] || '',
          content: row['상세서비스요약'] || row.detailSummary || row['서비스내용'] || '',
          target: row['지원대상'] || row.target || '',
          targetTags: this.extractTargetTags(row),
          applicationMethod: row['신청 방법'] || row.applicationMethod || '',
          applicationLink: row['상세링크'] || row.detailLink || '',
          onlineApplicationAvailable: row['온라인신청여부'] === 'Y' || row['온라인신청여부'] === '가능',
          selectionCriteria: row['선정기준'] || row.criteria || '',
          region: row['시도명'] || row.region || '전국',
          governingBody: row['소관부처명'] || row.department || '',
          contactPhone: row['문의처'] || row.contact || '',
          serviceType: row['제공유형'] || row.serviceType || '',
          supportCycle: row['지원주기'] || row.cycle || '',
          lastUpdated: new Date().toISOString(),
          sourceDocument: sourceType
        };
      }

      // 데이터 정제 및 검증
      return this.cleanAndValidateData(policyData);
      
    } catch (error) {
      console.error('행 변환 오류:', error, row);
      return null;
    }
  }

  extractTargetTags(row) {
    const tags = [];
    const targetFields = [
      row['생애주기'] || row.lifeStage || '',
      row['가구유형'] || row.familyType || '',
      row['관심주제'] || row.interestTopic || ''
    ];

    targetFields.forEach(field => {
      if (field && typeof field === 'string') {
        const splitTags = field.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.push(...splitTags);
      }
    });

    return [...new Set(tags)]; // 중복 제거
  }

  cleanAndValidateData(data) {
    // 필수 필드 검증
    if (!data.name || data.name === '정책명 없음') {
      return null;
    }

    // 텍스트 정리
    const cleanText = (text) => {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/\s+/g, ' ').trim();
    };

    // 검색용 키워드 생성
    const keywords = this.generateSearchKeywords(data);

    // 카테고리 분류
    const category = this.categorizePolicy(data);

    return {
      ...data,
      name: cleanText(data.name),
      summary: cleanText(data.summary),
      content: cleanText(data.content),
      target: cleanText(data.target),
      relatedKeywords: keywords,
      category: category,
      benefits: this.extractBenefits(data),
      searchableText: `${data.name} ${data.summary} ${data.content} ${data.target} ${keywords.join(' ')}`
    };
  }

  generateSearchKeywords(data) {
    const keywords = new Set();
    
    // 이름에서 키워드 추출
    if (data.name) {
      const nameWords = data.name.match(/[\w가-힣]+/g) || [];
      nameWords.forEach(word => {
        if (word.length > 1) keywords.add(word);
      });
    }

    // 대상에서 키워드 추출
    const commonTargets = ['청년', '고령자', '아동', '청소년', '신혼부부', '저소득', '장애인', '한부모'];
    commonTargets.forEach(target => {
      if (data.target?.includes(target) || data.name?.includes(target)) {
        keywords.add(target);
      }
    });

    // 혜택 유형 키워드
    const benefitTypes = ['지원금', '대출', '세액공제', '소득공제', '면제', '할인', '바우처'];
    benefitTypes.forEach(benefit => {
      if (data.content?.includes(benefit) || data.summary?.includes(benefit)) {
        keywords.add(benefit);
      }
    });

    return Array.from(keywords).slice(0, 10); // 최대 10개
  }

  categorizePolicy(data) {
    const text = `${data.name} ${data.summary} ${data.content}`.toLowerCase();
    
    if (text.includes('청년') || text.includes('도약') || text.includes('내일')) return '청년지원';
    if (text.includes('주택') || text.includes('월세') || text.includes('전세')) return '주거';
    if (text.includes('세액공제') || text.includes('소득공제') || text.includes('절세')) return '세제혜택';
    if (text.includes('교육') || text.includes('학습') || text.includes('장학')) return '교육';
    if (text.includes('의료') || text.includes('건강') || text.includes('치료')) return '의료';
    if (text.includes('일자리') || text.includes('취업') || text.includes('근로')) return '취업지원';
    if (text.includes('출산') || text.includes('육아') || text.includes('보육')) return '출산육아';
    if (text.includes('문화') || text.includes('여가') || text.includes('관광')) return '문화여가';
    
    return '기타';
  }

  extractBenefits(data) {
    const benefits = [];
    const text = `${data.content} ${data.summary}`;
    
    // 금액 추출
    const amountMatches = text.match(/[\d,]+만원|[\d,]+원/g);
    if (amountMatches) {
      benefits.push(...amountMatches.slice(0, 3));
    }

    // 혜택 키워드
    const benefitKeywords = ['지원', '공제', '면제', '할인', '무료', '우대'];
    benefitKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const sentences = text.split(/[.!?]/).filter(s => s.includes(keyword));
        if (sentences.length > 0) {
          benefits.push(sentences[0].trim().substring(0, 50));
        }
      }
    });

    return [...new Set(benefits)].slice(0, 5);
  }

  async saveProcessedData() {
    try {
      await fs.ensureDir(path.dirname(this.outputPath));
      await fs.writeJson(this.outputPath, this.processedData, { spaces: 2 });
      console.log('처리된 데이터가 저장되었습니다:', this.outputPath);
    } catch (error) {
      console.error('데이터 저장 오류:', error);
    }
  }

  async generateFallbackData() {
    console.log('원본 데이터 처리 실패, 더미 데이터를 생성합니다.');
    
    this.processedData = [
      {
        id: 'w1',
        name: '청년도약계좌',
        summary: '청년층의 자산형성을 지원하는 정부 정책상품',
        content: '월 최대 40만원까지 5년간 납입하면 정부가 매년 최대 240만원을 지원하는 청년 자산형성 상품입니다.',
        target: '만 19~34세 청년 중 기준중위소득 180% 이하',
        benefits: ['연 6% 정부기여금', '비과세 혜택', '최대 1,200만원 지원'],
        applicationMethod: '은행 방문 또는 인터넷뱅킹',
        relatedKeywords: ['청년', '적금', '자산형성', '정부지원', '비과세'],
        category: '청년지원',
        region: '전국',
        lastUpdated: new Date().toISOString(),
        sourceDocument: 'fallback'
      },
      {
        id: 'w2',
        name: '월세 세액공제',
        summary: '월세를 내는 무주택 세대주의 세금 부담을 줄여주는 제도',
        content: '연간 월세액의 12%를 소득세에서 공제해주며, 2025년부터 최대 75만원까지 확대됩니다.',
        target: '총급여 7천만원 이하 무주택 세대주',
        benefits: ['연간 최대 75만원 세액공제', '월세 부담 경감'],
        applicationMethod: '연말정산 또는 종합소득세 신고 시 신청',
        relatedKeywords: ['월세', '세액공제', '무주택', '연말정산'],
        category: '주거',
        region: '전국',
        lastUpdated: new Date().toISOString(),
        sourceDocument: 'fallback'
      }
      // 더 많은 더미 데이터...
    ];

    await this.saveProcessedData();
  }
}

// 스크립트 실행
if (require.main === module) {
  const processor = new WelfareDataProcessor();
  processor.processAllData()
    .then(() => {
      console.log('복지 데이터 처리가 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('처리 실패:', error);
      process.exit(1);
    });
}

module.exports = WelfareDataProcessor;
