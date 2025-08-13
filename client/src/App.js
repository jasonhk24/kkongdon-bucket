import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, MessageCircle, CreditCard, Home, List, Bot, Gift, Settings, Target, TrendingUp, Calendar, Bell, Send, Loader, Search, Filter, X } from 'lucide-react';
import { bucketAPI, financeAPI, chatbotAPI, welfareAPI } from './services/api';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [bucketList, setBucketList] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const bucketInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const [bucketLists, setBucketLists] = useState([]);
  const [savedAmount, setSavedAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [financeProducts, setFinanceProducts] = useState([]);
  const [taxTips, setTaxTips] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [faqData, setFaqData] = useState([]);
  const chatInputRef = useRef(null);
  
  // 복지 정보 검색 관련 상태
  const welfareSearchRef = useRef(null);
  const [welfareResults, setWelfareResults] = useState([]);
  const [welfareCategories, setWelfareCategories] = useState([]);
  const [selectedWelfareCategory, setSelectedWelfareCategory] = useState('');
  const [isWelfareLoading, setIsWelfareLoading] = useState(false);
  const [showWelfareDetail, setShowWelfareDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalWelfareCount, setTotalWelfareCount] = useState(0);
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'popular'
  const [recommendedWelfareData, setRecommendedWelfareData] = useState([]);
  
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

  // 데이터 로드
  useEffect(() => {
    if (currentScreen !== 'onboarding') {
      loadData();
    }
  }, [currentScreen]);

  // 초기 데이터 설정 (fallback)
  useEffect(() => {
    // 복지정보 초기 데이터 설정
    if (recommendedWelfareData.length === 0) {
      setRecommendedWelfareData([
        {
          id: 'youth-leap-account',
          name: '청년도약계좌',
          agency: '기획재정부',
          category: '청년지원',
          content: '만 19~34세 청년이 5년간 매월 70만원 한도 내에서 자유롭게 납입하면 정부가 기여금을 지원하는 중장기 자산형성 지원 제도입니다.',
          targetGroup: '만 19~34세 청년',
          url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004090'
        },
        {
          id: 'youth-tomorrow-savings',
          name: '청년내일저축계좌',
          agency: '보건복지부',
          category: '자산형성지원',
          content: '일하는 생계급여 수급자(청년)의 자립자금 마련을 위해 본인 저축액과 동일한 금액을 정부가 매칭 지원하는 사업입니다.',
          targetGroup: '만 15~39세 생계급여 수급 청년',
          url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00003969'
        },
        {
          id: 'housing-subscription',
          name: '주택청약종합저축',
          agency: '국토교통부',
          category: '주거지원',
          content: '주택 구입을 위한 청약 자격을 얻기 위해 가입하는 저축으로, 소득공제 혜택도 제공됩니다.',
          targetGroup: '만 19세 이상 무주택자',
          url: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00003456'
        }
      ]);
    }

    // 금융상품 초기 데이터 설정
    if (financeProducts.length === 0) {
      setFinanceProducts([
        {
          id: 'kb-star-banking-original',
          bank: 'KB국민은행',
          name: 'KB Star Banking 정기예금',
          expectedSavings: 480000,
          description: '안정적인 예금상품\n연 최대 3.2% 금리\n1년~3년 선택 가능',
          isRecommended: true
        },
        {
          id: 'kb-youth-dream',
          bank: 'KB국민은행',
          name: 'KB 청년꿈적금',
          expectedSavings: 720000,
          description: '청년 전용 적금\n연 최대 4.5% 금리\n12~36개월 자유선택',
          isRecommended: true
        }
      ]);
    }

    // 복지 카테고리 초기 설정
    if (welfareCategories.length === 0) {
      setWelfareCategories(['주거지원', '출산·보육', '의료지원', '고용지원', '창업지원', '청년지원', '자산형성지원']);
    }

    // FAQ 초기 설정
    if (faqData.length === 0) {
      setFaqData([
        {
          id: 1,
          question: "청년도약계좌 가입 조건이 무엇인가요?",
          answer: "만 19~34세 청년이면 가입 가능하며, 소득 요건은 개인소득 6000만원 이하입니다."
        },
        {
          id: 2,
          question: "월세 세액공제는 어떻게 받나요?",
          answer: "무주택 세대주로서 국민주택규모 주택을 임차하면 연간 750만원 한도로 12% 세액공제를 받을 수 있습니다."
        },
        {
          id: 3,
          question: "청년내일저축계좌는 누가 가입할 수 있나요?",
          answer: "만 15~39세 생계급여 수급 청년 중 근로·사업소득이 있는 분이 가입 가능합니다."
        },
        {
          id: 4,
          question: "주택청약종합저축의 소득공제 한도는?",
          answer: "연간 납입액 240만원 한도로 40% 소득공제를 받을 수 있습니다."
        }
      ]);
    }

    // 절세 팁 초기 설정
    if (taxTips.length === 0) {
      setTaxTips([
        {
          id: 1,
          title: "월세 세액공제 신청하기",
          content: "무주택자라면 월세의 12%를 세액공제 받을 수 있어요!",
          category: "hot"
        },
        {
          id: 2,
          title: "연말정산 서류 준비",
          content: "12월까지 소득공제 항목을 점검하고 서류를 준비하세요.",
          category: "deadline"
        },
        {
          id: 3,
          title: "청년도약계좌 가입",
          content: "정부기여금을 받으며 목돈을 만들 수 있는 기회예요.",
          category: "hot"
        }
      ]);
    }

    // 복지 검색 결과 초기 설정
    if (welfareResults.length === 0) {
      const initialData = [
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
      setWelfareResults(initialData.slice(0, itemsPerPage));
      setTotalWelfareCount(initialData.length);
    }
  }, []);

  const loadData = async () => {
    // 이제 초기 데이터 설정에서 모든 것을 처리하므로 이 함수는 단순화
    console.log('데이터 로딩 중...');
    // 필요시 서버 API 호출 로직이 여기에 들어갈 예정
  };

  const handleOnboardingComplete = async () => {
    const bucketValue = bucketInputRef.current?.value?.trim();
    const amountValueRaw = amountInputRef.current?.value?.trim();
    // 콤마 제거하고 숫자로 변환
    const amountValue = amountValueRaw ? parseInt(amountValueRaw.replace(/[^0-9]/g, '')) : 0;
    
    console.log('입력값 확인:', { bucketValue, amountValue });
    
    if (bucketValue && amountValue > 0) {
      try {
        const newBucket = {
          name: bucketValue,
          target: amountValue,
          deadline: '2024-12-31'
        };

        const response = await bucketAPI.create(newBucket);
        if (response.success) {
          setBucketLists([response.data]);
          setSavedAmount(350000);
          setMonthlyAmount(85000);
          setCurrentScreen('dashboard');
        }
      } catch (error) {
        console.error('버킷리스트 생성 오류:', error);
        // 오류가 발생해도 화면 전환 (데모용)
        setBucketLists([{
          id: 1,
          name: bucketValue,
          target: amountValue,
          saved: 0,
          deadline: '2024-12-31',
          progress: 0
        }]);
        setSavedAmount(350000);
        setMonthlyAmount(85000);
        setCurrentScreen('dashboard');
      }
    } else {
      alert('버킷리스트와 목표 금액을 모두 입력해주세요!');
    }
  };

  const sendChatMessage = async () => {
    const currentInput = chatInputRef.current?.value?.trim();
    if (!currentInput || isLoading) return;

    const userMessage = currentInput;
    chatInputRef.current.value = ''; // 입력창 비우기 (리렌더링 없이)
    
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

  // 복지 정보 검색 함수 (간단 버전)
  const searchWelfare = async (query, page = currentPage) => {
    // 검색어가 없으면 전체 데이터 로드
    const searchQuery = query || welfareSearchRef.current?.value?.trim() || '';
    
    if (!searchQuery) {
      await loadAllWelfare(page);
      return;
    }

    setIsWelfareLoading(true);
    
    // 간단한 더미 데이터 검색
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
    if (selectedWelfareCategory) {
      filtered = filtered.filter(item => item.category === selectedWelfareCategory);
    }

    // 페이지네이션
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    setWelfareResults(filtered.slice(start, end));
    setTotalWelfareCount(filtered.length);
    setCurrentPage(page);
    setIsWelfareLoading(false);
  };

  // 전체 복지 정보 로드 (간단 버전)
  const loadAllWelfare = async (page = currentPage) => {
    setIsWelfareLoading(true);
    
    // 단순한 전체 데이터
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

    // 카테고리 필터링
    let filtered = allData;
    if (selectedWelfareCategory) {
      filtered = allData.filter(item => item.category === selectedWelfareCategory);
    }

    // 정렬
    if (sortBy === 'popular') {
      filtered = [...filtered].reverse();
    }

    // 페이지네이션
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    setWelfareResults(filtered.slice(start, end));
    setTotalWelfareCount(filtered.length);
    setCurrentPage(page);
    setIsWelfareLoading(false);
  };

  // 페이지 변경 함수
  const handlePageChange = async (page) => {
    const currentQuery = welfareSearchRef.current?.value?.trim();
    if (currentQuery) {
      await searchWelfare(currentQuery, page);
    } else {
      await loadAllWelfare(page);
    }
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalWelfareCount / itemsPerPage);

  // 복지 정보 상세 조회
  const getWelfareDetail = async (id) => {
    try {
      const response = await welfareAPI.getById(id);
      if (response.success) {
        setShowWelfareDetail(response.data);
      }
    } catch (error) {
      console.error('복지 정보 상세 조회 오류:', error);
    }
  };

  // 카테고리, 정렬, 개수 변경 시 검색 재실행
  useEffect(() => {
    if (currentScreen === 'recommend') {
      setCurrentPage(1);
      const currentQuery = welfareSearchRef.current?.value?.trim();
      if (currentQuery) {
        searchWelfare(currentQuery, 1);
      } else {
        loadAllWelfare(1);
      }
    }
  }, [selectedWelfareCategory, sortBy, itemsPerPage]);

  // 추천상품 화면 진입 시 초기 데이터 로드
  useEffect(() => {
    if (currentScreen === 'recommend' && welfareResults.length === 0) {
      loadAllWelfare();
    }
  }, [currentScreen]);

  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
      <div className="max-w-md mx-auto pt-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">꽁돈버킷</h1>
          <p className="text-gray-600">절세로 모은 꽁돈으로<br />버킷리스트를 이뤄보세요</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-3">
              어떤 버킷리스트를 이루고 싶나요? 💫
            </label>
            <textarea
              ref={bucketInputRef}
              defaultValue=""
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
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                defaultValue=""
                onInput={(e) => {
                  // 숫자만 추출
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  // 천단위 콤마 추가
                  const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 pt-12 pb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-white text-lg font-medium opacity-90">나의 꿈</h2>
            <h1 className="text-white text-2xl font-bold">{bucketLists[0]?.name || '버킷리스트'}</h1>
          </div>
          <Bell className="w-6 h-6 text-white opacity-80" />
        </div>
        
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

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">오늘의 절세 미션 🎯</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">마감 임박</span>
          </div>
          <div className="space-y-3">
            {taxTips.slice(0, 2).map((tip, index) => (
              <div key={tip.id || index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800">{tip.title}</div>
                  <div className="text-sm text-gray-600">{tip.content}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

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
          <button 
            onClick={() => setCurrentScreen('onboarding')}
            className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all"
          >
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
                    {Math.round(((item.saved || displaySaved) / item.target) * 100)}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(((item.saved || displaySaved) / item.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {item.deadline}까지
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {(item.saved || displaySaved).toLocaleString()}원 모음
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
            <button 
              onClick={() => setCurrentScreen('onboarding')}
              className="bg-white text-blue-600 font-medium px-6 py-3 rounded-xl hover:shadow-md transition-all"
            >
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
        
        {taxTips.length > 0 && (
          <div className="mb-6 space-y-3">
            {taxTips.filter(tip => tip.category === 'hot').slice(0, 1).map((tip) => (
              <div key={tip.id} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border-l-4 border-red-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-red-600 text-sm font-medium mb-1">🔥 HOT</div>
                    <h3 className="font-bold text-gray-800 mb-1">{tip.title}</h3>
                    <p className="text-gray-600 text-sm">{tip.content}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                </div>
              </div>
            ))}
            
            {taxTips.filter(tip => tip.category === 'deadline').slice(0, 1).map((tip) => (
              <div key={tip.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-l-4 border-blue-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">📅 마감임박</div>
                    <h3 className="font-bold text-gray-800 mb-1">{tip.title}</h3>
                    <p className="text-gray-600 text-sm">{tip.content}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

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
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.length === 0 && (
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs">
                  <p className="text-gray-800 text-sm">안녕하세요! 절세 관련 궁금한 것이 있으시면 언제든 물어보세요 😊</p>
                </div>
              )}
              
              {chatMessages.map((message, index) => (
                <div key={index} className={`${message.role === 'user' ? 'ml-auto' : ''} max-w-xs`}>
                  <div className={`rounded-2xl p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.relevantInfo && message.relevantInfo.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      관련 정보: {message.relevantInfo.map(info => info.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs flex items-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">답변을 생성하고 있어요...</span>
                </div>
              )}
            </div>
            
            <div className="flex">
              <input
                ref={chatInputRef}
                type="text"
                defaultValue=""
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="궁금한 것을 물어보세요..."
                className="flex-1 p-3 border border-gray-200 rounded-xl rounded-r-none focus:outline-none focus:border-blue-400"
                disabled={isLoading}
              />
              <button 
                onClick={sendChatMessage}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 rounded-xl rounded-l-none hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-3">자주 묻는 질문</h3>
          <div className="grid grid-cols-1 gap-2">
            {faqData.slice(0, 4).map((faq) => (
              <button 
                key={faq.id} 
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

  const RecommendScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">맞춤 추천 및 복지정보</h1>
        <p className="text-gray-600 text-sm mb-8">절세 상품과 복지 정보를 찾아보세요</p>

        {/* 👤 회원님 맞춤 추천 (실제 복지정보) */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">👤 회원님 맞춤 추천</h3>
          <div className="space-y-4">
            {recommendedWelfareData.length > 0 ? (
              recommendedWelfareData.map((welfare, index) => {
                const colors = [
                  "from-green-400 to-emerald-500",
                  "from-purple-400 to-pink-500", 
                  "from-orange-400 to-red-500"
                ];
                return (
                  <div key={welfare.id || index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{welfare.name || welfare.title}</h4>
                        <p className="text-gray-600 text-sm">{welfare.agency || welfare.category}</p>
                      </div>
                      <div className={`bg-gradient-to-r ${colors[index % 3]} w-12 h-12 rounded-xl flex items-center justify-center`}>
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-1">혜택</div>
                      <div className="font-medium text-gray-800">
                        {welfare.content || welfare.description || '상세 내용을 확인하세요.'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {welfare.targetGroup || '자격 요건은 상세페이지 확인'}
                      </div>
                      <button 
                        onClick={() => welfare.url ? window.open(welfare.url, '_blank') : getWelfareDetail(welfare.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-md"
                      >
                        자세히 보기 →
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>맞춤 추천 정보를 불러오는 중입니다...</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔥 인기 상품 */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">🔥 인기 상품</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[
              {
                id: 'kb-star-banking',
                bank: 'KB국민은행',
                name: 'KB Star Banking 적금',
                expectedSavings: 720000,
                description: '연 최대 4.2% 금리\n12개월 이상 가입시 우대금리 제공\n매월 10만원~100만원 자유적립',
                link: 'https://obank.kbstar.com'
              },
              {
                id: 'kb-dream-plus',
                bank: 'KB국민은행', 
                name: 'KB 꿈플러스 청년통장',
                expectedSavings: 960000,
                description: '청년 전용 적금상품\n연 최대 4.8% 금리\n정부 지원금 매칭',
                link: 'https://obank.kbstar.com'
              },
              {
                id: 'kb-dream-start',
                bank: 'KB국민은행',
                name: 'KB Dream Start 예금',
                expectedSavings: 540000,
                description: '신규 고객 우대금리\n연 3.6% 기본금리\n1000만원 이하 가입 가능',
                link: 'https://obank.kbstar.com'
              }
            ].concat(financeProducts.filter(product => product.isRecommended && product.bank?.includes('KB'))).map((product) => (
              <div key={product.id} className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 min-w-80 text-white shadow-lg flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">{product.bank}</div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                  </div>
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    추천
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm opacity-90 mb-1">예상 절세액</div>
                  <div className="text-2xl font-bold">연 {product.expectedSavings?.toLocaleString() || '0'}원</div>
                </div>
                <div className="text-sm opacity-90 mb-6 whitespace-pre-line">
                  {product.description}
                </div>
                <button 
                  onClick={() => window.open(product.link || 'https://obank.kbstar.com', '_blank')}
                  className="w-full bg-white text-yellow-600 font-medium py-3 rounded-xl hover:bg-opacity-90 transition-all"
                >
                  바로 신청하기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🔍 복지 정보 검색 섹션 (실제 데이터) */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800">🔍 복지 정보 검색</h3>
            {totalWelfareCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                총 {totalWelfareCount.toLocaleString()}개 정책 중 {((currentPage - 1) * itemsPerPage + 1)}~{Math.min(currentPage * itemsPerPage, totalWelfareCount)}개 표시 (페이지 {currentPage}/{totalPages})
              </p>
            )}
          </div>

          {/* 검색창 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex space-x-2 mb-3">
              <div className="flex-1 relative">
                <input
                  ref={welfareSearchRef}
                  type="text"
                  defaultValue=""
                  onKeyPress={(e) => e.key === 'Enter' && searchWelfare()}
                  placeholder="예: 청년 월세, 출산 지원, 노인 의료비..."
                  className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                />
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
              <button
                onClick={() => searchWelfare()}
                disabled={isWelfareLoading}
                className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                {isWelfareLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {/* 검색 옵션 */}
            <div className="flex flex-wrap gap-3 mb-3">
              {/* 표시 개수 선택 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">표시 개수:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                </select>
              </div>

              {/* 정렬 선택 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">정렬:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedWelfareCategory('')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  !selectedWelfareCategory 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {welfareCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedWelfareCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedWelfareCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 결과 */}
          <div className="space-y-3 mb-6">
            {isWelfareLoading ? (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-gray-600">복지 정보를 불러오는 중...</p>
              </div>
            ) : welfareResults.length > 0 ? (
              welfareResults.map((welfare, index) => (
                <div key={welfare.id || index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg mb-1">{welfare.name || welfare.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{welfare.agency || welfare.category}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                      {welfare.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                    {welfare.content || welfare.description || '상세 내용을 확인하세요.'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {welfare.applicationPeriod && `신청기간: ${welfare.applicationPeriod}`}
                    </div>
                    <button 
                      onClick={() => welfare.url ? window.open(welfare.url, '_blank') : getWelfareDetail(welfare.id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                    >
                      자세히 보기 →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">검색 결과가 없습니다.</p>
                <p className="text-gray-400 text-sm">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mb-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              
              {/* 페이지 번호들 */}
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>


        {/* 복지 정보 상세 모달 */}
        {showWelfareDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">복지 정보 상세</h3>
                <button 
                  onClick={() => setShowWelfareDetail(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-xl mb-2">
                    {showWelfareDetail.name || showWelfareDetail.title}
                  </h4>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm">
                      {showWelfareDetail.category}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {showWelfareDetail.agency}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {showWelfareDetail.content && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">📋 내용</h5>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {showWelfareDetail.content}
                      </p>
                    </div>
                  )}
                  
                  {showWelfareDetail.targetGroup && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">👥 지원대상</h5>
                      <p className="text-gray-700 text-sm">
                        {showWelfareDetail.targetGroup}
                      </p>
                    </div>
                  )}
                  
                  {showWelfareDetail.applicationPeriod && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">📅 신청기간</h5>
                      <p className="text-gray-700 text-sm">
                        {showWelfareDetail.applicationPeriod}
                      </p>
                    </div>
                  )}
                  
                  {showWelfareDetail.applicationMethod && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">📝 신청방법</h5>
                      <p className="text-gray-700 text-sm">
                        {showWelfareDetail.applicationMethod}
                      </p>
                    </div>
                  )}
                  
                  {showWelfareDetail.contact && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">📞 문의처</h5>
                      <p className="text-gray-700 text-sm">
                        {showWelfareDetail.contact}
                      </p>
                    </div>
                  )}
                  
                  {showWelfareDetail.url && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">🔗 관련 링크</h5>
                      <a 
                        href={showWelfareDetail.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        자세한 내용 보기 →
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowWelfareDetail(null)}
                    className="w-full bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {[
            { icon: Home, label: '홈', screen: 'dashboard' },
            { icon: Target, label: '버킷리스트', screen: 'bucket' },
            { icon: Bot, label: '세법도우미', screen: 'chatbot' },
            { icon: Gift, label: '추천상품', screen: 'recommend' }
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
