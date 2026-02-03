import axiosClient from "../api/axiosClient";

const notificationService = {
  // Lấy danh sách
  getMyNotifications: () => {
    return axiosClient.get('/api/notifications');
  },
  
  // Đánh dấu đã đọc
  markAsRead: (id) => {
    return axiosClient.put(`/api/notifications/${id}/read`);
  }
};

export default notificationService;