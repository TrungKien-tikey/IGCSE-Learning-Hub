import axios from 'axios';

/**
 * Exam Service API client
 * Dùng cho các API của exam-service (/api/exams/*)
 */
const examClient = axios.create({
    baseURL: import.meta.env.VITE_EXAM_SERVICE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
    },
});

// REQUEST INTERCEPTOR - Tự động gắn token
examClient.interceptors.request.use(
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

// RESPONSE INTERCEPTOR - Xử lý lỗi 401
examClient.interceptors.response.use(
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

                const result = await axios.post('/api/v1/auth/refresh-token', {
                    refreshToken: refreshToken
                });

                const { token } = result.data;
                localStorage.setItem('accessToken', token);
                examClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                originalRequest.headers['Authorization'] = `Bearer ${token}`;

                return examClient(originalRequest);

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

export default examClient;
