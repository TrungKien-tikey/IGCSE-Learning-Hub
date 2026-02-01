import axiosClient from '../api/axiosClient';

const authService = {
  register: (data) => {
    // Gọi API đăng ký: POST /auth/register
    return axiosClient.post('/auth/register', data);
  },

  login: (data) => {
    // Gọi API đăng nhập: POST /auth/login
    return axiosClient.post('/auth/login', data);
  },

  changePassword: (data) => {
    // Gọi API đổi mật khẩu: POST /auth/change-password
    return axiosClient.post('/auth/change-password', data);
  },
  
  // Gọi API: GET /auth/check-email?email=...
  checkEmail: (email) => {
    return axiosClient.get('/auth/check-email', {
      params: { email: email }
    });
  }
};

export default authService;