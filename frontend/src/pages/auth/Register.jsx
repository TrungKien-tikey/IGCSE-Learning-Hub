import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Register.css';

// 1. Import Icon
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

  // 2. State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 👇 3. State quản lý lỗi Email trùng
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // 👇 Nếu người dùng sửa lại email, tạm thời xóa lỗi đi để họ nhập tiếp
    if (e.target.name === 'email') {
      setEmailError('');
    }
  };

  // 👇 4. Hàm gọi API check email khi người dùng nhập xong (Sự kiện onBlur)
  const handleCheckEmail = async () => {
    // Nếu chưa nhập gì thì thôi không check
    if (!formData.email) return;

    try {
      const response = await authService.checkEmail(formData.email);
      // Backend trả về true nghĩa là Email ĐÃ TỒN TẠI
      if (response.data === true) {
        setEmailError('Email này đã được sử dụng! Vui lòng chọn email khác.');
      } else {
        setEmailError(''); // Email hợp lệ
      }
    } catch (error) {
      console.error("Lỗi kiểm tra email:", error);
      // Nếu API lỗi (ví dụ mất mạng), tạm thời không chặn user, để họ bấm Đăng ký rồi Backend xử lý sau
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 👇 Chặn không cho gửi nếu đang có lỗi Email
    if (emailError) {
      alert("Vui lòng sửa lỗi Email trước khi đăng ký!");
      return;
    }

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

          {/* Nhập Email (Có tính năng Check trùng) */}
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              placeholder="email@example.com"
              value={formData.email} 
              onChange={handleChange} 
              onBlur={handleCheckEmail} // 👈 Kích hoạt check khi bấm ra ngoài
              required
              style={emailError ? { border: '1px solid red' } : {}} // Viền đỏ nếu lỗi
            />
            {/* Hiển thị dòng thông báo lỗi */}
            {emailError && <span style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{emailError}</span>}
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

          {/* Nhập Mật khẩu */}
          <div className="input-group">
            <label>Mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
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
          
          {/* Nhập lại Mật khẩu */}
          <div className="input-group">
            <label>Nhập lại mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"}
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

          {/* Nút Đăng ký (Disable nếu có lỗi) */}
          <button 
            type="submit" 
            className="btn-submit"
            disabled={!!emailError} // Khóa nút nếu có lỗi
            style={emailError ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
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