import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, Home, Bot, Gift, Settings, Target, TrendingUp, Calendar, Bell, Send, Loader, Search, X } from 'lucide-react';
import { bucketAPI, chatbotAPI, welfareAPI, recommendationAPI } from './services/api';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [bucketList, setBucketList] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [bucketLists, setBucketLists] = useState([]);
  const [savedAmount, setSavedAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);

  // 챗봇 관련 상태
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [faqData, setFaqData] = useState([]);
  const chatInputRef = useRef(null);
  const bucketListRef = useRef(null);
  const targetAmountRef = useRef(null);
  
  // 복지 정보 관련 상태
  const [welfareResults, setWelfareResults] = useState([]);
  const [welfareCategories, setWelfareCategories] = useState([]);
  const [selectedWelfareCategory, setSelectedWelfareCategory] = useState('all');
  const [isWelfareLoading, setIsWelfareLoading] = useState(false);
  const [showWelfareDetail, setShowWelfareDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 한 페이지에 10개씩 표시
  const [totalWelfareCount, setTotalWelfareCount] = useState(0);
  const [hasLoadedWelfare, setHasLoadedWelfare] = useState(false); // 복지 데이터 로드 여부 추적
  const welfareSearchRef = useRef(null);

  // 금융상품 관련 상태
  const [financialProducts, setFinancialProducts] = useState([]);
  const [showProductDetail, setShowProductDetail] = useState(null);
  
  // 개인화 추천 관련 상태
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [recommendationData, setRecommendationData] = useState({
    bucketGoal: '',
    targetAmount: '',
    timeFrame: 12,
    riskTolerance: 'moderate',
    age: '',
    income: ''
  });

  // 카운트업 애니메이션
  const [displaySaved, setDisplaySaved] = useState(0);
  const [displayMonthly, setDisplayMonthly] = useState(0);

  useEffect(() => {
    const animateNumber = (target, setter, duration = 1000) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };

    if (currentScreen === 'dashboard') {
      animateNumber(savedAmount, setDisplaySaved);
      animateNumber(monthlyAmount, setDisplayMonthly);
    }
  }, [currentScreen, savedAmount, monthlyAmount]);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // 복지정보 초기 로드 체크
  useEffect(() => {
    // 페이지 새로고침 후 복지 탭이 이미 선택되어 있다면 데이터 로드
    const savedTab = sessionStorage.getItem('selectedTab');
    if (savedTab === 'welfare' && !hasLoadedWelfare && currentScreen === 'recommend') {
      loadAllWelfare(1);
      setHasLoadedWelfare(true);
    }
  }, [currentScreen, hasLoadedWelfare]);

  const loadInitialData = async () => {
    try {
      // FAQ 데이터 설정
      setFaqData([
        {
          id: 1,
          question: "월세 세액공제 받는 방법이 궁금해요",
          answer: "월세 세액공제는 무주택 세대주가 총급여 7천만원 이하일 때 받을 수 있어요."
        },
        {
          id: 2,
          question: "청년도약계좌 조건이 어떻게 되나요?",
          answer: "만 19~34세 청년으로 소득 요건을 충족하면 가입할 수 있어요."
        },
        {
          id: 3,
          question: "주택청약종합저축의 소득공제 한도는?",
          answer: "연간 납입액 240만원 한도로 40% 소득공제를 받을 수 있습니다."
        }
      ]);

      // 금융상품 데이터 설정
      setFinancialProducts([
        {
          id: 'kb-young-youth-account',
          name: 'KB Young Youth 청소년통장',
          type: '입출금이 자유로운 예금 (저축예금)',
          target: '만 19세 미만 실명의 개인 (1인 1계좌)',
          channel: '',
          period: '해당 없음',
          amount: '해당 없음',
          rate: '별도 안내',
          paymentType: '해당 없음',
          features: "'저금통' 기능으로 특별우대이율 및 수수료 면제, 무료 교육서비스 제공",
          note: "만 19세 되는 해 첫 영업일에 'KB국민ONE통장'으로 자동전환",
          category: 'youth'
        },
        {
          id: 'kb-one-account',
          name: 'KB국민ONE통장',
          type: '입출금이 자유로운 예금',
          target: "'KB Young Youth 청소년통장'에서 전환된 고객 등",
          channel: '자동전환',
          period: '해당 없음',
          amount: '해당 없음',
          rate: '별도 안내',
          paymentType: '해당 없음',
          features: '실적에 따라 전자금융 이체수수료, 자동화기기 시간외출금수수료 등 면제',
          note: '면제 조건은 기본실적(KB카드결제, 공과금이체)과 추가실적(급여이체 등)에 따라 차등 적용',
          category: 'general'
        },
        {
          id: 'kb-diy-savings',
          name: 'KB내맘대로적금',
          type: '정액적립식/자유적립식',
          target: '만 14세 이상의 실명의 개인',
          channel: '인터넷, 스타뱅킹',
          period: '6개월 ~ 36개월 (월단위/일단위)',
          amount: '[자유] 월 1만원 ~ 3백만원 / [정액] 월 1만원 이상 약정 금액',
          rate: '3.55%',
          paymentType: '만기일시지급식',
          features: '고객이 직접 우대이율 등 상품 요건을 설계하는 DIY형 비대면 전용 상품',
          note: '자유적립식 예금은 1인 최대 5계좌까지 가입 가능',
          category: 'savings'
        },
        {
          id: 'kb-young-youth-savings',
          name: 'KB Young Youth 적금',
          type: '자유적립식 예금',
          target: '만 19세 미만 실명의 개인 (1인 1계좌)',
          channel: '스타뱅킹',
          period: '1년 (자동 재예치 가능)',
          amount: '신규 1만원~3백만원, 2회차 이후 월 1천원~3백만원',
          rate: '3.40%',
          paymentType: '만기일시지급식',
          features: '어린이/청소년을 위한 무료 보험가입서비스 제공',
          note: '만 20세가 되는 해에 만기 도래 시 재예치 불가',
          category: 'youth'
        },
        {
          id: 'kb-star-deposit',
          name: 'KB Star 정기예금',
          type: '정기예금',
          target: '개인 및 개인사업자',
          channel: '인터넷, 스타뱅킹, 고객센터',
          period: '1개월 ~ 36개월 (월단위)',
          amount: '1백만원 이상 (추가입금 불가)',
          rate: '2.45%',
          paymentType: '만기일시지급식',
          features: 'Digital KB 대표 정기예금으로, 자동 만기관리 및 분할인출 가능',
          note: '분할인출은 가입 1개월 후부터 총 3회 가능하며, 인출 후 잔액 100만원 이상 유지 필요',
          category: 'deposit'
        },
        {
          id: 'kb-youth-leap-account',
          name: 'KB청년도약계좌',
          type: '자유적립식 예금',
          target: '만 19세~34세, 개인소득 및 가구소득 기준 충족자',
          channel: '스타뱅킹',
          period: '60개월',
          amount: '월 1천원 ~ 70만원',
          rate: '6.00%',
          paymentType: '만기일시지급식',
          features: '정부기여금 지급 및 비과세 혜택 제공',
          note: '청년희망적금 보유자 가입 불가, 가입/신규 기간 별도 운영',
          category: 'youth'
        },
        {
          id: 'kb-health-savings',
          name: 'KB스타 건강적금',
          type: '자유적립식 예금',
          target: '만 14세 이상 실명의 개인 (1인 1계좌)',
          channel: '스타뱅킹',
          period: '6개월',
          amount: '월 1만원 ~ 20만원',
          rate: '6.00%',
          paymentType: '만기일시지급식',
          features: '걸음수에 따른 우대금리 적용',
          note: '10만좌 한도 소진 시 판매 종료',
          category: 'special'
        },
        {
          id: 'kb-star-savings-3',
          name: 'KB스타적금Ⅲ',
          type: '자유적립식 예금',
          target: '만 19세 이상 실명의 개인 (1인 1계좌)',
          channel: '스타뱅킹',
          period: '12개월',
          amount: '월 1만원 ~ 30만원',
          rate: '6.00%',
          paymentType: '만기일시지급식',
          features: '신규 또는 장기미거래 고객에게 우대이율 제공',
          note: '30만좌 한도 소진 시 판매 종료',
          category: 'special'
        },
        {
          id: 'kb-travel-savings',
          name: 'KB두근두근여행적금',
          type: '정액적립식 예금',
          target: '실명의 개인',
          channel: '스타뱅킹',
          period: '6개월',
          amount: '월 5만원 ~ 100만원 (만원 단위)',
          rate: '3.65%',
          paymentType: '만기일시지급식',
          features: '노랑풍선 최대 3만원 & 4% 할인쿠폰 제공',
          note: '여행 준비에 특화된 적금',
          category: 'special'
        }
      ]);

      // 복지 카테고리 설정
      setWelfareCategories([
        { id: 'all', name: '전체', count: 5000 },
        { id: 'youth', name: '청년지원', count: 850 },
        { id: 'housing', name: '주거지원', count: 320 },
        { id: 'job', name: '취업지원', count: 420 },
        { id: 'education', name: '교육지원', count: 380 },
        { id: 'finance', name: '금융지원', count: 290 }
      ]);

      console.log('초기 데이터 로딩 완료');
    } catch (error) {
    }
  };

  // 챗봇 메시지 전송 함수
  const sendChatMessage = async () => {
    const currentInput = chatInputRef.current?.value?.trim();
    if (!currentInput || isLoading) return;

    const userMessage = currentInput;
    chatInputRef.current.value = '';
    
    // 사용자 메시지 추가
    const newMessages = [...chatMessages, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }];
    setChatMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(userMessage, newMessages.slice(-5));
      if (response.success && response.data) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message,
          relevantInfo: response.data.relevantInfo || [],
          timestamp: response.data.timestamp || new Date().toISOString()
        }]);
      } else {
        throw new Error(response.error || '응답 형식 오류');
      }
    } catch (error) {
      // 서버 미응답 시 간단 Fallback
      const message = userMessage.toLowerCase();
      const quick = message.includes('청년도약') ? '청년도약계좌는 만 19~34세 청년 대상 자산형성 상품입니다.'
        : message.includes('월세') ? '월세 세액공제는 연 750만원 한도 12% 공제됩니다.'
        : '절세/복지 관련 질문을 해주세요!';
      setChatMessages(prev => [...prev, { role: 'assistant', content: quick, timestamp: new Date().toISOString() }]);
    }
    
    setIsLoading(false);
  };

  const handleFAQClick = async (question) => {
    if (chatInputRef.current) {
      chatInputRef.current.value = question;
    }
    await sendChatMessage();
  };

  // 개인화 금융상품 추천 함수들
  const handleRecommendationSubmit = async () => {
    if (!recommendationData.bucketGoal || !recommendationData.targetAmount) {
      alert('버킷리스트 목표와 목표금액을 입력해주세요.');
      return;
    }

    setIsLoadingRecommendations(true);
    
    try {
      console.log('🎯 추천 요청 데이터:', recommendationData);
      
      const response = await recommendationAPI.getRecommendations({
        bucketGoal: recommendationData.bucketGoal,
        targetAmount: parseInt(recommendationData.targetAmount),
        timeFrame: parseInt(recommendationData.timeFrame),
        riskTolerance: recommendationData.riskTolerance,
        age: recommendationData.age ? parseInt(recommendationData.age) : undefined,
        income: recommendationData.income ? parseInt(recommendationData.income) : undefined
      });

      if (response.success) {
        setRecommendations(response.data.recommendations);
        setShowRecommendationForm(false);
        console.log('✅ 추천 받기 성공:', response.data);
      } else {
        throw new Error(response.error || '추천 실패');
      }
    } catch (error) {
      console.error('❌ 추천 요청 실패:', error);
      alert('추천 시스템에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const openRecommendationForm = () => {
    // 기존 버킷리스트 데이터가 있으면 미리 채우기
    if (bucketList && targetAmount) {
      setRecommendationData(prev => ({
        ...prev,
        bucketGoal: bucketList,
        targetAmount: targetAmount
      }));
    }
    setShowRecommendationForm(true);
  };

  // 복지 정보 검색 함수 (CSV 직접 검색)
  const searchWelfare = async (query, page = currentPage) => {
    const searchQuery = query || welfareSearchRef.current?.value?.trim() || '';
    
    setIsWelfareLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      if (selectedWelfareCategory !== 'all') {
        params.append('category', selectedWelfareCategory);
      }

      const apiUrl = `${process.env.NODE_ENV === 'production' ? 'https://kkongdon-bucket.vercel.app' : process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/welfare/csv?${params}`;
      console.log('🔍 CSV 검색 API 호출:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data?.success && data.data) {
        setWelfareResults(data.data.results || []);
        setTotalWelfareCount(data.data.total || 0);
        setCurrentPage(page);
        console.log('✅ CSV 검색 완료:', data.data.results?.length, '개 결과');
      } else {
        throw new Error('검색 결과 없음');
      }
    } catch (error) {
      console.error('복지 CSV 검색 오류:', error);
      // Fallback 데이터
      searchWelfareFallback(searchQuery, page);
    } finally {
      setIsWelfareLoading(false);
    }
  };

  // Fallback 데이터를 사용한 검색
  const searchWelfareFallback = (searchQuery, page = currentPage) => {
    const allData = [
      {
        id: 'youth-monthly-rent',
        name: '청년 월세 한시 특별지원',
        agency: '국토교통부',
        category: '주거지원',
        content: '만 19~34세 청년의 월세 부담을 덜어주기 위해 월 최대 20만원씩 12개월간 지원하는 정책입니다.',
        targetGroup: '만 19~34세 무주택 청년',
        applicationPeriod: '2024년 상시',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004123'
      },
      {
        id: 'birth-support',
        name: '첫만남이용권',
        agency: '보건복지부',
        category: '출산·보육',
        content: '2022년 1월 1일 이후 출생한 아동에게 국민행복카드 포인트 200만원을 지급하는 출산 지원 정책입니다.',
        targetGroup: '2022년 이후 출생 아동',
        applicationPeriod: '출생 후 2년 이내',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004045'
      },
      {
        id: 'elderly-medical',
        name: '노인 의료비 지원',
        agency: '보건복지부',
        category: '의료지원',
        content: '65세 이상 기초생활수급자 및 차상위계층의 의료비 본인부담금을 지원하는 정책입니다.',
        targetGroup: '65세 이상 저소득층',
        applicationPeriod: '연중 상시',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00003789'
      },
      {
        id: 'job-seeker-allowance',
        name: '구직급여',
        agency: '고용노동부',
        category: '고용지원',
        content: '비자발적으로 실업상태가 된 구직자에게 구직활동을 지원하고 생활안정을 도모하는 급여입니다.',
        targetGroup: '고용보험 가입 이력이 있는 실업자',
        applicationPeriod: '실업 후 12개월 이내',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00003567'
      },
      {
        id: 'startup-support',
        name: '청년창업지원',
        agency: '중소벤처기업부',
        category: '창업지원',
        content: '만 39세 이하 청년의 창업을 지원하기 위한 사업화 자금 및 멘토링을 제공하는 정책입니다.',
        targetGroup: '만 39세 이하 예비창업자',
        applicationPeriod: '연 2회 공모',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00003899'
      }
    ];

    // 검색 필터링
    let filtered = allData.filter(item => 
      item.name.includes(searchQuery) ||
      item.content.includes(searchQuery) ||
      item.category.includes(searchQuery)
    );

    // 카테고리 필터
    if (selectedWelfareCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedWelfareCategory);
    }

    // 페이지네이션
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    setWelfareResults(filtered.slice(start, end));
    setTotalWelfareCount(filtered.length);
    setCurrentPage(page);
  };

  // 전체 복지 정보 로드
  const loadAllWelfare = async (page = currentPage) => {
    setIsWelfareLoading(true);

    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await welfareAPI.getAll({
        limit: itemsPerPage,
        offset: offset,
        category: selectedWelfareCategory !== 'all' ? selectedWelfareCategory : undefined
      });

      if (response?.success && response.data) {
        setWelfareResults(response.data.results || []);
        setTotalWelfareCount(response.data.total || 0);
        setCurrentPage(page);
      } else {
        throw new Error('데이터 로드 실패');
      }
    } catch (error) {
      console.error('복지 정보 로드 오류:', error);
      // Fallback
      searchWelfareFallback('', page);
    } finally {
      setIsWelfareLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = async (page) => {
    const currentQuery = welfareSearchRef.current?.value?.trim();
    if (currentQuery) {
      await searchWelfare(currentQuery, page);
    } else {
      await loadAllWelfare(page);
    }
  };

  // 복지 정보 상세 조회
  const getWelfareDetail = (welfare) => {
    if (welfare.url) {
      window.open(welfare.url, '_blank');
    } else {
      setShowWelfareDetail(welfare);
    }
  };

  const handleOnboardingComplete = () => {
    const bucketListValue = bucketListRef.current?.value?.trim();
    const targetAmountValue = targetAmountRef.current?.value?.replace(/[^0-9]/g, '');
    
    if (!bucketListValue) {
      alert('버킷리스트를 입력해주세요! 🎯');
      bucketListRef.current?.focus();
      return;
    }
    
    if (!targetAmountValue || parseInt(targetAmountValue) < 1000) {
      alert('목표 금액을 1,000원 이상 입력해주세요! 💰');
      targetAmountRef.current?.focus();
      return;
    }
    
    setBucketList(bucketListValue);
    setTargetAmount(targetAmountValue);
    setBucketLists([{ 
      id: 1, 
      name: bucketListValue, 
      target: parseInt(targetAmountValue), 
      saved: 0,
      deadline: '2024-12-31'
    }]);
    setSavedAmount(350000);
    setMonthlyAmount(85000);
    setCurrentScreen('dashboard');
  };

  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
      <div className="max-w-md mx-auto pt-16">
        {/* 로고 영역 */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">꽁돈버킷</h1>
          <p className="text-gray-600">절세로 모은 꽁돈으로<br />버킷리스트를 이뤄보세요</p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-3">
              어떤 버킷리스트를 이루고 싶나요? 💫
            </label>
            <textarea
              ref={bucketListRef}
              defaultValue={bucketList}
              placeholder="예: 제주도 여행, 맥북 구매, 어학연수..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-800 resize-none"
              maxLength="50"
              rows="2"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-3">
              목표 금액을 입력하세요 💰
            </label>
            <div className="relative">
              <input
                ref={targetAmountRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={targetAmount ? parseInt(targetAmount).toLocaleString() : ''}
                onInput={(e) => {
                  // 숫자만 추출
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  // 콤마 포맷팅 적용
                  const formattedValue = numericValue ? parseInt(numericValue).toLocaleString() : '';
                  e.target.value = formattedValue;
                }}
                placeholder="1,000,000"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-800 pr-12"
              />
              <span className="absolute right-4 top-4 text-gray-500">원</span>
            </div>
          </div>

          <button
            onClick={handleOnboardingComplete}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium py-4 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105 active:scale-95"
          >
            시작하기 🚀
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          언제든지 수정하고 추가할 수 있어요!
        </div>
      </div>
    </div>
  );

  const DashboardScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 pt-12 pb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-white text-lg font-medium opacity-90">나의 꿈</h2>
            <h1 className="text-white text-2xl font-bold">{bucketLists[0]?.name || '버킷리스트'}</h1>
          </div>
          <Bell className="w-6 h-6 text-white opacity-80" />
        </div>
        
        {/* 진행률 */}
        <div className="bg-white bg-opacity-20 rounded-2xl p-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-white font-medium">목표까지</span>
            <span className="text-white text-xl font-bold">
              {bucketLists[0] ? Math.round((displaySaved / bucketLists[0].target) * 100) : 0}%
            </span>
          </div>
          <div className="bg-white bg-opacity-30 rounded-full h-3 mb-2">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-1000 ease-out"
              style={{ width: `${bucketLists[0] ? Math.min((displaySaved / bucketLists[0].target) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-white text-sm">
            <span>{displaySaved.toLocaleString()}원</span>
            <span>{bucketLists[0]?.target.toLocaleString() || 0}원</span>
          </div>
        </div>
      </div>

      {/* 절세 현황 카드 */}
      <div className="px-6 -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-center">
              <div className="text-blue-500 text-sm font-medium mb-1">이번 달 절세</div>
              <div className="text-2xl font-bold text-gray-800">{displayMonthly.toLocaleString()}</div>
              <div className="text-xs text-gray-500">원 절약</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-center">
              <div className="text-green-500 text-sm font-medium mb-1">누적 절세</div>
              <div className="text-2xl font-bold text-gray-800">{displaySaved.toLocaleString()}</div>
              <div className="text-xs text-gray-500">원 절약</div>
            </div>
          </div>
        </div>

        {/* 추천 액션 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">오늘의 절세 미션 🎯</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">마감 임박</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">월세 세액공제 신청</div>
                <div className="text-sm text-gray-600">최대 75만원 공제 가능</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">청년도약계좌 개설</div>
                <div className="text-sm text-gray-600">매월 최대 40만원 납입</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <button 
          onClick={() => setCurrentScreen('bucket')}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium py-4 rounded-2xl transform hover:scale-105 active:scale-95 transition-all mb-20"
        >
          버킷리스트 수정/추가 ✨
        </button>
      </div>
    </div>
  );

  const BucketScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-16 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">버킷리스트 관리</h1>
          <button className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {bucketLists.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{item.name}</h3>
                  <p className="text-gray-600 text-sm">목표: {item.target.toLocaleString()}원</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">진행률</span>
                  <span className="text-yellow-600 font-medium">
                    {Math.round((item.saved / item.target) * 100)}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min((item.saved / item.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {item.deadline}까지
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {displaySaved.toLocaleString()}원 모음
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 mb-2">새로운 목표를 추가해보세요!</h3>
            <p className="text-gray-600 text-sm mb-4">더 많은 절세 혜택을 받을 수 있어요</p>
            <button className="bg-white text-blue-600 font-medium px-6 py-3 rounded-xl hover:shadow-md transition-all">
              목표 추가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatbotScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">세법 도우미 🤖</h1>
        
        {/* 최신 정보 카드 */}
        <div className="mb-6 space-y-3">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border-l-4 border-red-400">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-red-600 text-sm font-medium mb-1">🔥 HOT</div>
                <h3 className="font-bold text-gray-800 mb-1">2025 청년 월세 세액공제 확대</h3>
                <p className="text-gray-600 text-sm">기존 60만원 → 75만원으로 확대</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-l-4 border-blue-400">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-600 text-sm font-medium mb-1">📅 마감임박</div>
                <h3 className="font-bold text-gray-800 mb-1">연말정산 준비 체크리스트</h3>
                <p className="text-gray-600 text-sm">놓치면 안 되는 공제 항목들</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
            </div>
          </div>
        </div>

        {/* 챗봇 대화창 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6" style={{height: '400px'}}>
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4 pb-4 border-b">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-800">세법 도우미</div>
                <div className="text-xs text-green-500">● 온라인</div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {chatMessages.length === 0 && (
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs">
                  <p className="text-gray-800 text-sm">안녕하세요! 절세 관련 궁금한 것이 있으시면 언제든 물어보세요 😊</p>
                </div>
              )}
              
              {chatMessages.map((message, index) => (
                <div key={index} className={`${message.role === 'user' ? 'ml-auto' : ''} max-w-xs`}>
                  <div className={`p-3 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.relevantInfo && message.relevantInfo.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">관련 정보:</p>
                        {message.relevantInfo.map((info, idx) => (
                          <p key={idx} className="text-xs text-blue-600 underline cursor-pointer" 
                             onClick={() => window.open(info.url, '_blank')}>
                            {info.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">답변 생성 중...</span>
                </div>
              )}
            </div>
            
            <div className="flex mt-4">
              <input
                ref={chatInputRef}
                type="text"
                placeholder="궁금한 것을 물어보세요..."
                className="flex-1 p-3 border border-gray-200 rounded-xl rounded-r-none focus:outline-none focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    sendChatMessage();
                  }
                }}
                disabled={isLoading}
              />
              <button 
                onClick={sendChatMessage}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 rounded-xl rounded-l-none hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 추천 질문 */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">자주 묻는 질문</h3>
          <div className="grid grid-cols-1 gap-2">
            {faqData.map((faq, idx) => (
              <button 
                key={idx} 
                onClick={() => handleFAQClick(faq.question)}
                className="text-left bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-700 text-sm"
              >
                {faq.question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const RecommendScreen = () => {
    // 탭 상태를 sessionStorage에서 복원하거나 기본값으로 설정
    const [selectedTab, setSelectedTab] = useState(() => {
      return sessionStorage.getItem('selectedTab') || 'recommendation';
    });
    
    // 탭 변경 시 sessionStorage에 저장
    const handleTabChange = (tabName) => {
      setSelectedTab(tabName);
      sessionStorage.setItem('selectedTab', tabName);
      
      // 복지정보 탭이 처음 선택될 때만 데이터 로드
      if (tabName === 'welfare' && !hasLoadedWelfare) {
        loadAllWelfare(1);
        setHasLoadedWelfare(true);
      }
    };

    // 카테고리별 상품 필터링
    const getProductsByCategory = (category) => {
      return financialProducts.filter(product => product.category === category);
    };

    // 맞춤 추천 로직 (사용자의 나이대나 상황에 따라)
    const getRecommendedProducts = () => {
      return financialProducts.filter(product => 
        product.category === 'youth' || product.rate === '6.00%'
      ).slice(0, 3);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 pt-16 pb-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">추천상품 & 복지정보</h1>
              <p className="text-gray-600 text-sm">나에게 맞는 금융상품과 복지혜택을 찾아보세요</p>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => handleTabChange('financial')}
              className={`flex-1 py-3 px-2 rounded-lg font-medium transition-all text-sm ${
                selectedTab === 'financial'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💰 금융상품
            </button>
            <button
              onClick={() => handleTabChange('recommendation')}
              className={`flex-1 py-3 px-2 rounded-lg font-medium transition-all text-sm ${
                selectedTab === 'recommendation'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎯 맞춤추천
            </button>
            <button
              onClick={() => handleTabChange('welfare')}
              className={`flex-1 py-3 px-2 rounded-lg font-medium transition-all text-sm ${
                selectedTab === 'welfare'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎁 복지정보
            </button>
          </div>

          {/* 금융상품 탭 */}
          {selectedTab === 'financial' && (
            <>
              {/* 맞춤 추천 상품 */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4">🔥 맞춤 추천</h3>
                <div className="space-y-4">
                  {getRecommendedProducts().map((product) => (
                    <div key={product.id} className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold mb-2">{product.name}</h4>
                          <p className="text-blue-100 text-sm">{product.type}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">
                          추천
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm opacity-90 mb-1">최고금리</div>
                        <div className="text-2xl font-bold">{product.rate}</div>
                      </div>
                      <div className="text-sm opacity-90 mb-6">
                        {product.features}
                      </div>
                      <button 
                        onClick={() => setShowProductDetail(product)}
                        className="w-full bg-white text-blue-600 font-medium py-3 rounded-xl hover:bg-opacity-90 transition-all"
                      >
                        자세히 보기
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 카테고리별 상품 */}
              <div className="space-y-6">
                <h3 className="font-bold text-gray-800">📋 카테고리별 상품</h3>
                
                {/* 청년 전용 상품 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">👤 청년 전용</h4>
                  <div className="space-y-3">
                    {getProductsByCategory('youth').map((product) => (
                      <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{product.name}</h5>
                            <p className="text-gray-600 text-sm">{product.type}</p>
                            <p className="text-blue-600 text-lg font-bold mt-1">금리 {product.rate}</p>
                          </div>
                          <button 
                            onClick={() => setShowProductDetail(product)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                          >
                            자세히 보기
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm">{product.features}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 적금 상품 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">💰 적금</h4>
                  <div className="space-y-3">
                    {getProductsByCategory('savings').map((product) => (
                      <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{product.name}</h5>
                            <p className="text-gray-600 text-sm">{product.type}</p>
                            <p className="text-green-600 text-lg font-bold mt-1">금리 {product.rate}</p>
                          </div>
                          <button 
                            onClick={() => setShowProductDetail(product)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                          >
                            자세히 보기
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm">{product.features}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 특별 상품 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">⭐ 특별 상품</h4>
                  <div className="space-y-3">
                    {getProductsByCategory('special').map((product) => (
                      <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{product.name}</h5>
                            <p className="text-gray-600 text-sm">{product.type}</p>
                            <p className="text-orange-600 text-lg font-bold mt-1">금리 {product.rate}</p>
                          </div>
                          <button 
                            onClick={() => setShowProductDetail(product)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                          >
                            자세히 보기
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm">{product.features}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 복지정보 탭 */}
          {selectedTab === 'welfare' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-xl mb-2">🎁 복지혜택 정보</h3>
                <p className="text-green-100">정부에서 제공하는 다양한 복지 혜택을 확인해보세요</p>
                <div className="mt-3 text-sm">
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    총 {totalWelfareCount}개 정책
                  </span>
                </div>
              </div>

              {/* 검색 입력창 */}
              <div className="relative">
                <input
                  ref={welfareSearchRef}
                  type="text"
                  placeholder="복지 정책 검색 (예: 청년, 의료지원, 주거 등)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const query = e.target.value.trim();
                      if (query) {
                        searchWelfare(query);
                      } else {
                        loadAllWelfare(1);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const query = welfareSearchRef.current?.value?.trim();
                    if (query) {
                      searchWelfare(query);
                    } else {
                      loadAllWelfare(1);
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              
              {isWelfareLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-green-500" />
                  <span className="ml-2 text-gray-600">복지 정보 로딩 중...</span>
                </div>
              ) : welfareResults.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {welfareResults.map((welfare, index) => {
                      const content = welfare.service_content_detail || welfare.정책내용 || welfare.content || '';
                      const isLongContent = content.length > 300;
                      const displayContent = isLongContent ? content.substring(0, 300) + '...' : content;
                      const welfareUrl = welfare.url || 'https://www.bokjiro.go.kr';
                      
                      return (
                        <div key={welfare.id || index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h3 className="font-bold text-gray-800 text-lg mr-3">
                                  {welfare.policy_name || welfare.정책명 || welfare.name}
                                </h3>
                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                                  {welfare.policy_field || welfare.정책분야 || welfare.category || '복지'}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                {welfare.ministry || welfare.소관기관 || welfare.agency || '정부기관'}
                              </p>
                              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                {displayContent}
                              </p>
                              
                              {isLongContent && (
                                <button
                                  onClick={() => window.open(welfareUrl, '_blank')}
                                  className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                                >
                                  자세히 보기
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t pt-3 mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">지원대상:</span> {welfare.support_target || welfare.지원대상 || welfare.targetGroup || '해당자'}
                              </div>
                            </div>
                            {(welfare.application_period || welfare.신청기간 || welfare.applicationPeriod) && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">신청기간:</span> {welfare.application_period || welfare.신청기간 || welfare.applicationPeriod}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-gray-500">
                                정책 ID: {welfare.id || `policy-${index}`}
                              </div>
                              <button
                                onClick={() => window.open(welfareUrl, '_blank')}
                                className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100 transition-colors"
                              >
                                복지로 바로가기
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 페이징 */}
                  {totalWelfareCount > itemsPerPage && (
                    <div className="flex items-center justify-center space-x-2 pt-6">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {/* 페이지 번호들 */}
                      {(() => {
                        const totalPages = Math.ceil(totalWelfareCount / itemsPerPage);
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }
                        
                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }
                        
                        return pages.map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === page
                                ? 'bg-green-500 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ));
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalWelfareCount / itemsPerPage)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  )}
                  
                  {/* 페이지 정보 */}
                  <div className="text-center text-sm text-gray-500">
                    {totalWelfareCount > 0 && (
                      <span>
                        총 {totalWelfareCount}개 정책 중 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalWelfareCount)}번째 표시
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-600 font-medium mb-2">복지 정보를 불러오는 중입니다</h3>
                  <p className="text-gray-500 text-sm">잠시만 기다려주세요</p>
                  <button
                    onClick={() => loadAllWelfare(1)}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 맞춤추천 탭 */}
          {selectedTab === 'recommendation' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-xl mb-2">🎯 개인화 금융상품 추천</h3>
                <p className="text-purple-100">당신의 꿈과 목표에 맞는 최적의 금융상품을 AI가 추천해드립니다</p>
              </div>

              {!showRecommendationForm && recommendations.length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-gray-800 font-bold text-lg mb-2">맞춤 추천 받기</h3>
                  <p className="text-gray-600 mb-6">목표와 상황을 입력하고 개인화된 금융상품을 추천받아보세요</p>
                  <button
                    onClick={openRecommendationForm}
                    className="bg-purple-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
                  >
                    추천 받기 시작하기
                  </button>
                </div>
              )}

              {showRecommendationForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">개인 정보 입력</h3>
                    <button
                      onClick={() => setShowRecommendationForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        버킷리스트 목표 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recommendationData.bucketGoal}
                        onChange={(e) => setRecommendationData(prev => ({...prev, bucketGoal: e.target.value}))}
                        placeholder="예: 유럽 여행, 결혼 준비, 내 집 마련"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          목표 금액 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={recommendationData.targetAmount}
                          onChange={(e) => setRecommendationData(prev => ({...prev, targetAmount: e.target.value}))}
                          placeholder="1000000"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">달성 기간 (개월)</label>
                        <select
                          value={recommendationData.timeFrame}
                          onChange={(e) => setRecommendationData(prev => ({...prev, timeFrame: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="6">6개월</option>
                          <option value="12">1년</option>
                          <option value="24">2년</option>
                          <option value="36">3년</option>
                          <option value="60">5년</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">나이</label>
                        <input
                          type="number"
                          value={recommendationData.age}
                          onChange={(e) => setRecommendationData(prev => ({...prev, age: e.target.value}))}
                          placeholder="25"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">월 소득</label>
                        <input
                          type="number"
                          value={recommendationData.income}
                          onChange={(e) => setRecommendationData(prev => ({...prev, income: e.target.value}))}
                          placeholder="3000000"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">위험 성향</label>
                      <select
                        value={recommendationData.riskTolerance}
                        onChange={(e) => setRecommendationData(prev => ({...prev, riskTolerance: e.target.value}))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="conservative">안전 추구형 (원금 보장 선호)</option>
                        <option value="moderate">균형 추구형 (적절한 위험 감수)</option>
                        <option value="aggressive">성장 추구형 (높은 수익 추구)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRecommendationSubmit}
                      disabled={isLoadingRecommendations}
                      className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoadingRecommendations ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin mr-2" />
                          AI가 분석 중...
                        </>
                      ) : (
                        '맞춤 상품 추천받기'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">🎯 추천 결과</h3>
                    <button
                      onClick={openRecommendationForm}
                      className="text-purple-500 text-sm hover:text-purple-600"
                    >
                      다시 추천받기
                    </button>
                  </div>

                  {recommendations.map((product, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <h3 className="font-bold text-gray-800 text-lg mr-3">{product.name}</h3>
                            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                              적합도 {product.suitabilityScore}%
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{product.type}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{product.rate}%</div>
                          <div className="text-xs text-gray-500">연 금리</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium text-purple-600 mb-2">💡 AI 추천 이유</div>
                          <p className="leading-relaxed">{product.aiAnalysis}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-sm text-gray-600">월 저축액</div>
                          <div className="font-bold text-blue-600">{product.monthlyAmount?.toLocaleString()}원</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-sm text-gray-600">예상 수익</div>
                          <div className="font-bold text-green-600">+{product.projectedReturn?.interest?.toLocaleString()}원</div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div><span className="font-medium">대상:</span> {product.target}</div>
                        <div><span className="font-medium">기간:</span> {product.period}</div>
                        <div><span className="font-medium">특징:</span> {product.features}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 상품 상세 모달 */}
          {showProductDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">{showProductDetail.name}</h3>
                  <button
                    onClick={() => setShowProductDetail(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">상품유형:</span>
                    <p className="text-gray-600">{showProductDetail.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">가입대상:</span>
                    <p className="text-gray-600">{showProductDetail.target}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">가입경로:</span>
                    <p className="text-gray-600">{showProductDetail.channel || '해당 없음'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">계약기간:</span>
                    <p className="text-gray-600">{showProductDetail.period}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">저축금액:</span>
                    <p className="text-gray-600">{showProductDetail.amount}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">최고금리:</span>
                    <p className="text-blue-600 font-bold">{showProductDetail.rate}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">이자지급방식:</span>
                    <p className="text-gray-600">{showProductDetail.paymentType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">상품특징:</span>
                    <p className="text-gray-600">{showProductDetail.features}</p>
                  </div>
                  {showProductDetail.note && (
                    <div>
                      <span className="font-medium text-gray-700">비고:</span>
                      <p className="text-gray-600 text-sm">{showProductDetail.note}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowProductDetail(null)}
                  className="w-full mt-6 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {[
            { icon: Home, label: '홈', screen: 'dashboard' },
            { icon: Target, label: '버킷리스트', screen: 'bucket' },
            { icon: Bot, label: '세법도우미', screen: 'chatbot' },
            { icon: Gift, label: '상품&복지', screen: 'recommend' }
          ].map(({ icon: Icon, label, screen }) => (
            <button
              key={screen}
              onClick={() => setCurrentScreen(screen)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                currentScreen === screen 
                  ? 'text-yellow-600 bg-yellow-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative font-sans">
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'bucket' && <BucketScreen />}
      {currentScreen === 'chatbot' && <ChatbotScreen />}
      {currentScreen === 'recommend' && <RecommendScreen />}
      
      {currentScreen !== 'onboarding' && <BottomNav />}
    </div>
  );
};

export default App;