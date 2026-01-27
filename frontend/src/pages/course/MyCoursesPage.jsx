import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import './CoursePage.css';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  const API_URL = '/courses';

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await axiosClient.get(`${API_URL}/mine`);

        setCourses(res.data);
      } catch (err) {
        console.error("Lỗi gọi API:", err);

        // Nếu Backend trả về 401 (Unauthorized) -> Token hết hạn hoặc sai Key
        if (err.response && err.response.status === 401) {
          alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem('accessToken'); // Xóa token cũ
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    };
    fetchMyCourses();
  }, [navigate]); // Thêm navigate vào dependency cho chuẩn React

  const handleLearn = (courseId) => {
    navigate(`/learning/${courseId}`);
  };

  return (
    <div className="course-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Khóa Học Của Tôi</h1>
            <p style={{ color: '#666' }}>Tiếp tục hành trình chinh phục kiến thức</p>
          </div>
        </div>

        <div className="course-grid">
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', color: '#666' }}>
              <p>Bạn chưa đăng ký khóa học nào.</p>
              {/* Có thể thêm nút dẫn về trang danh sách khóa học để mua */}
              <button
                onClick={() => navigate('/courses')}
                style={{ marginTop: '10px', padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Tìm khóa học ngay
              </button>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.courseId} className="course-card">
                <div className="card-body">
                  {/* Ảnh đại diện */}
                  <div style={{ height: '150px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', borderRadius: '8px', color: '#1976d2', fontSize: '3rem' }}>
                    🎓
                  </div>

                  <h2 className="course-title">{course.title}</h2>
                  <div className="card-meta">
                    <span className="duration-tag">⏱ {course.duration}</span>
                  </div>

                  {/* Thanh tiến độ giả lập */}
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#666' }}>
                      <span>Tiến độ</span>
                      <span>0%</span>
                    </div>
                    <div style={{ height: '6px', background: '#eee', borderRadius: '3px' }}>
                      <div style={{ width: '0%', height: '100%', background: '#4caf50', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => handleLearn(course.courseId)}
                    className="btn-action"
                    style={{ backgroundColor: '#1976d2', color: 'white', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <PlayCircle size={18} /> Vào Học Ngay
                  </button>
                </div>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
}