import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import authService from '../services/authService'; // Import service
import './Login.css';

function Login() {
  const navigate = useNavigate(); // Hook để chuyển trang
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => { // Thêm async
    e.preventDefault();
    
    try {
      // 1. Gọi API Đăng nhập
      const response = await authService.login(formData);
      
      // 2. Lấy Token từ kết quả trả về
      // (Cấu trúc response.data phụ thuộc vào Backend trả về gì, 
      // nhưng thường là response.data.accessToken hoặc response.data.token)
      const token = response.data.token || response.data.accessToken;

      // 3. Lưu Token vào "túi" (localStorage) của trình duyệt
      localStorage.setItem('accessToken', token);
      
      // 4. Thông báo và chuyển về trang chủ
      console.log("Đăng nhập thành công:", response.data);
      alert("Đăng nhập thành công!");
      navigate('/'); // Chuyển về trang chủ (Sau này sẽ là trang Dashboard)

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Đăng nhập thất bại! Kiểm tra lại email hoặc mật khẩu.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng Nhập</h2>
        <form onSubmit={handleSubmit}>
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