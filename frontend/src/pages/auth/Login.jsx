import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link và useNavigate
import authService from '../../services/authService'; // Import service (đảm bảo đường dẫn đúng)
import './Login.css'; // File CSS của bạn

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Gọi API Đăng nhập
      const response = await authService.login(formData);

      // 2. Lấy Token từ kết quả trả về
      // (Dự phòng cả 2 trường hợp tên biến backend trả về)
      const token = response.data.token || response.data.accessToken;

      // 3. Lưu thông tin vào localStorage
      localStorage.setItem('accessToken', token);
      
      if (response.data.role) {
        localStorage.setItem('userRole', response.data.role);
      }
      if (response.data.userId) {
        localStorage.setItem('userId', response.data.userId);
      }

      // 4. Thông báo và chuyển hướng
      console.log("Đăng nhập thành công:", response.data);
      alert("Đăng nhập thành công!");
      
      // Chuyển về trang Dashboard (hoặc trang chủ)
      navigate('/'); 

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      // Hiển thị lỗi chi tiết hơn nếu có
      const errorMsg = error.response?.data?.message || "Đăng nhập thất bại! Kiểm tra lại email hoặc mật khẩu.";
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

          {/* --- 👇 PHẦN MỚI THÊM: QUÊN MẬT KHẨU 👇 --- */}
          <div style={{ textAlign: 'right', marginBottom: '15px', marginTop: '-10px' }}>
            <Link 
              to="/forgot-password" 
              style={{ fontSize: '14px', color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
            >
              Quên mật khẩu?
            </Link>
          </div>
          {/* --------------------------------------------- */}

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