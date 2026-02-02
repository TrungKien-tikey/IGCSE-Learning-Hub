import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * VerifiedRoute - Chỉ cho phép Teacher đã được DUYỆT (APPROVED) truy cập
 */
const VerifiedRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const [shouldRedirect, setShouldRedirect] = React.useState(null);

    React.useEffect(() => {
        if (!token) {
            setShouldRedirect("/login");
            return;
        }

        let user = null;
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error("Lỗi parse user info", e);
            setShouldRedirect("/login");
            return;
        }

        // 1. Phải là Teacher
        if (user?.role !== 'TEACHER') {
            toast.error("Trang này chỉ dành cho Giáo viên!");
            setShouldRedirect("/");
            return;
        }

        // 2. Phải được APPROVED
        const status = user?.teacherProfile?.verificationStatus;
        if (status !== 'APPROVED') {
            const msg = status === 'PENDING'
                ? "Tài khoản đang CHỜ DUYỆT. Vui lòng đợi Admin phê duyệt để truy cập Dashboard."
                : status === 'REJECTED'
                    ? "Tài khoản của bạn đã bị TỪ CHỐI. Vui lòng cập nhật hồ sơ."
                    : "Vui lòng cập nhật hồ sơ để xác thực tài khoản Teacher.";

            // Thay vì toast ngay, ta set thông báo vào state để Profile hiển thị
            setShouldRedirect({ path: "/profile", state: { verificationError: msg } });
            return;
        }
    }, [token, userStr]);

    if (shouldRedirect) {
        // Chuyển hướng kèm state thông báo
        return <Navigate to={shouldRedirect.path} state={shouldRedirect.state} replace />;
    }

    // Nếu chưa check xong hoặc hợp lệ thì hiện children
    // (Lưu ý: Nếu user hợp lệ thì logic trên không setShouldRedirect -> render children)
    // Tuy nhiên, để tránh "nháy" content khi đang check, ta có thể check điều kiện hợp lệ ngay
    // Nhưng vì logic useEffect chạy sau render, nên an toàn nhất là check điều kiện "Hợp lệ" để render luôn.

    // Code tối ưu lại như sau để tránh nháy:
    let user = null;
    try { user = JSON.parse(userStr); } catch (e) { }

    // Nếu hợp lệ thì render luôn không cần đợi useEffect
    if (token && user?.role === 'TEACHER' && user?.teacherProfile?.verificationStatus === 'APPROVED') {
        return children;
    }

    // Nếu chưa xác định (đang đợi useEffect check để redirect) -> Return null hoặc Loading
    // Nhưng nếu return null thì màn hình trắng.
    // Tốt nhất là return null để đợi redirect.
    return null;
};

export default VerifiedRoute;
