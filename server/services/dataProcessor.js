const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

class DataProcessor {
  constructor() {
    this.welfareData = [];
    this.financeProducts = [];
    this.taxTips = [];
    this.loadData();
  }

  async loadData() {
    try {
      // 복지 데이터 로드
      await this.loadWelfareData();
      // 더미 금융상품 데이터 로드
      await this.loadFinanceData();
      // 절세 팁 데이터 로드
      await this.loadTaxTipsData();
      
      console.log('모든 데이터가 성공적으로 로드되었습니다.');
    } catch (error) {
      console.error('데이터 로드 중 오류:', error);
    }
  }

  async loadWelfareData() {
    const csvPath = path.join(__dirname, '../data/welfare_data.csv');
    const processedPath = path.join(__dirname, '../data/processed_welfare_data.json');
    
    try {
      // 이미 처리된 JSON 파일이 있고 CSV보다 최신이면 사용
      if (await fs.pathExists(processedPath) && await fs.pathExists(csvPath)) {
        const csvStats = await fs.stat(csvPath);
        const jsonStats = await fs.stat(processedPath);
        
        if (jsonStats.mtime > csvStats.mtime) {
          console.log('기존 처리된 복지 데이터 로드 중...');
          this.welfareData = await fs.readJson(processedPath);
          console.log(`복지 데이터 로드 완료: ${this.welfareData.length}개`);
          return;
        }
      }
      
      // CSV 파일을 새로 처리
      console.log('CSV 파일에서 복지 데이터 로드 중...');
      await this.convertWelfareCSVToJSON();
      
    } catch (error) {
      console.error('복지 데이터 로드 실패:', error);
      // 더미 데이터로 대체
      console.log('더미 데이터로 대체합니다.');
      this.welfareData = this.generateDummyWelfareData();
    }
  }

  async convertWelfareCSVToJSON() {
    const csvPath = path.join(__dirname, '../data/welfare_data.csv');
    const dataPath = path.join(__dirname, '../data/processed_welfare_data.json');
    
    try {
      if (await fs.pathExists(csvPath)) {
        console.log('CSV 파일 파싱 시작...');
        this.welfareData = [];
        
        return new Promise((resolve, reject) => {
          const results = [];
          
          fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
              // CSV 행을 우리 형식으로 변환
              const welfareItem = {
                id: row.policy_id || `w_${Math.random().toString(36).substr(2, 9)}`,
                name: row.policy_name || '정책명 없음',
                title: row.policy_name || '정책명 없음',
                summary: row.policy_summary || '',
                content: row.service_content_detail || row.policy_summary || '',
                targetGroup: row.target_audience_description || '',
                benefits: this.extractBenefits(row.service_content_detail || ''),
                applicationMethod: row.application_method_description || '',
                applicationPeriod: row.support_cycle || '상시',
                contact: row.contact_info_phone || '',
                agency: row.governing_body_name || '',
                url: row.application_link || '',
                relatedKeywords: this.extractKeywords(row.policy_name + ' ' + row.policy_summary),
                category: this.categorizePolicy(row.policy_name + ' ' + row.policy_summary),
                region: row.region_name || '전국',
                lastUpdated: row.last_updated || '',
                rawText: row.raw_text_for_search || ''
              };
              
              results.push(welfareItem);
            })
            .on('end', () => {
              this.welfareData = results;
              console.log(`CSV 파싱 완료: ${this.welfareData.length}개 정책 로드`);
              
              // JSON 파일로 저장
              fs.ensureDir(path.dirname(dataPath))
                .then(() => fs.writeJson(dataPath, this.welfareData, { spaces: 2 }))
                .then(() => {
                  console.log('복지 데이터 JSON 파일 저장 완료');
                  resolve();
                })
                .catch(reject);
            })
            .on('error', reject);
        });
      } else {
        console.log('CSV 파일이 없습니다. 더미 데이터를 사용합니다.');
        this.welfareData = this.generateDummyWelfareData();
        
        // JSON 파일로 저장
        await fs.ensureDir(path.dirname(dataPath));
        await fs.writeJson(dataPath, this.welfareData, { spaces: 2 });
      }
    } catch (error) {
      console.error('CSV 변환 중 오류:', error);
      this.welfareData = this.generateDummyWelfareData();
    }
  }

  extractBenefits(content) {
    // 내용에서 혜택 추출 (간단한 키워드 기반)
    const benefits = [];
    if (content.includes('지원') || content.includes('혜택')) {
      const sentences = content.split(/[.!?]/).filter(s => s.trim());
      sentences.forEach(sentence => {
        if ((sentence.includes('지원') || sentence.includes('혜택')) && sentence.length < 100) {
          benefits.push(sentence.trim());
        }
      });
    }
    return benefits.length > 0 ? benefits.slice(0, 3) : ['정책 혜택 정보'];
  }

  extractKeywords(text) {
    // 텍스트에서 키워드 추출
    const commonKeywords = [
      '청년', '월세', '세액공제', '소득공제', '연말정산', '적금', '보험',
      '대출', '카드', '청약', '연금', '장려금', '지원금', '혜택',
      '절세', '환급', '공제', '비과세', '노인', '아동', '주거', '의료',
      '교육', '출산', '육아', '취업', '창업', '문화', '복지', '생활',
      '저소득', '한부모', '장애인', '농업', '어업'
    ];

    const keywords = [];
    const lowerText = text.toLowerCase();
    
    commonKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords.length > 0 ? keywords : ['복지'];
  }

  categorizePolicy(text) {
    // 정책을 카테고리로 분류
    const categories = {
      '주거': ['월세', '주거', '임대', '주택', '아파트', '전세'],
      '자산형성': ['청년도약', '적금', '자산', '저축', '투자'],
      '취업지원': ['취업', '일자리', '구직', '채용', '인턴'],
      '생활지원': ['생활비', '장려금', '수당', '지원금'],
      '의료': ['의료', '건강', '병원', '치료', '약'],
      '교육': ['교육', '학비', '장학', '학습', '연수'],
      '노후준비': ['연금', '노후', '은퇴', '개인연금'],
      '출산육아': ['출산', '육아', '아동', '보육', '유치원'],
      '문화': ['문화', '예술', '체육', '관광', '여행'],
      '농어업': ['농업', '어업', '농민', '어민', '농촌']
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return '기타';
  }

  generateDummyWelfareData() {
    return [
      {
        id: 'w1',
        name: '청년도약계좌',
        title: '청년도약계좌',
        summary: '청년층의 자산형성을 지원하는 정부 정책상품',
        content: '월 최대 40만원까지 5년간 납입하면 정부가 매년 최대 240만원을 지원하는 청년 자산형성 상품입니다.\n\n정부가 청년층의 자산형성을 위해 도입한 정책상품으로, 납입액에 따라 정부기여금을 지급받을 수 있습니다.',
        targetGroup: '만 19~34세 청년 중 기준중위소득 180% 이하',
        benefits: ['연 6% 정부기여금', '비과세 혜택', '최대 1,200만원 지원'],
        applicationMethod: '은행 방문 또는 인터넷뱅킹을 통해 신청 가능합니다.',
        applicationPeriod: '연중 상시 접수',
        contact: '고용노동부 청년정책과 02-2110-2850',
        agency: '고용노동부',
        url: 'https://www.work.go.kr/youthjump',
        relatedKeywords: ['청년', '적금', '자산형성', '정부지원', '비과세'],
        category: '자산형성'
      },
      {
        id: 'w2',
        name: '월세 세액공제',
        title: '월세 세액공제',
        summary: '월세를 내는 무주택 세대주의 세금 부담을 줄여주는 제도',
        content: '연간 월세액의 12%를 소득세에서 공제해주며, 2025년부터 최대 75만원까지 확대됩니다.\n\n무주택 세대주가 월세를 지불하는 경우 세금 부담을 덜어주는 제도로, 연말정산이나 종합소득세 신고 시 신청할 수 있습니다.',
        targetGroup: '총급여 7천만원 이하 무주택 세대주',
        benefits: ['연간 최대 75만원 세액공제', '월세 부담 경감'],
        applicationMethod: '연말정산 또는 종합소득세 신고 시 신청 (필요서류: 임대차계약서, 월세납입증명서)',
        applicationPeriod: '연말정산: 다음해 1월, 종합소득세: 매년 5월',
        contact: '국세청 상담센터 126',
        agency: '국세청',
        url: 'https://www.hometax.go.kr',
        relatedKeywords: ['월세', '세액공제', '무주택', '연말정산'],
        category: '주거'
      },
      {
        id: 'w3',
        name: '근로·자녀장려금',
        title: '근로·자녀장려금',
        summary: '일하는 저소득 가정과 자녀양육 가정을 지원하는 정부 지원금',
        content: '소득과 재산이 일정 기준 이하인 근로자 가정에 최대 330만원의 장려금을 지급합니다.\n\n일하는 저소득 가정의 근로 의욕을 높이고 실질소득을 지원하기 위한 제도로, 가구원수와 소득 수준에 따라 차등 지급됩니다.',
        targetGroup: '부부합산 연소득 2,100만원 이하 (단독세대 1,400만원)',
        benefits: ['근로장려금 최대 330만원', '자녀장려금 최대 100만원'],
        applicationMethod: '5월 종합소득세 신고 시 함께 신청 (홈택스 또는 세무서)',
        applicationPeriod: '매년 5월 1일~31일',
        contact: '국세청 상담센터 126',
        agency: '국세청',
        url: 'https://www.hometax.go.kr',
        relatedKeywords: ['장려금', '저소득', '자녀', '근로'],
        category: '생활지원'
      },
      {
        id: 'w4',
        name: '청년내일채움공제',
        title: '청년내일채움공제',
        summary: '중소기업 취업 청년의 장기근속을 지원하는 적립식 지원제도',
        content: '중소기업에 정규직으로 취업한 청년이 2~3년간 근속 시 기업, 정부와 함께 적립하여 목돈을 마련할 수 있습니다.\n\n청년 고용 촉진과 중소기업의 인력 확보를 위해 도입된 제도로, 청년과 기업이 함께 납입하고 정부가 지원금을 추가하는 방식입니다.',
        targetGroup: '만 15~34세 중소기업 정규직 취업 청년',
        benefits: ['2년형 1,600만원', '3년형 3,000만원 수령'],
        applicationMethod: '워크넷 또는 고용센터에서 신청 (기업을 통한 단체 신청)',
        applicationPeriod: '연중 상시 접수 (기업별 상이)',
        contact: '고용노동부 고용정책실 02-2110-2724',
        agency: '고용노동부',
        url: 'https://www.work.go.kr',
        relatedKeywords: ['청년', '중소기업', '장기근속', '적립'],
        category: '취업지원'
      },
      {
        id: 'w5',
        name: '개인연금저축 세액공제',
        title: '개인연금저축 세액공제',
        summary: '개인연금 납입액에 대한 세액공제 혜택',
        content: '연간 납입액의 12~16.5%를 세액공제 받을 수 있으며, 최대 72만원까지 공제 가능합니다.\n\n노후 자금 마련을 장려하기 위한 제도로, 개인연금저축에 납입한 금액에 대해 소득 수준에 따라 차등적으로 세액공제를 제공합니다.',
        targetGroup: '개인연금저축 가입자 (연간 400만원 이하 납입자)',
        benefits: ['연간 최대 72만원 세액공제', '노후 자금 준비'],
        applicationMethod: '연말정산 시 자동 적용 (별도 신청 불필요)',
        applicationPeriod: '연중 납입, 다음해 1월 연말정산 시 공제',
        contact: '국세청 상담센터 126',
        agency: '국세청',
        url: 'https://www.hometax.go.kr',
        relatedKeywords: ['연금', '세액공제', '노후준비'],
        category: '노후준비'
      }
    ];
  }

  async loadFinanceData() {
    this.financeProducts = [
      {
        id: 'f1',
        name: 'KB국민 청년도약계좌',
        bank: 'KB국민은행',
        category: '적금',
        expectedSavings: 2400000,
        description: '• 월 최대 40만원 납입\n• 정부 기여금 연 6% 지급\n• 5년 만기 시 최대 3,600만원',
        features: ['정부 기여금', '비과세', '5년 만기'],
        applicationLink: 'https://www.kbstar.com',
        isRecommended: true,
        targetAge: '19-34세',
        condition: '기준중위소득 180% 이하'
      },
      {
        id: 'f2',
        name: 'KB국민 든든한 카드',
        bank: 'KB국민카드',
        category: '신용카드',
        expectedSavings: 480000,
        description: '• 대중교통 40% 캐시백\n• 의료비/교육비 15% 공제\n• 연간 한도 300만원',
        features: ['대중교통 할인', '의료비 공제', '교육비 공제'],
        applicationLink: 'https://card.kbcard.com',
        isRecommended: true,
        targetAge: '전연령',
        condition: '신용등급 6등급 이상'
      },
      {
        id: 'f3',
        name: '신한 쏠편한 청년통장',
        bank: '신한은행',
        category: '적금',
        expectedSavings: 1800000,
        description: '• 월 최대 30만원 납입\n• 정부 기여금 연 4%\n• 3년 만기 우대금리',
        features: ['정부 기여금', '우대금리', '청년 전용'],
        applicationLink: 'https://www.shinhan.com',
        isRecommended: true,
        targetAge: '19-29세',
        condition: '기준중위소득 150% 이하'
      },
      {
        id: 'f4',
        name: '하나 원큐페이 카드',
        bank: '하나카드',
        category: '신용카드',
        expectedSavings: 720000,
        description: '• 온라인 쇼핑 5% 적립\n• 배달음식 10% 할인\n• 구독서비스 무료 혜택',
        features: ['온라인 적립', '배달 할인', '구독 혜택'],
        applicationLink: 'https://www.hanacard.co.kr',
        isRecommended: true,
        targetAge: '전연령',
        condition: '신용등급 7등급 이상'
      },
      {
        id: 'f5',
        name: '우리 WON적금플러스',
        bank: '우리은행',
        category: '적금',
        expectedSavings: 960000,
        description: '• 월 최대 20만원 납입\n• 우대금리 연 4.5%\n• 2년 만기 자동연장',
        features: ['우대금리', '자동연장', '중도해지 가능'],
        applicationLink: 'https://www.wooribank.com',
        isRecommended: true,
        targetAge: '전연령',
        condition: '우리은행 주거래 고객'
      },
      {
        id: 'f6',
        name: '주택청약종합저축',
        bank: '우리은행',
        category: '적금',
        expectedSavings: 2400000,
        description: '내집마련 준비와 소득공제 혜택을 동시에',
        features: ['연 240만원 소득공제', '청약 가점', '우대금리'],
        applicationLink: 'https://www.wooribank.com',
        isRecommended: false,
        targetAge: '19세 이상',
        condition: '무주택자'
      },
      {
        id: 'f7',
        name: '개인연금저축',
        bank: '삼성생명',
        category: '연금',
        expectedSavings: 720000,
        description: '노후 준비와 세액공제 혜택',
        features: ['연간 최대 72만원 세액공제', '노후 자금', '복리 효과'],
        applicationLink: 'https://www.samsunglife.com',
        isRecommended: false,
        targetAge: '전연령',
        condition: '연 400만원 이하 납입'
      }
    ];
  }

  async loadTaxTipsData() {
    this.taxTips = [
      {
        id: 't1',
        title: '2025 청년 월세 세액공제 확대',
        content: '기존 60만원에서 75만원으로 확대되어 더 많은 혜택을 받을 수 있습니다.',
        category: 'hot',
        tags: ['월세', '세액공제', '청년'],
        priority: 'high',
        deadline: '2025-12-31'
      },
      {
        id: 't2',
        title: '연말정산 준비 체크리스트',
        content: '놓치기 쉬운 공제 항목들을 미리 준비하여 환급액을 늘려보세요.',
        category: 'deadline',
        tags: ['연말정산', '공제', '환급'],
        priority: 'high',
        deadline: '2025-01-31'
      },
      {
        id: 't3',
        title: '청년도약계좌 가입 조건 확인',
        content: '소득 기준과 연령 조건을 확인하고 최대한 빨리 가입하세요.',
        category: 'tip',
        tags: ['청년도약계좌', '자산형성'],
        priority: 'medium',
        deadline: null
      }
    ];
  }

  // 검색 메서드들
  searchWelfare(query) {
    if (!query) return this.welfareData;
    const q = String(query).toLowerCase();
    return this.welfareData.filter(item => {
      const hay = `${item.name} ${item.summary} ${item.content} ${item.target} ${item.agency} ${(item.relatedKeywords||[]).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }

  getWelfareById(id) {
    return this.welfareData.find(item => item.id === id);
  }

  getFinanceProducts(category = null) {
    if (!category) return this.financeProducts;
    return this.financeProducts.filter(product => 
      product.category === category
    );
  }

  getRecommendedProducts() {
    return this.financeProducts.filter(product => product.isRecommended);
  }

  getTaxTips(category = null) {
    if (!category) return this.taxTips;
    return this.taxTips.filter(tip => tip.category === category);
  }

  getWelfareById(id) {
    return this.welfareData.find(item => item.id === id);
  }
}

module.exports = new DataProcessor();
