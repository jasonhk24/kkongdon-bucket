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

  const loadData = async () => {
    try {
      // 버킷리스트 데이터 로드
      const bucketsResponse = await bucketAPI.getAll();
      if (bucketsResponse.success) {
        setBucketLists(bucketsResponse.data);
      }

      // 절세 현황 로드
      const savingsResponse = await bucketAPI.getSavingsStatus();
      if (savingsResponse.success) {
        setSavedAmount(savingsResponse.data.total);
        setMonthlyAmount(savingsResponse.data.monthly);
      }

      // 금융상품 로드
      const productsResponse = await financeAPI.getProducts();
      if (productsResponse.success) {
        setFinanceProducts(productsResponse.data);
      }

      // 절세 팁 로드
      const tipsResponse = await financeAPI.getTips();
      if (tipsResponse.success) {
        setTaxTips(tipsResponse.data);
      }

      // FAQ 로드
      const faqResponse = await chatbotAPI.getFAQ();
      if (faqResponse.success) {
        setFaqData(faqResponse.data);
      }

      // 복지 카테고리 로드
      const categoriesResponse = await welfareAPI.getCategories();
      if (categoriesResponse.success) {
        setWelfareCategories(categoriesResponse.data);
      }

    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    const bucketValue = bucketInputRef.current?.value?.trim();
    const amountValue = amountInputRef.current?.value?.trim();
    
    console.log('입력값 확인:', { bucketValue, amountValue });
    
    if (bucketValue && amountValue) {
      try {
        const newBucket = {
          name: bucketValue,
          target: parseInt(amountValue) || 0,
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
          target: parseInt(amountValue) || 0,
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
      console.log('챗봇 API 호출 중...');
      const response = await chatbotAPI.sendMessage(userMessage, newMessages.slice(-5));
      console.log('챗봇 응답:', response);
      
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
      console.error('채팅 오류 상세:', error);
      
      // 네트워크 오류와 서버 오류 구분
      let errorMessage = '죄송합니다. 일시적인 오류가 발생했습니다.';
      
      if (error.message?.includes('서버에 연결할 수 없습니다')) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      }
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `${errorMessage}\n\n💡 대신 이런 질문들을 시도해보세요:\n• 월세 세액공제 받는 방법\n• 청년도약계좌 조건\n• 연말정산 준비 방법`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFAQClick = async (question) => {
    if (chatInputRef.current) {
      chatInputRef.current.value = question;
    }
    await sendChatMessage();
  };

  // 복지 정보 검색 함수
  const searchWelfare = async (query) => {
    // 매개변수가 없으면 ref에서 읽기
    const searchQuery = query || welfareSearchRef.current?.value?.trim() || '';
    
    if (!searchQuery) {
      // 빈 검색어면 전체 데이터 로드
      await loadAllWelfare();
      return;
    }

    setIsWelfareLoading(true);
    try {
      const params = {
        limit: 20
      };
      
      if (selectedWelfareCategory) {
        params.category = selectedWelfareCategory;
      }

      const response = await welfareAPI.search(searchQuery, params);
      if (response.success) {
        setWelfareResults(response.data.results);
      }
    } catch (error) {
      console.error('복지 정보 검색 오류:', error);
      setWelfareResults([]);
    } finally {
      setIsWelfareLoading(false);
    }
  };

  // 전체 복지 정보 로드
  const loadAllWelfare = async () => {
    setIsWelfareLoading(true);
    try {
      const params = {
        limit: 20
      };
      
      if (selectedWelfareCategory) {
        params.category = selectedWelfareCategory;
      }

      const response = await welfareAPI.getAll(params);
      if (response.success) {
        setWelfareResults(response.data.results);
      }
    } catch (error) {
      console.error('복지 정보 로드 오류:', error);
      setWelfareResults([]);
    } finally {
      setIsWelfareLoading(false);
    }
  };

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

  // 카테고리 변경 시 검색 재실행
  useEffect(() => {
    if (currentScreen === 'recommend') {
      if (welfareSearchRef.current?.value?.trim()) {
        searchWelfare();
      } else {
        loadAllWelfare();
      }
    }
  }, [selectedWelfareCategory]);

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
                  // 숫자만 유지하되 setState는 호출하지 않음
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
                placeholder="1000000"
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

        {/* 👤 회원님 맞춤 추천 (더미 데이터) */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">👤 회원님 맞춤 추천</h3>
          <div className="space-y-4">
            {[
              {
                id: 'youth-savings',
                title: "청년내일저축계좌",
                subtitle: "기초생활수급자 대상",
                benefit: "매월 10만원 적립 시 정부 30만원 매칭",
                condition: "만 15~39세 기초생활수급자",
                color: "from-green-400 to-emerald-500"
              },
              {
                id: 'housing-savings',
                title: "주택청약종합저축",
                subtitle: "내 집 마련 준비",
                benefit: "연간 최대 240만원 소득공제",
                condition: "만 19세 이상 무주택자",
                color: "from-purple-400 to-pink-500"
              },
              {
                id: 'pension-savings',
                title: "개인연금저축",
                subtitle: "노후 준비",
                benefit: "연간 최대 72만원 세액공제",
                condition: "연 400만원 이하 납입",
                color: "from-orange-400 to-red-500"
              }
            ].map((product) => (
              <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{product.title}</h4>
                    <p className="text-gray-600 text-sm">{product.subtitle}</p>
                  </div>
                  <div className={`bg-gradient-to-r ${product.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">혜택</div>
                  <div className="font-medium text-gray-800">{product.benefit}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">{product.condition}</div>
                  <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                    자세히 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 인기 상품 */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">🔥 인기 상품</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {financeProducts.filter(product => product.isRecommended).map((product) => (
              <div key={product.id} className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 min-w-80 text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">{product.bank}</div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                  </div>
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {product.isRecommended ? '추천' : 'NEW'}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm opacity-90 mb-1">예상 절세액</div>
                  <div className="text-2xl font-bold">연 {product.expectedSavings?.toLocaleString() || '0'}원</div>
                </div>
                <div className="text-sm opacity-90 mb-6">
                  {product.description}
                </div>
                <button className="w-full bg-white text-yellow-600 font-medium py-3 rounded-xl hover:bg-opacity-90 transition-all">
                  바로 신청하기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🔍 복지 정보 검색 섹션 (실제 데이터) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">🔍 복지 정보 검색</h3>
            <button 
              onClick={() => setSelectedWelfareCategory('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              전체보기
            </button>
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
                      {welfare.targetGroup && `대상: ${welfare.targetGroup}`}
                      {welfare.applicationPeriod && ` | 신청기간: ${welfare.applicationPeriod}`}
                    </div>
                    <button 
                      onClick={() => getWelfareDetail(welfare.id)}
                      className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      자세히 보기
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
        </div>
        
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4">🔥 인기 상품</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {financeProducts.filter(product => product.isRecommended).map((product) => (
              <div key={product.id} className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 min-w-80 text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">{product.bank}</div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                  </div>
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {product.isRecommended ? '추천' : 'NEW'}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm opacity-90 mb-1">예상 절세액</div>
                  <div className="text-2xl font-bold">연 {product.expectedSavings.toLocaleString()}원</div>
                </div>
                <div className="text-sm opacity-90 mb-6">
                  {product.description}
                </div>
                <button className="w-full bg-white text-yellow-600 font-medium py-3 rounded-xl hover:bg-opacity-90 transition-all">
                  바로 신청하기
                </button>
              </div>
            ))}
          </div>
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
