import axiosClient from '../api/axiosClient';

const authService = {
  // 1. Đăng ký
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  // 2. Đăng nhập
  login: async (data) => {
    const response = await axiosClient.post('/auth/login', data);
    
    // Lưu Token
    if (response.data.token) {
        localStorage.setItem('accessToken', response.data.token);
        
        if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        if (response.data.role) {
            localStorage.setItem('role', response.data.role);
        }
    }
    
    return response;
  },

  // 👇 3. [QUAN TRỌNG] THÊM HÀM NÀY VÀO ĐÂY
  checkEmail: (email) => {
    // URL thực tế: /api/v1/auth/check-email
    // Gửi body dạng JSON: { "email": "..." }
    return axiosClient.post('/auth/check-email', { email });
  },

  // 4. Đăng xuất
  logout: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        axiosClient.post('/auth/logout', { token }).catch(() => {});
    }
    localStorage.clear();
  }
};

export default authService;