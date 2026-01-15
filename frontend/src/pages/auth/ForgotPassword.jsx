import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Gọi API qua Gateway (Port 8000)
      // Lưu ý: Backend dùng @RequestParam nên ta truyền query parameter
      await axios.post(`http://localhost:8000/api/v1/auth/forgot-password?email=${email}`);
      
      setMessage('Link đặt lại mật khẩu đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư (cả mục Spam)!');
    } catch (err) {
      // Lấy lỗi từ Backend trả về (nếu có)
      const errorMsg = err.response?.data || 'Có lỗi xảy ra, vui lòng thử lại sau.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Quên Mật Khẩu</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '10px', 
            backgroundColor: isLoading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>

      {/* Hiển thị thông báo */}
      {message && <div style={{ marginTop: '15px', color: 'green', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px' }}>{message}</div>}
      {error && <div style={{ marginTop: '15px', color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px' }}>{error}</div>}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>← Quay lại Đăng nhập</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;