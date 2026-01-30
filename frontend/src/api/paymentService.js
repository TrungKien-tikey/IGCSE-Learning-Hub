import axios from 'axios';

// Payment Service API client
const paymentClient = axios.create({
    baseURL: '/api/payment', // Sẽ được proxy đến payment-service:8084
    headers: {
        'Content-Type': 'application/json',
    },
});

// Admin Statistics API client
const statisticsClient = axios.create({
    baseURL: '/api/admin/statistics', // Sẽ được proxy đến payment-service:8084
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm interceptor để tự động chèn token vào header
[paymentClient, statisticsClient].forEach(client => {
    client.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
});

// ==================== PAYMENT API ====================

/**
 * Lấy danh sách gói suất học đang bán
 */
export const getActivePackages = async () => {
    const response = await paymentClient.get('/packages');
    return response.data;
};

/**
 * Lấy chi tiết một gói suất học
 */
export const getPackageById = async (id) => {
    const response = await paymentClient.get(`/packages/${id}`);
    return response.data;
};

/**
 * Lấy tất cả gói (bao gồm ẩn)
 */
export const getAllPackages = async () => {
    const response = await paymentClient.get('/packages/all');
    return response.data;
};

/**
 * Tạo gói suất học mới
 */
export const createPackage = async (data) => {
    const response = await paymentClient.post('/packages', data);
    return response.data;
};

/**
 * Cập nhật gói suất học
 */
export const updatePackage = async (id, data) => {
    const response = await paymentClient.put(`/packages/${id}`, data);
    return response.data;
};

/**
 * Xóa (ẩn) gói suất học
 */
export const deletePackage = async (id) => {
    const response = await paymentClient.delete(`/packages/${id}`);
    return response.data;
};

/**
 * Bật/tắt trạng thái gói
 */
export const togglePackageStatus = async (id) => {
    const response = await paymentClient.post(`/packages/${id}/toggle`);
    return response.data;
};

/**
 * Mua gói suất học
 */
export const purchaseSlotPackage = async (data) => {
    const response = await paymentClient.post('/slots/purchase', data);
    return response.data;
};

/**
 * Xác nhận thanh toán suất học
 */
export const confirmSlotPayment = async (transactionId) => {
    const response = await paymentClient.post(`/slots/confirm/${transactionId}`);
    return response.data;
};

/**
 * Mua khóa học
 */
export const purchaseCourse = async (data) => {
    const response = await paymentClient.post('/course/purchase', data);
    return response.data;
};

/**
 * Xác nhận thanh toán khóa học
 */
export const confirmCoursePayment = async (transactionId) => {
    const response = await paymentClient.post(`/course/confirm/${transactionId}`);
    return response.data;
};

/**
 * Lấy thông tin suất học của giáo viên
 */
export const getTeacherSlots = async (teacherId) => {
    const response = await paymentClient.get(`/teacher/${teacherId}/slots`);
    return response.data;
};

/**
 * Kiểm tra giáo viên còn suất học không
 */
export const checkTeacherSlots = async (teacherId) => {
    const response = await paymentClient.get(`/teacher/${teacherId}/check-slots`);
    return response.data;
};

// ==================== ADMIN STATISTICS API ====================

/**
 * Lấy tổng quan doanh thu
 */
export const getRevenueOverview = async () => {
    const response = await statisticsClient.get('/revenue/overview');
    return response.data;
};

/**
 * Lấy doanh thu theo tháng trong năm
 */
export const getMonthlyRevenue = async (year = new Date().getFullYear()) => {
    const response = await statisticsClient.get('/revenue/monthly', { params: { year } });
    return response.data;
};

/**
 * Lấy doanh thu theo ngày trong tháng
 */
export const getDailyRevenue = async (year, month) => {
    const response = await statisticsClient.get('/revenue/daily', { params: { year, month } });
    return response.data;
};

/**
 * Lấy doanh thu theo khoảng thời gian
 */
export const getRevenueByDateRange = async (start, end) => {
    const response = await statisticsClient.get('/revenue/date-range', {
        params: { start, end }
    });
    return response.data;
};

/**
 * Lấy lịch sử giao dịch với phân trang
 */
export const getTransactionHistory = async (params = {}) => {
    const response = await statisticsClient.get('/transactions', { params });
    return response.data;
};

/**
 * Lấy top giáo viên có doanh thu cao nhất
 */
export const getTopTeachers = async (limit = 10) => {
    const response = await statisticsClient.get('/top-teachers', { params: { limit } });
    return response.data;
};

/**
 * Lấy thống kê suất học
 */
export const getSlotStatistics = async () => {
    const response = await statisticsClient.get('/slots');
    return response.data;
};

export { paymentClient, statisticsClient };
