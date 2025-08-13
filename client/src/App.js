import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, MessageCircle, CreditCard, Home, List, Bot, Gift, Settings, Target, TrendingUp, Calendar, Bell, Send, Loader, Search, Filter, X } from 'lucide-react';
import { bucketAPI, financeAPI, chatbotAPI, welfareAPI } from './services/api';

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
  
  // 복지 정보 관련 상태
  const [welfareResults, setWelfareResults] = useState([]);
  const [welfareCategories, setWelfareCategories] = useState([]);
  const [selectedWelfareCategory, setSelectedWelfareCategory] = useState('all');
  const [isWelfareLoading, setIsWelfareLoading] = useState(false);
  const [showWelfareDetail, setShowWelfareDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalWelfareCount, setTotalWelfareCount] = useState(0);
  const welfareSearchRef = useRef(null);

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

      // 복지 카테고리 설정
      setWelfareCategories([
        { id: 'all', name: '전체', count: 5000 },
        { id: 'youth', name: '청년지원', count: 850 },
        { id: 'housing', name: '주거지원', count: 320 },
        { id: 'job', name: '취업지원', count: 420 },
        { id: 'education', name: '교육지원', count: 380 },
        { id: 'finance', name: '금융지원', count: 290 }
      ]);

      // 초기 복지 검색 결과 로드
      loadAllWelfare();
      
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

  // 복지 정보 검색 함수
  const searchWelfare = async (query, page = currentPage) => {
    const searchQuery = query || welfareSearchRef.current?.value?.trim() || '';
    
    if (!searchQuery) {
      await loadAllWelfare(page);
      return;
    }

    setIsWelfareLoading(true);

    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await welfareAPI.search(searchQuery, {
        limit: itemsPerPage,
        offset: offset,
        category: selectedWelfareCategory !== 'all' ? selectedWelfareCategory : undefined
      });

      if (response?.success && response.data) {
        setWelfareResults(response.data.results || []);
        setTotalWelfareCount(response.data.total || 0);
        setCurrentPage(page);
      } else {
        throw new Error('검색 결과 없음');
      }
    } catch (error) {
      console.error('복지 검색 오류:', error);
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
    if (bucketList && targetAmount) {
      setBucketLists([{ 
        id: 1, 
        name: bucketList, 
        target: parseInt(targetAmount), 
        saved: 0,
        deadline: '2024-12-31'
      }]);
      setSavedAmount(350000);
      setMonthlyAmount(85000);
      setCurrentScreen('dashboard');
    }
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
              value={bucketList}
              onChange={(e) => setBucketList(e.target.value)}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={targetAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 12) {
                    setTargetAmount(value);
                  }
                }}
                placeholder="1000000"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400 text-gray-800 pr-12"
              />
              <span className="absolute right-4 top-4 text-gray-500">원</span>
            </div>
          </div>

          <button
            onClick={handleOnboardingComplete}
            disabled={!bucketList || !targetAmount}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium py-4 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
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
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
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

  const RecommendScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-16 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">복지정보 찾기</h1>
            <p className="text-gray-600 text-sm">나에게 맞는 복지혜택을 찾아보세요</p>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                ref={welfareSearchRef}
                type="text"
                placeholder="복지정책을 검색해보세요 (예: 청년, 월세, 의료비)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                onKeyPress={(e) => e.key === 'Enter' && searchWelfare()}
              />
            </div>
            <button
              onClick={() => searchWelfare()}
              disabled={isWelfareLoading}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isWelfareLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {welfareCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedWelfareCategory(category.id);
                  setCurrentPage(1);
                  const searchQuery = welfareSearchRef.current?.value?.trim();
                  if (searchQuery) {
                    searchWelfare(searchQuery, 1);
                  } else {
                    loadAllWelfare(1);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedWelfareCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.name} ({category.count || 0})
              </button>
            ))}
          </div>
        </div>

        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            총 {totalWelfareCount}개의 복지정책 (페이지 {currentPage})
          </div>
        </div>

        {/* 복지정보 목록 */}
        <div className="space-y-4 mb-6">
          {isWelfareLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">검색 중...</span>
            </div>
          ) : welfareResults.length > 0 ? (
            welfareResults.map((welfare) => (
              <div key={welfare.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-bold text-gray-800 text-lg mr-3">{welfare.name}</h3>
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        {welfare.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{welfare.agency}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{welfare.content}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-4 mt-2" />
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">대상:</span> {welfare.targetGroup}
                    </div>
                    <button
                      onClick={() => getWelfareDetail(welfare)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      자세히 보기
                    </button>
                  </div>
                  {welfare.applicationPeriod && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">신청기간:</span> {welfare.applicationPeriod}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-600 font-medium mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 text-sm">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalWelfareCount > itemsPerPage && (
          <div className="flex justify-center space-x-2">
            {Array.from({ length: Math.ceil(totalWelfareCount / itemsPerPage) }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), currentPage + 2)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
          </div>
        )}

        {/* 복지정보 상세 모달 */}
        {showWelfareDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">{showWelfareDetail.name}</h3>
                <button
                  onClick={() => setShowWelfareDetail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">담당기관:</span>
                  <p className="text-gray-600">{showWelfareDetail.agency}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">내용:</span>
                  <p className="text-gray-600">{showWelfareDetail.content}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">대상:</span>
                  <p className="text-gray-600">{showWelfareDetail.targetGroup}</p>
                </div>
                {showWelfareDetail.applicationPeriod && (
                  <div>
                    <span className="font-medium text-gray-700">신청기간:</span>
                    <p className="text-gray-600">{showWelfareDetail.applicationPeriod}</p>
                  </div>
                )}
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
            { icon: Gift, label: '복지정보', screen: 'recommend' }
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