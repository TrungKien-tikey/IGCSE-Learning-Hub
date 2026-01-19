import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 👇 1. Import Icon
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy token từ URL
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 👇 2. Thêm state quản lý ẩn/hiện cho 2 ô
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API Reset Password
      await axios.post(`http://localhost:8000/api/v1/auth/reset-password?token=${token}&newPassword=${newPassword}`);
      
      setMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      const errorMsg = err.response?.data || 'Link hết hạn hoặc không hợp lệ.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu không có token trên URL thì báo lỗi luôn
  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h3 style={{ color: 'red' }}>Đường dẫn không hợp lệ hoặc thiếu Token!</h3>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Quay về trang đăng nhập</button>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đặt Lại Mật Khẩu</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* 👇 3. Ô Mật khẩu mới */}
        <div>
           <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mật khẩu mới</label>
           <div style={{ position: 'relative', width: '100%' }}>
             <input
               type={showPassword ? "text" : "password"} // Type động
               placeholder="Nhập mật khẩu mới"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               required
               style={{ 
                 width: '100%', 
                 padding: '10px', 
                 paddingRight: '40px', // Chừa chỗ cho icon
                 borderRadius: '5px', 
                 border: '1px solid #ccc',
                 boxSizing: 'border-box'
               }}
             />
             <span
               onClick={() => setShowPassword(!showPassword)}
               style={{
                 position: 'absolute',
                 right: '10px',
                 top: '50%',
                 transform: 'translateY(-50%)',
                 cursor: 'pointer',
                 color: '#666',
                 fontSize: '18px',
                 display: 'flex'
               }}
             >
               {showPassword ? <FaEyeSlash /> : <FaEye />}
             </span>
           </div>
        </div>

        {/* 👇 4. Ô Xác nhận mật khẩu */}
        <div>
           <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Xác nhận mật khẩu</label>
           <div style={{ position: 'relative', width: '100%' }}>
             <input
               type={showConfirmPassword ? "text" : "password"} // Type động
               placeholder="Nhập lại mật khẩu mới"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               required
               style={{ 
                 width: '100%', 
                 padding: '10px', 
                 paddingRight: '40px', // Chừa chỗ cho icon
                 borderRadius: '5px', 
                 border: '1px solid #ccc',
                 boxSizing: 'border-box' 
               }}
             />
             <span
               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
               style={{
                 position: 'absolute',
                 right: '10px',
                 top: '50%',
                 transform: 'translateY(-50%)',
                 cursor: 'pointer',
                 color: '#666',
                 fontSize: '18px',
                 display: 'flex'
               }}
             >
               {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
             </span>
           </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '12px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginTop: '10px',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
        </button>
      </form>

      {message && <div style={{ marginTop: '15px', color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ marginTop: '15px', color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', border: '1px solid #f5c6cb' }}>{error}</div>}
    </div>
  );
};

export default ResetPassword;