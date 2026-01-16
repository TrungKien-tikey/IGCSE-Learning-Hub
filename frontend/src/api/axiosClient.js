import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1', // <--- Trả về /api/v1 theo yêu cầu của user
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động chèn token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;