import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Kiểm tra xem chìa khóa còn trong túi không
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken"); 

  if (!token) {
    // Không có chìa khóa -> Đuổi về trang Login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;