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
};

export default authService;