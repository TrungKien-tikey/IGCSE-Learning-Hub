import axiosClient from '../api/axiosClient';

const authService = {
  // 1. Đăng ký
  register: (data) => {
    return axiosClient.post('/api/auth/register', data);
  },

  // 2. Đăng nhập
  login: async (data) => {
    const response = await axiosClient.post('/api/auth/login', data);
    
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

  checkEmail: (email) => {
    // URL thực tế: /api/auth/check-email
    // Gửi body dạng JSON: { "email": "..." }
    return axiosClient.post('/api/auth/check-email', { email });
  },

  // 4. Quên mật khẩu (Public endpoint)
  forgotPassword: (email) => {
    return axiosClient.post(`/api/auth/forgot-password`, null, {
      params: { email }
    });
  },

  // 5. Đặt lại mật khẩu (Public endpoint)
  resetPassword: (token, newPassword) => {
    return axiosClient.post(`/api/auth/reset-password`, null, {
      params: { token, newPassword }
    });
  },

  // 6. Đổi mật khẩu (Cần auth - Có trong ChangePasswordRequest)
  changePassword: (passwordData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return Promise.reject(new Error('Không có token, vui lòng đăng nhập lại'));
    }
    return axiosClient.post('/api/auth/change-password', {
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    });
  },

  // 7. Đăng xuất
  logout: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        axiosClient.post('/api/auth/logout', { token }).catch(() => {});
    }
    localStorage.clear();
  }
};

export default authService;