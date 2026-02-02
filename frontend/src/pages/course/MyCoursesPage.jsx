import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import './CoursePage.css';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const navigate = useNavigate();

  // 1. Lấy trực tiếp key lẻ để tránh lỗi undefined
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  const API_URL = '/courses';

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await axiosClient.get(`${API_URL}/mine`);
        const coursesData = res.data;
        setCourses(coursesData);

        // 2. Chỉ gọi tiến độ nếu là Học sinh và có ID
        if (userId && userRole === 'STUDENT' && coursesData.length > 0) {
          // Dùng Promise.all để tải tất cả tiến độ cùng lúc
          const progressPromises = coursesData.map(course => 
            axiosClient.get(`${API_URL}/${course.courseId}/progress/${userId}`)
              .then(res => ({ id: course.courseId, val: res.data }))
              .catch(() => ({ id: course.courseId, val: 0 }))
          );

          const results = await Promise.all(progressPromises);
          const newMap = {};
          results.forEach(item => { newMap[item.id] = item.val; });
          setProgressMap(newMap);
        }
      } catch (err) {
        console.error("Lỗi gọi API:", err);
        if (err.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn.");
          localStorage.clear();
          navigate('/login');
        }
      }
    };

    fetchMyCourses();
  }, [navigate, userId, userRole]);

  const handleLearn = (courseId) => {
    navigate(`/learning/${courseId}`);
  };

  return (
    <div className="course-page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Khóa Học Của Tôi</h1>
            <p style={{ color: '#666' }}>Tiếp tục hành trình chinh phục kiến thức</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-back">
            <ArrowLeft size={18} /> Quay lại Dashboard
          </button>
        </div>

        <div className="course-grid">
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', color: '#666' }}>
              <p>Bạn chưa đăng ký khóa học nào.</p>
              <button onClick={() => navigate('/all-courses')} className="btn-primary">
                Tìm khóa học ngay
              </button>
            </div>
          ) : (
            courses.map((course) => {
              // Lấy phần trăm tiến độ, nếu chưa có thì để 0
              const progress = Math.round(progressMap[course.courseId] || 0);

              return (
                <div key={course.courseId} className="course-card">
                  <div className="card-body">
                    <div style={{ height: '150px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', borderRadius: '8px', color: '#1976d2', fontSize: '3rem' }}>
                      🎓
                    </div>

                    <h2 className="course-title">{course.title}</h2>
                    <div className="card-meta">
                      <span className="duration-tag">⏱ {course.duration}</span>
                    </div>

                    {/* Hiển thị Tiến độ thực tế từ Database */}
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#666' }}>
                        <span>Tiến độ hoàn thành</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          background: progress === 100 ? '#4caf50' : '#2196f3', 
                          borderRadius: '3px',
                          transition: 'width 0.8s ease-in-out' 
                        }}></div>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}