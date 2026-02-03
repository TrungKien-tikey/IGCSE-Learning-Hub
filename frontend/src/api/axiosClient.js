import axios from 'axios';

// 1. Tạo instance với path tương đối - sẽ đi qua Vite proxy -> Kong Gateway
// Không dùng port cố định để tận dụng proxy configuration
// 1. Lấy Base URL từ env. Nếu không có VITE_MAIN_API_URL, thử suy diễn từ các biến khác
let baseURL = import.meta.env.VITE_MAIN_API_URL;

if (!baseURL) {
  // Diagnostics
  console.log("🔍 AxiosClient: VITE_MAIN_API_URL is missing, attempting fallback...");
  console.log("   Candidates:", {
    VITE_AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL,
    VITE_USER_SERVICE_URL: import.meta.env.VITE_USER_SERVICE_URL,
    VITE_ADMIN_API_URL: import.meta.env.VITE_ADMIN_API_URL,
    VITE_PAYMENT_SERVICE_URL: import.meta.env.VITE_PAYMENT_SERVICE_URL
  });

  // Thử lấy từ các biến khác có thể đã được set trên Vercel
  const otherUrl = import.meta.env.VITE_AI_SERVICE_URL || 
                   import.meta.env.VITE_USER_SERVICE_URL ||
                   import.meta.env.VITE_ADMIN_API_URL ||
                   import.meta.env.VITE_PAYMENT_SERVICE_URL;
  
  if (otherUrl && otherUrl.includes('/api')) {
    baseURL = otherUrl.split('/api')[0];
    console.log("✅ Derived VITE_MAIN_API_URL from other services:", baseURL);
  } else {
    console.error("❌ CRITICAL: VITE_MAIN_API_URL is not set and cannot be derived! All API calls will fail on Vercel.");
  }
} else {
  console.log("🚀 AxiosClient initialized with baseURL:", baseURL);
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
        const result = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
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