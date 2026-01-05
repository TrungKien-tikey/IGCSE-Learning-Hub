import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css'; // Chúng ta sẽ tạo file này ở bước 2

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu đăng nhập:', formData);
    alert("Đã bấm đăng nhập! (Sẽ kết nối API sau)");
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