import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Login.css';

// Import Icon
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State lỗi
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Xóa lỗi khi gõ lại
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Hàm Validate
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Check Pass mới
    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    // Check Nhập lại
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.resetPassword(token, formData.newPassword);

      setMessage('Đổi mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      const errorMsg = err.response?.data || 'Link hết hạn hoặc không hợp lệ.';
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Màn hình lỗi nếu thiếu Token
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h3 style={{ color: '#dc3545' }}>Lỗi Đường Dẫn!</h3>
          <p>Link reset mật khẩu không hợp lệ hoặc thiếu Token.</p>
          <button onClick={() => navigate('/login')} className="btn-submit" style={{ marginTop: '20px' }}>
            Quay về đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đặt Lại Mật Khẩu</h2>

        <form onSubmit={handleSubmit} noValidate>

          {/* Mật khẩu mới */}
          <div className="input-group">
            <label>Mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="******"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? "input-error" : ""}
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
          </div>

          {/* Nhập lại mật khẩu */}
          <div className="input-group">
            <label>Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="******"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              <span className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isLoading}
            style={{ backgroundColor: isLoading ? '#ccc' : '#28a745' }} // Nút màu xanh lá
          >
            {isLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
          </button>
        </form>

        {message && <div style={{ marginTop: '15px', color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px' }}>{message}</div>}
        {apiError && <div style={{ marginTop: '15px', color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px' }}>{apiError}</div>}
      </div>
    </div>
  );
};

export default ResetPassword;