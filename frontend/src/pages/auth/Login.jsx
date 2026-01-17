import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Login.css';

function Login() {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Gọi API
      const response = await authService.login(formData);
      const serverData = response.data;
      const token = serverData.token;

      // Kiểm tra an toàn
      if (!token) {
        throw new Error("Lỗi: Không tìm thấy Token!");
      }

      // 2. Lưu thông tin vào localStorage (Dùng local để giữ đăng nhập lâu dài)
      localStorage.setItem('accessToken', token);
      
      if (serverData.role) {
        localStorage.setItem('userRole', serverData.role);
      }
      if (serverData.userId || serverData.id) {
        localStorage.setItem('userId', serverData.userId || serverData.id);
      }

      // 3. Thông báo và chuyển hướng
      alert("Đăng nhập thành công!");
      
      // Dùng window.location.href để đảm bảo tải lại trang và cập nhật trạng thái đăng nhập
      window.location.href = '/';

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const errorMsg = error.response?.data?.message || "Đăng nhập thất bại! Kiểm tra lại thông tin.";
      alert(errorMsg);
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
              required 
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
              required
            />
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