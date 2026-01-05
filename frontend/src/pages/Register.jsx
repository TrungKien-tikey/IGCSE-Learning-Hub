import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

function Register() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu đăng ký:', formData);
    alert("Đã bấm đăng ký! (Sẽ kết nối API sau)");
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng Ký Tài Khoản</h2>
        <form onSubmit={handleSubmit}>
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