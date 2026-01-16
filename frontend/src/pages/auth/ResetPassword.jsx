import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy token từ URL (ví dụ: http://localhost:5173/reset-password?token=XYZ...)
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      // Gọi API Reset Password qua Gateway
      await axios.post(`http://localhost:8000/api/v1/auth/reset-password?token=${token}&newPassword=${newPassword}`);
      
      setMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      
      // Chờ 2 giây rồi chuyển về trang Login
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
        <button onClick={() => navigate('/login')}>Quay về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đặt Lại Mật Khẩu</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu mới</label>
            <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
        </div>

        <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Xác nhận mật khẩu</label>
            <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '10px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
        </button>
      </form>

      {message && <div style={{ marginTop: '15px', color: 'green', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px' }}>{message}</div>}
      {error && <div style={{ marginTop: '15px', color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px' }}>{error}</div>}
    </div>
  );
};

export default ResetPassword;