import axios from 'axios';

// 1. Tạo instance với path tương đối - sẽ đi qua Vite proxy -> Kong Gateway
// Không dùng port cố định để tận dụng proxy configuration
// 1. Lấy Base URL từ env. Nếu không có VITE_MAIN_API_URL, thử suy diễn từ các biến khác
// 1. Lấy Base URL từ env
// Ưu tiên VITE_MAIN_API_URL. Nếu không có, fallback sang Ngrok URL đang dùng.
const HARDCODED_URL = 'https://aniya-scrumptious-lina.ngrok-free.dev';
let baseURL = import.meta.env.VITE_MAIN_API_URL;

if (!baseURL) {
  // Thử suy luận từ các biến khác nếu có
  const otherUrl = import.meta.env.VITE_AI_SERVICE_URL || 
                   import.meta.env.VITE_USER_SERVICE_URL || 
                   import.meta.env.VITE_ADMIN_API_URL;
                   
  if (otherUrl && otherUrl.includes('/api')) {
    baseURL = otherUrl.split('/api')[0];
  } else {
    // Fallback cuối cùng
    baseURL = HARDCODED_URL;
  }
  
  console.log("⚠️ AxiosClient: VITE_MAIN_API_URL missing using fallback:", baseURL);
}

// 🛡️ BẢO VỆ CHỐNG LẶP URL: Xóa đuôi /api/v1 nếu có
if (baseURL.endsWith('/api/v1')) {
  baseURL = baseURL.replace(/\/api\/v1\/?$/, '');
} else if (baseURL.endsWith('/api/v1/')) {
    baseURL = baseURL.replace(/\/api\/v1\/?$/, '');
}
// Xóa luôn đuôi /api nếu lỡ có (để thống nhất logic cộng chuỗi)
if (baseURL.endsWith('/api')) {
   baseURL = baseURL.replace(/\/api\/?$/, '');
}

const axiosClient = axios.create({
  baseURL: baseURL, 
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "69420",
  },
});

// 2. REQUEST INTERCEPTOR (Giữ nguyên)
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. RESPONSE INTERCEPTOR (Cần sửa đường dẫn gọi API Refresh)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi API Refresh Token qua Kong Gateway
        // ⚠️ Lưu ý: Dùng 'axios' gốc để gọi tránh lặp vô tận
        const result = await axios.post(`${baseURL}/api/auth/refresh-token`, {
          refreshToken: refreshToken
        });

        const { token } = result.data;

        localStorage.setItem('accessToken', token);

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        return axiosClient(originalRequest);

      } catch (refreshError) {
        console.error("Lỗi refresh token:", refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;