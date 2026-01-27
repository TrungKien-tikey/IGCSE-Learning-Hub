import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import './Register.css'; // Đảm bảo file css nằm cùng thư mục

// Import Icon
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  });

  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 👇 State quản lý lỗi hiển thị (Validation Client-side)
  const [errors, setErrors] = useState({});

  // 👇 State quản lý lỗi Email trùng (Validation Server-side)
  const [apiEmailError, setApiEmailError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 👇 UX: Khi người dùng gõ lại, tự động xóa lỗi đỏ của ô đó đi
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Nếu sửa email, xóa luôn lỗi "Email trùng"
    if (name === 'email') {
      setApiEmailError('');
    }
  };

  // Hàm validate dữ liệu trước khi submit
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // 1. Check Họ tên
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
      isValid = false;
    }

    // 2. Check Email (Rỗng hoặc Sai định dạng)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
      isValid = false;
    }

    // 3. Check Mật khẩu
    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    // 4. Check Nhập lại mật khẩu
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu nhập lại không khớp";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Hàm gọi API check email trùng
  const handleCheckEmail = async () => {
    if (!formData.email || errors.email) return; // Nếu email rỗng hoặc sai định dạng thì khoan check server

    try {
      const response = await authService.checkEmail(formData.email);
      if (response.data === true) {
        setApiEmailError('Email này đã được sử dụng! Vui lòng chọn email khác.');
      } else {
        setApiEmailError('');
      }
    } catch (error) {
      console.error("Lỗi kiểm tra email:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 👇 1. Chạy validate client trước
    if (!validateForm()) {
      return; // Nếu có lỗi thì dừng ngay
    }

    // 👇 2. Check xem còn lỗi API email trùng không
    if (apiEmailError) {
      return;
    }

    // 👇 3. Gọi API Đăng ký
    try {
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      console.log("Đăng ký thành công:", response.data);
      toast.success("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate('/login');

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
      toast.error(message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng Ký Tài Khoản</h2>

        {/* 👇 noValidate: Tắt popup mặc định của trình duyệt */}
        <form onSubmit={handleSubmit} noValidate>

          {/* --- Họ tên --- */}
          <div className="input-group">
            <label>Họ và tên</label>
            <input
              type="text"
              name="fullName"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              // Thêm class lỗi nếu có
              className={errors.fullName ? "input-error" : ""}
            />
            {/* Hiển thị lỗi text đỏ */}
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* --- Email --- */}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleCheckEmail}
              className={(errors.email || apiEmailError) ? "input-error" : ""}
            />
            {/* Ưu tiên hiện lỗi format trước, nếu đúng format mới hiện lỗi trùng */}
            {errors.email && <span className="error-message">{errors.email}</span>}
            {!errors.email && apiEmailError && <span className="error-message">{apiEmailError}</span>}
          </div>

          {/* --- Vai trò --- */}
          <div className="input-group">
            <label>Bạn là ai?</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="role-select"
            >
              <option value="STUDENT">Học sinh (Student)</option>
              <option value="PARENT">Phụ huynh (Parent)</option>
            </select>
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* --- Nhập lại mật khẩu --- */}
          <div className="input-group">
            <label>Nhập lại mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="******"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Nút Đăng ký */}
          <button
            type="submit"
            className="btn-submit"
            disabled={!!apiEmailError} // Chỉ disable khi bị trùng email từ server
            style={apiEmailError ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
          >
            Đăng Ký Ngay
          </button>
        </form>

        <p className="redirect-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;