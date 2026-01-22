import axiosClient from "../api/axiosClient";

const notificationService = {
  // Lấy danh sách
  getMyNotifications: () => {
    return axiosClient.get('/notifications');
  },
  
  // Đánh dấu đã đọc
  markAsRead: (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
  }
};

export default notificationService;