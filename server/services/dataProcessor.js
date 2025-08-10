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
    const welfareDataPath = path.join(__dirname, '../data/processed_welfare_data.json');
    
    try {
      if (await fs.pathExists(welfareDataPath)) {
        this.welfareData = await fs.readJson(welfareDataPath);
      } else {
        // CSV 데이터를 JSON으로 변환
        await this.convertWelfareCSVToJSON();
      }
    } catch (error) {
      console.error('복지 데이터 로드 실패:', error);
      // 더미 데이터로 대체
      this.welfareData = this.generateDummyWelfareData();
    }
  }

  async convertWelfareCSVToJSON() {
    // 실제 CSV 파일이 있다면 처리, 없으면 더미 데이터 생성
    this.welfareData = this.generateDummyWelfareData();
    
    // JSON 파일로 저장
    const dataPath = path.join(__dirname, '../data/processed_welfare_data.json');
    await fs.ensureDir(path.dirname(dataPath));
    await fs.writeJson(dataPath, this.welfareData, { spaces: 2 });
  }

  generateDummyWelfareData() {
    return [
      {
        id: 'w1',
        name: '청년도약계좌',
        summary: '청년층의 자산형성을 지원하는 정부 정책상품',
        content: '월 최대 40만원까지 5년간 납입하면 정부가 매년 최대 240만원을 지원하는 청년 자산형성 상품입니다.',
        target: '만 19~34세 청년 중 기준중위소득 180% 이하',
        benefits: ['연 6% 정부기여금', '비과세 혜택', '최대 1,200만원 지원'],
        applicationMethod: '은행 방문 또는 인터넷뱅킹',
        relatedKeywords: ['청년', '적금', '자산형성', '정부지원', '비과세'],
        category: '자산형성'
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
        category: '주거'
      },
      {
        id: 'w3',
        name: '근로·자녀장려금',
        summary: '일하는 저소득 가정과 자녀양육 가정을 지원하는 정부 지원금',
        content: '소득과 재산이 일정 기준 이하인 근로자 가정에 최대 330만원의 장려금을 지급합니다.',
        target: '부부합산 연소득 2,100만원 이하 (단독세대 1,400만원)',
        benefits: ['근로장려금 최대 330만원', '자녀장려금 최대 100만원'],
        applicationMethod: '5월 종합소득세 신고 시 함께 신청',
        relatedKeywords: ['장려금', '저소득', '자녀', '근로'],
        category: '생활지원'
      },
      {
        id: 'w4',
        name: '청년내일채움공제',
        summary: '중소기업 취업 청년의 장기근속을 지원하는 적립식 지원제도',
        content: '중소기업에 정규직으로 취업한 청년이 2~3년간 근속 시 기업, 정부와 함께 적립하여 목돈을 마련할 수 있습니다.',
        target: '만 15~34세 중소기업 정규직 취업 청년',
        benefits: ['2년형 1,600만원', '3년형 3,000만원 수령'],
        applicationMethod: '워크넷 또는 고용센터 신청',
        relatedKeywords: ['청년', '중소기업', '장기근속', '적립'],
        category: '취업지원'
      },
      {
        id: 'w5',
        name: '개인연금저축 세액공제',
        summary: '개인연금 납입액에 대한 세액공제 혜택',
        content: '연간 납입액의 12~16.5%를 세액공제 받을 수 있으며, 최대 72만원까지 공제 가능합니다.',
        target: '개인연금저축 가입자',
        benefits: ['연간 최대 72만원 세액공제', '노후 자금 준비'],
        applicationMethod: '연말정산 시 자동 적용',
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
        description: '월 최대 40만원 납입, 정부 기여금 연 6%',
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
        description: '대중교통 40% 캐시백, 의료비·교육비 15% 공제',
        features: ['대중교통 할인', '의료비 공제', '교육비 공제'],
        applicationLink: 'https://card.kbcard.com',
        isRecommended: true,
        targetAge: '전연령',
        condition: '신용등급 6등급 이상'
      },
      {
        id: 'f3',
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
    
    const lowercaseQuery = query.toLowerCase();
    return this.welfareData.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.summary.toLowerCase().includes(lowercaseQuery) ||
      item.content.toLowerCase().includes(lowercaseQuery) ||
      item.relatedKeywords.some(keyword => 
        keyword.toLowerCase().includes(lowercaseQuery)
      )
    );
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
