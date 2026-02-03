import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * VerifiedRoute - Chỉ cho phép Teacher đã được DUYỆT (APPROVED) truy cập
 */
const VerifiedRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const [user, setUser] = React.useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch (e) {
            return null;
        }
    });
    const [isLoading, setIsLoading] = React.useState(!user); // Nếu chưa có user thì loading
    const [shouldRedirect, setShouldRedirect] = React.useState(null);

    // Hàm lấy lại thông tin user nếu thiếu
    const fetchUserProfile = async () => {
        try {
            const { default: authClient } = await import('../api/authClient');

            const response = await authClient.get('/users/me');
            const userData = response.data;

            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error("Lỗi xác thực lại user:", error);
            setShouldRedirect("/login");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (!token) {
            setShouldRedirect("/login");
            return;
        }

        // Nếu chưa có user trong localStorage -> Gọi API lấy lại
        if (!user) {
            fetchUserProfile();
            return; // Đợi fetch xong mới check tiếp
        }

        // Đã có user, bắt đầu check quyền
        setIsLoading(false);

        // 1. Phải là Teacher (hoặc Admin - Admin được quyền vào mọi trang Teacher để kiểm tra)
        if (user.role === 'ADMIN') {
            return; // OK
        }

        if (user.role !== 'TEACHER') {
            toast.error("Trang này chỉ dành cho Giáo viên!");
            setShouldRedirect("/");
            return;
        }

        // 2. Phải được APPROVED
        const status = user.teacherProfile?.verificationStatus;
        if (status !== 'APPROVED') {
            const msg = status === 'PENDING'
                ? "Tài khoản đang CHỜ DUYỆT. Vui lòng đợi Admin phê duyệt để truy cập Dashboard."
                : status === 'REJECTED'
                    ? "Tài khoản của bạn đã bị TỪ CHỐI. Vui lòng cập nhật hồ sơ."
                    : "Vui lòng cập nhật hồ sơ để xác thực tài khoản Teacher.";

            setShouldRedirect({ path: "/profile", state: { verificationError: msg } });
        }
    }, [token, user]); // Chạy lại khi user thay đổi (sau khi fetch xong)

    if (shouldRedirect) {
        if (typeof shouldRedirect === 'string') {
            return <Navigate to={shouldRedirect} replace />;
        }
        return <Navigate to={shouldRedirect.path} state={shouldRedirect.state} replace />;
    }

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    // Double check an toàn trước khi render
    if (user?.role === 'ADMIN' || (user?.role === 'TEACHER' && user?.teacherProfile?.verificationStatus === 'APPROVED')) {
        return children;
    }

    return null; // Trường hợp đang xử lý hoặc lọt lưới
};

export default VerifiedRoute;
