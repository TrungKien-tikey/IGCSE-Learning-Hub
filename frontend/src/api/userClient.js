import axios from 'axios';

const HARDCODED_URL = 'https://aniya-scrumptious-lina.ngrok-free.dev';
let baseURL = import.meta.env.VITE_USER_SERVICE_URL;

if (!baseURL) {
  const otherUrl = import.meta.env.VITE_MAIN_API_URL ||
                   import.meta.env.VITE_AI_SERVICE_URL || 
                   import.meta.env.VITE_ADMIN_API_URL;
                   
  if (otherUrl && otherUrl.includes('/api')) {
    const base = otherUrl.split('/api')[0];
    baseURL = `${base}/api/users`;
  } else {
    baseURL = `${HARDCODED_URL}/api/users`;
  }
  
  console.log("⚠️ UserClient: VITE_USER_SERVICE_URL missing using fallback:", baseURL);
}

if (baseURL.endsWith('/api/v1')) {
  baseURL = baseURL.replace(/\/api\/v1\/?$/, '');
} else if (baseURL.endsWith('/api/v1/')) {
  baseURL = baseURL.replace(/\/api\/v1\/?$/, '');
}

if (baseURL.endsWith('/api')) {
  baseURL = baseURL.replace(/\/api\/?$/, '');
}

const userClient = axios.create({
  baseURL: baseURL.endsWith('/users') ? baseURL : `${baseURL}/api/users`,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

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

userClient.interceptors.response.use(
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

        const mainApiUrl = import.meta.env.VITE_MAIN_API_URL || HARDCODED_URL;
        const result = await axios.post(`${mainApiUrl}/api/auth/refresh-token`, {
          refreshToken: refreshToken
        });

        const { token } = result.data;
        localStorage.setItem('accessToken', token);

        userClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        return userClient(originalRequest);

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

export default userClient;
