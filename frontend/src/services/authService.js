import axiosClient from '../api/axiosClient';

const authService = {
  register: (data) => {
    // URL thực tế: /api/v1/auth/register (Qua Gateway)
    return axiosClient.post('/auth/register', data);
  },

  login: async (data) => {
    // URL thực tế: /api/v1/auth/login
    const response = await axiosClient.post('/auth/login', data);
    
    // ✅ Lưu Token vào LocalStorage ngay khi Login thành công
    if (response.data.token) {
        localStorage.setItem('accessToken', response.data.token);
        
        // Nếu Backend trả về refreshToken thì lưu luôn
        if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        if (response.data.role) {
            localStorage.setItem('role', response.data.role);
        }
    }
    
    return response;
  },

  logout: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        // URL thực tế: /api/v1/auth/logout
        axiosClient.post('/auth/logout', { token }).catch(() => {});
    }
    localStorage.clear(); // Xóa sạch LocalStorage
  }
};

export default authService;