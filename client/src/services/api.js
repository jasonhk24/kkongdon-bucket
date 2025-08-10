import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://kkongdon-bucket-api.railway.app/api';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 배포 환경에서는 더 긴 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API 응답 오류:', error);
    
    // 네트워크 오류 처리
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return Promise.reject({ 
        success: false, 
        error: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' 
      });
    }
    
    if (error.response) {
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject({ success: false, error: '서버에 연결할 수 없습니다.' });
    } else {
      return Promise.reject({ success: false, error: '요청 처리 중 오류가 발생했습니다.' });
    }
  }
);

// Health check 함수
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  } catch (error) {
    console.error('Health check 실패:', error);
    return { status: 'ERROR', error: error.message };
  }
};

// Bucket API
export const bucketAPI = {
  // 모든 버킷리스트 조회
  getAll: () => api.get('/bucket'),
  
  // 새 버킷리스트 추가
  create: (bucketData) => api.post('/bucket', bucketData),
  
  // 버킷리스트 수정
  update: (id, bucketData) => api.put(`/bucket/${id}`, bucketData),
  
  // 버킷리스트 삭제
  delete: (id) => api.delete(`/bucket/${id}`),
  
  // 절세 현황 조회
  getSavingsStatus: () => api.get('/bucket/savings/status'),
  
  // 진행도 조회
  getProgress: () => api.get('/bucket/progress'),
};

// Finance API
export const financeAPI = {
  // 금융상품 조회
  getProducts: (params = {}) => api.get('/finance/products', { params }),
  
  // 추천 상품 조회
  getRecommended: () => api.get('/finance/products/recommended'),
  
  // 절세 팁 조회
  getTips: (category) => api.get('/finance/tips', { params: { category } }),
  
  // 맞춤 추천
  getPersonalizedRecommendations: (userData) => api.post('/finance/recommend', userData),
  
  // 상품 비교
  compareProducts: (productIds) => api.post('/finance/compare', { productIds }),
  
  // 절세 계산
  calculateTax: (taxData) => api.post('/finance/calculator', taxData),
};

// Welfare API
export const welfareAPI = {
  // 복지 정보 검색
  search: (query, params = {}) => api.get('/welfare/search', { params: { q: query, ...params } }),
  
  // 모든 복지 정보 조회
  getAll: (params = {}) => api.get('/welfare/all', { params }),
  
  // 특정 복지 정보 상세 조회
  getById: (id) => api.get(`/welfare/${id}`),
  
  // 카테고리 목록 조회
  getCategories: () => api.get('/welfare/meta/categories'),
};

// Chatbot API
export const chatbotAPI = {
  // 채팅 메시지 전송
  sendMessage: (message, context = []) => api.post('/chatbot/chat', { message, context }),
  
  // 빠른 응답 조회
  getQuickResponse: (category) => api.get(`/chatbot/quick-response/${category}`),
  
  // 자주 묻는 질문 조회
  getFAQ: () => api.get('/chatbot/faq'),
};

export default api;