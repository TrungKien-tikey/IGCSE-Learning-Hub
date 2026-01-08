import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  // 1. Thêm 'role' vào state, mặc định là STUDENT
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' // <--- Mới thêm
  });

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
      // 2. Gửi thêm trường 'role' xuống Backend
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role // <--- Quan trọng: Gửi role đã chọn
      });

      console.log("Đăng ký thành công:", response.data);
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate('/login'); 

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const message = error.response?.data || "Đăng ký thất bại. Vui lòng thử lại!";
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

          {/* 3. Phần chọn Vai trò (Dropdown) - MỚI THÊM */}
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
              <option value="TEACHER">Giáo viên (Teacher)</option>
              <option value="PARENT">Phụ huynh (Parent)</option>
              <option value="MANAGER">Quản lý (Manager)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Nhập Mật khẩu */}
          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              name="password" 
              placeholder="******"
              value={formData.password} 
              onChange={handleChange} 
              required
            />
          </div>
          
          {/* Nhập lại Mật khẩu */}
          <div className="input-group">
            <label>Nhập lại mật khẩu</label>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="******"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required
            />
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