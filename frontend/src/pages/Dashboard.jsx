import React from 'react';
import StudentDashboardGeneral from './StudentDashboardGeneral';
import TeacherDashboard from './TeacherDashboard';
import GeneralAdminDashboard from './GeneralAdminDashboard';
import AdminCourseApprovalPage from './AdminCourseApprovalPage';

/**
 * Dashboard (Dispatcher)
 * Component này đóng vai trò là "ngã ba đường", kiểm tra role và 
 * hiển thị trang Dashboard tương ứng.
 */
const Dashboard = () => {
    // Lấy role từ localStorage (đã lưu lúc Login)
    const userRole = localStorage.getItem("userRole")?.toUpperCase() || "STUDENT";

    // Trả về Dashboard tương ứng dựa trên vai trò
    switch (userRole) {
        case 'ADMIN':
            return <GeneralAdminDashboard />;
        case 'MANAGER': 
            return <AdminCourseApprovalPage />;
        case 'TEACHER':
            return <TeacherDashboard />;
        case 'STUDENT':
        default:
            return <StudentDashboardGeneral />;
    }
};

export default Dashboard;
