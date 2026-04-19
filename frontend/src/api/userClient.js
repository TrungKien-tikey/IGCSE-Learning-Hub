import axios from 'axios';

const normalizeBaseUrl = (url = '') => {
  let normalized = url.trim();
  normalized = normalized.replace(/\/api\/v1\/?$/, '');
  normalized = normalized.replace(/\/$/, '');
  return normalized;
};

const ensureUserApiBase = (url = '') => {
  const normalized = normalizeBaseUrl(url);
  if (!normalized) {
    return '/api/users';
  }
  if (normalized.endsWith('/api/users') || normalized.endsWith('/users')) {
    return normalized;
  }
  if (normalized.endsWith('/api')) {
    return `${normalized}/users`;
  }
  return `${normalized}/api/users`;
};

let baseURL = import.meta.env.VITE_USER_SERVICE_URL;

if (!baseURL) {
  baseURL = import.meta.env.VITE_MAIN_API_URL ||
    import.meta.env.VITE_AI_SERVICE_URL ||
    import.meta.env.VITE_ADMIN_API_URL ||
    '';
}

const userClient = axios.create({
  baseURL: ensureUserApiBase(baseURL),
  headers: {
    'Content-Type': 'application/json',
  },
});

userClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

userClient.interceptors.response.use(
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

        const mainApiUrl = normalizeBaseUrl(import.meta.env.VITE_MAIN_API_URL || '');
        const result = await axios.post(`${mainApiUrl}/api/auth/refresh-token`, {
          refreshToken,
        });

        const { token } = result.data;
        localStorage.setItem('accessToken', token);

        userClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return userClient(originalRequest);
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

export default userClient;
