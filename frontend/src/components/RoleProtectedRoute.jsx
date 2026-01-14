import React from 'react';
import { Navigate } from 'react-router-dom';

/**
   * RoleProtectedRoute - Kiểm tra cả token và role
   * @param {Array} allowedRoles - Danh sách các role được phép truy cập (vd: ['ADMIN', 'TEACHER'])
   */
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole"); // Lấy từ localStorage (đã lưu lúc Login)

    if (!token) {
        // Chưa đăng nhập -> Về trang Login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!userRole || !allowedRoles.includes(userRole.toUpperCase()))) {
        // Đã đăng nhập nhưng sai Role -> Về trang chủ hoặc trang thông báo lỗi
        // Ở đây mình cho về Dashboard chính
        alert("Bạn không có quyền truy cập trang này!");
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleProtectedRoute;
