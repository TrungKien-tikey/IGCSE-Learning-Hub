import axios from 'axios';

// 1. [SỬA LẠI] Dùng đường dẫn tương đối để đi qua Proxy/Gateway
const axiosClient = axios.create({
  baseURL: '/api/v1', 
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

        // [QUAN TRỌNG] Sửa lại đường dẫn gọi API Refresh Token
        // Bỏ 'http://localhost:8080' đi, dùng đường dẫn tương đối giống baseURL
        // Vì baseURL là '/api/v1' -> API login là '/auth/login'
        // Nên API refresh sẽ là '/api/v1/auth/refresh-token'
        const result = await axios.post('/api/v1/auth/refresh-token', { 
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