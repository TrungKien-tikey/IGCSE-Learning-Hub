import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import './CoursePage.css'; // Tận dụng CSS của trang Course cũ cho nhanh

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const userId = 1; // Giả lập ID user
  const API_URL = 'http://localhost:8079/api/courses';

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        // Gọi API lấy danh sách đã mua
        const res = await axios.get(`${API_URL}/my-courses?userId=${userId}`);
        setCourses(res.data);
      } catch (err) {
        console.error("Lỗi:", err);
      }
    };
    fetchMyCourses();
  }, []);

  const handleLearn = (courseId) => {
    navigate(`/learning/${courseId}`); // Chuyển sang trang học
  };

  return (
    <div className="course-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Khóa Học Của Tôi</h1>
            <p style={{color: '#666'}}>Tiếp tục hành trình chinh phục kiến thức</p>
          </div>
        </div>

        <div className="course-grid">
          {courses.length === 0 ? <p>Bạn chưa đăng ký khóa học nào.</p> : courses.map((course) => (
            <div key={course.courseId} className="course-card">
              <div className="card-body">
                {/* Ảnh đại diện */}
                <div style={{height: '150px', background: '#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'15px', borderRadius:'8px', color:'#1976d2', fontSize:'3rem'}}>
                    🎓
                </div>
                
                <h2 className="course-title">{course.title}</h2>
                <div className="card-meta">
                  <span className="duration-tag">⏱ {course.duration}</span>
                </div>
                
                {/* Thanh tiến độ giả lập */}
                <div style={{marginTop: '15px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'5px', color:'#666'}}>
                        <span>Tiến độ</span>
                        <span>0%</span>
                    </div>
                    <div style={{height:'6px', background:'#eee', borderRadius:'3px'}}>
                        <div style={{width:'0%', height:'100%', background:'#4caf50', borderRadius:'3px'}}></div>
                    </div>
                </div>
              </div>

              <div className="card-actions">
                <button 
                    onClick={() => handleLearn(course.courseId)} 
                    className="btn-action"
                    style={{backgroundColor: '#1976d2', color: 'white', width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}
                >
                    <PlayCircle size={18} /> Vào Học Ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}