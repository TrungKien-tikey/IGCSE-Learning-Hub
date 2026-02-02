import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import './Login.css';
import { requestForToken } from "../../firebase";
import axiosClient from "../../api/axiosClient";

// Import Icon Mắt
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State quản lý hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // 👇 1. State quản lý lỗi validation
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 👇 2. UX: Người dùng nhập lại thì xóa lỗi đỏ đi
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 👇 3. Hàm kiểm tra dữ liệu đầu vào
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Xóa dữ liệu cũ để tránh conflict role
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');

    // 👇 4. Chặn submit nếu dữ liệu chưa nhập đủ
    if (!validateForm()) {
      return;
    }

    try {
      const response = await authService.login(formData);
      const serverData = response.data;
      const token = serverData.token;

      if (!token) {
        throw new Error("Lỗi: Không tìm thấy Token!");
      }

      localStorage.setItem('accessToken', token);

      if (serverData.role) {
        localStorage.setItem('userRole', serverData.role);
      }

      if (serverData.userId || serverData.id) {
        localStorage.setItem('userId', serverData.userId || serverData.id);
      }

      // --- LOGIC FCM ---
      if (serverData.role === 'STUDENT') {
        try {
          console.log("--> Bắt đầu lấy FCM Token...");
          const fcmToken = await requestForToken();

          if (fcmToken) {
            await axiosClient.post('/notifications/subscribe', {
              token: fcmToken
            });
            console.log("--> Đã gửi Token về server thành công!");
          }
        } catch (fcmError) {
          console.error(" Lỗi đăng ký FCM (Không ảnh hưởng đăng nhập):", fcmError);
        }
      }

      toast.success("Đăng nhập thành công!");
      window.location.href = '/';

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const errorMsg = error.response?.data?.message || "Đăng nhập thất bại! Kiểm tra lại thông tin.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng Nhập</h2>

        {/* 👇 noValidate: Tắt popup mặc định */}
        <form onSubmit={handleSubmit} noValidate>

          {/* --- Email --- */}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
              // Thêm class lỗi nếu có
              className={errors.email ? "input-error" : ""}
            />
            {/* Hiển thị dòng chữ đỏ */}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* --- Mật khẩu --- */}
          <div className="input-group">
            <label>Mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="******"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              <span
                className="password-toggle-icon"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '15px', marginTop: '-10px' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '14px', color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="btn-submit">Đăng Nhập</button>
        </form>

        <p className="redirect-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;