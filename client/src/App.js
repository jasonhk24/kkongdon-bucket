import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, MessageCircle, CreditCard, Home, List, Bot, Gift, Settings, Target, TrendingUp, Calendar, Bell, Send, Loader } from 'lucide-react';
import { bucketAPI, financeAPI, chatbotAPI } from './services/api';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [bucketList, setBucketList] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [bucketLists, setBucketLists] = useState([]);
  const [savedAmount, setSavedAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [financeProducts, setFinanceProducts] = useState([]);
  const [taxTips, setTaxTips] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faqData, setFaqData] = useState([]);
  
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

    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    if (bucketList && targetAmount) {
      try {
        const newBucket = {
          name: bucketList,
          target: parseInt(targetAmount) || 0,
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
          name: bucketList,
          target: parseInt(targetAmount) || 0,
          saved: 0,
          deadline: '2024-12-31',
          progress: 0
        }]);
        setSavedAmount(350000);
        setMonthlyAmount(85000);
        setCurrentScreen('dashboard');
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
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
      
      if (response.success) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message,
          relevantInfo: response.data.relevantInfo,
          timestamp: response.data.timestamp
        }]);
      } else {
        throw new Error('응답 실패');
      }
    } catch (error) {
      console.error('채팅 오류:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFAQClick = async (question) => {
    setChatInput(question);
    await sendChatMessage();
  };

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
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
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
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="궁금한 것을 물어보세요..."
                className="flex-1 p-3 border border-gray-200 rounded-xl rounded-r-none focus:outline-none focus:border-blue-400"
                disabled={isLoading}
              />
              <button 
                onClick={sendChatMessage}
                disabled={isLoading || !chatInput.trim()}
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">맞춤 금융상품</h1>
        <p className="text-gray-600 text-sm mb-8">회원님을 위한 절세 상품을 추천드려요</p>
        
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

        <div className="space-y-4">
          <h3 className="font-bold text-gray-800">👤 회원님 맞춤 추천</h3>
          
          {financeProducts.filter(product => !product.isRecommended).map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{product.name}</h4>
                  <p className="text-gray-600 text-sm">{product.bank}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-600 mb-1">혜택</div>
                <div className="font-medium text-gray-800">{product.description}</div>
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
