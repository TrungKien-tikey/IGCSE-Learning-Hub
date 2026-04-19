import axios from 'axios';

const stripApiBase = (url = '') => {
  let normalized = url.trim();
  normalized = normalized.replace(/\/api\/v1\/?$/, '');
  normalized = normalized.replace(/\/api\/?$/, '');
  normalized = normalized.replace(/\/$/, '');
  return normalized;
};

let baseURL = stripApiBase(import.meta.env.VITE_MAIN_API_URL || '');

if (!baseURL) {
  const fallbackUrl = import.meta.env.VITE_AI_SERVICE_URL ||
    import.meta.env.VITE_USER_SERVICE_URL ||
    import.meta.env.VITE_ADMIN_API_URL ||
    '';
  baseURL = stripApiBase(fallbackUrl);
}

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const result = await axios.post(`${baseURL}/api/auth/refresh-token`, {
          refreshToken,
        });

        const { token } = result.data;
        localStorage.setItem('accessToken', token);

        axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Lỗi refresh token:', refreshError);
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
