import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Register.css';

// 👇 1. Import Icon
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

  // 👇 2. State quản lý ẩn/hiện cho 2 ô mật khẩu riêng biệt
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu nhập lại
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      console.log("Đăng ký thành công:", response.data);
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate('/login'); 

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
      alert(message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng Ký Tài Khoản</h2>
        <form onSubmit={handleSubmit}>
          
          {/* Nhập Họ tên */}
          <div className="input-group">
            <label>Họ và tên</label>
            <input 
              type="text" 
              name="fullName" 
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.fullName} 
              onChange={handleChange} 
              required
            />
          </div>

          {/* Nhập Email */}
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              placeholder="email@example.com"
              value={formData.email} 
              onChange={handleChange} 
              required
            />
          </div>

          {/* Chọn Vai trò */}
          <div className="input-group">
            <label>Bạn là ai?</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            >
              <option value="STUDENT">Học sinh (Student)</option>
              <option value="PARENT">Phụ huynh (Parent)</option>
            </select>
          </div>

          {/* 👇 3. Nhập Mật khẩu (Có icon mắt) */}
          <div className="input-group">
            <label>Mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} // Type động
                name="password" 
                placeholder="******"
                value={formData.password} 
                onChange={handleChange} 
                required
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          
          {/* 👇 4. Nhập lại Mật khẩu (Có icon mắt riêng) */}
          <div className="input-group">
            <label>Nhập lại mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} // Type động
                name="confirmPassword" 
                placeholder="******"
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="btn-submit">Đăng Ký Ngay</button>
        </form>
        
        <p className="redirect-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;