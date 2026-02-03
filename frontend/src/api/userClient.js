import axios from 'axios';

/**
 * User Service API client
 * Dùng cho các API của user-service (/api/users/*)
 */
const userClient = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// REQUEST INTERCEPTOR (Gửi đi) - Tự động gắn token
userClient.interceptors.request.use(
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

// RESPONSE INTERCEPTOR (Nhận về) - Xử lý lỗi 401
userClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) VÀ chưa từng thử lại request này
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi API Refresh Token
        const result = await axios.post(`${import.meta.env.VITE_MAIN_API_URL}/api/auth/refresh-token`, {
          refreshToken: refreshToken
        });

        const { token } = result.data; 

        // Lưu Token mới
        localStorage.setItem('accessToken', token);

        // Gắn Token mới vào Header request cũ
        userClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        // Gọi lại request ban đầu
        return userClient(originalRequest);

      } catch (refreshError) {
        console.error("Phiên đăng nhập hết hạn:", refreshError);
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

export default userClient;
