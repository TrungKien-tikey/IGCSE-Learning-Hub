import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowLeft, CheckCircle } from 'lucide-react'; // Thêm icon CheckCircle
import './CoursePage.css';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const navigate = useNavigate();

  const userRole = localStorage.getItem('userRole');

  const API_URL = '/courses';

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        // 1. Lấy danh sách khóa học của tôi
        const res = await axiosClient.get(`${API_URL}/mine`);
        const coursesData = res.data;
        setCourses(coursesData);

        // 2. Chỉ gọi tiến độ nếu là Học sinh và có danh sách khóa học
        if (userRole === 'STUDENT' && coursesData.length > 0) {
          
          // Dùng Promise.all để gọi song song các API lấy tiến độ
          const progressPromises = coursesData.map(course => 
            // SỬA ĐỔI: Gọi API /progress không cần userId (Backend tự lấy từ Token)
            axiosClient.get(`${API_URL}/${course.courseId}/progress`)
              .then(res => ({ id: course.courseId, val: res.data }))
              .catch(() => ({ id: course.courseId, val: 0 }))
          );

          const results = await Promise.all(progressPromises);
          
          // Chuyển mảng kết quả thành Map { courseId: percent }
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
  }, [navigate, userRole]);

  const handleLearn = (courseId) => {
    navigate(`/learning/${courseId}`);
  };

  return (
    <div className="course-page">
      <div className="container">
        {/* HEADER */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Khóa Học Của Tôi</h1>
            <p style={{ color: '#666' }}>Tiếp tục hành trình chinh phục kiến thức</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-back">
            <ArrowLeft size={18} /> Quay lại Dashboard
          </button>
        </div>

        {/* LIST COURSES */}
        <div className="course-grid">
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', color: '#666', marginTop: '50px' }}>
              <p>Bạn chưa đăng ký khóa học nào.</p>
              <button onClick={() => navigate('/all-courses')} className="btn-primary" style={{marginTop: '10px'}}>
                Tìm khóa học ngay
              </button>
            </div>
          ) : (
            courses.map((course) => {
              // Lấy phần trăm tiến độ, làm tròn số
              const rawProgress = progressMap[course.courseId] || 0;
              const progress = Math.round(rawProgress);

              return (
                <div key={course.courseId} className="course-card">
                  <div className="card-body">
                    {/* Icon đại diện khóa học */}
                    <div style={{ 
                        height: '140px', 
                        background: '#e3f2fd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '15px', 
                        borderRadius: '8px', 
                        color: '#1976d2', 
                        fontSize: '3rem',
                        position: 'relative'
                    }}>
                      🎓
                      {progress === 100 && (
                          <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: '#4caf50',
                              color: 'white',
                              borderRadius: '50%',
                              padding: '5px'
                          }}>
                              <CheckCircle size={24} />
                          </div>
                      )}
                    </div>

                    <h2 className="course-title" title={course.title}>
                        {course.title.length > 50 ? course.title.substring(0, 50) + '...' : course.title}
                    </h2>
                    
                    <div className="card-meta">
                      <span className="duration-tag">⏱ {course.duration || 'Chưa cập nhật'}</span>
                    </div>

                    {/* THANH TIẾN ĐỘ - PROGRESS BAR */}
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#555', fontWeight: '500' }}>
                        <span>Tiến độ học tập</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          background: progress === 100 ? '#4caf50' : 'linear-gradient(90deg, #2196f3, #64b5f6)', 
                          borderRadius: '4px',
                          transition: 'width 1s ease-in-out' 
                        }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      onClick={() => handleLearn(course.courseId)}
                      className="btn-action"
                      style={{ 
                          backgroundColor: progress === 100 ? '#4caf50' : '#1976d2', 
                          color: 'white', 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px' 
                      }}
                    >
                      <PlayCircle size={18} /> {progress === 100 ? 'Xem lại khóa học' : 'Tiếp tục học'}
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