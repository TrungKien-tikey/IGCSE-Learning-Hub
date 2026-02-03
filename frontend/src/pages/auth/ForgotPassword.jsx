import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // State quản lý lỗi hiển thị
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(''); // Lỗi từ API trả về

  const [isLoading, setIsLoading] = useState(false);

  // Hàm validate
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Check Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email không đúng định dạng";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Xóa lỗi khi người dùng nhập lại
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
    setApiError(''); // Xóa lỗi API cũ
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setApiError('');

    // 1. Validate Client
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Gọi API qua authService
      await authService.forgotPassword(email);

      setMessage('Link đặt lại mật khẩu đã được gửi vào email. Vui lòng kiểm tra hộp thư (cả mục Spam)!');
    } catch (err) {
      const errorMsg = err.response?.data || 'Có lỗi xảy ra, vui lòng thử lại sau.';
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container"> {/* Dùng class của Login */}
      <div className="login-box">
        <h2>Quên Mật Khẩu</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Nhập email để nhận hướng dẫn đặt lại mật khẩu.
        </p>

        {/* noValidate tắt popup trình duyệt */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={handleChange}
              // Thêm class lỗi đỏ
              className={errors.email ? "input-error" : ""}
            />
            {/* Hiện lỗi validate */}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isLoading}
            style={isLoading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>

        {/* Hiển thị thông báo API */}
        {message && <div style={{ marginTop: '15px', color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>{message}</div>}
        {apiError && <div style={{ marginTop: '15px', color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>{apiError}</div>}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" className="redirect-text" style={{ fontSize: '14px' }}>
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;