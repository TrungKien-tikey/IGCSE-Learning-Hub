import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <--- Thêm useNavigate để chuyển trang
import authService from '../services/authService'; // <--- Import service vừa viết
import './Register.css';

function Register() {
  const navigate = useNavigate(); // <--- Khởi tạo hook chuyển trang
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => { // <--- Thêm từ khóa async
    e.preventDefault();
    
    // 1. Kiểm tra mật khẩu nhập lại
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      // 2. Gọi API thực sự
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      // 3. Nếu thành công
      console.log("Đăng ký thành công:", response.data);
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate('/login'); // Chuyển sang trang đăng nhập

    } catch (error) {
      // 4. Nếu thất bại (Backend trả về lỗi)
      console.error("Lỗi đăng ký:", error);
      // Lấy câu thông báo lỗi từ Backend (nếu có)
      const message = error.response?.data || "Đăng ký thất bại. Vui lòng thử lại!";
      alert(message);
    }
  };

  // ... (Phần return giao diện giữ nguyên y hệt cũ) ...
  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng Ký Tài Khoản</h2>
        <form onSubmit={handleSubmit}>
          {/* ... Các ô input giữ nguyên ... */}
          <div className="input-group">
            <label>Họ và tên</label>
            <input 
              type="text" 
              name="fullName" 
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.fullName} 
              onChange={handleChange} 
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              placeholder="email@example.com"
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              name="password" 
              placeholder="******"
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="input-group">
            <label>Nhập lại mật khẩu</label>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="******"
              value={formData.confirmPassword} 
              onChange={handleChange} 
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