import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'
import './CoursePage.css'; // Tận dụng lại CSS cũ cho nhanh

export default function AllCoursesPage() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const API_URL = '/api/courses';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axiosClient.get(API_URL);
        // Lọc: Chỉ lấy những khóa đang ACTIVE (Không bị ẩn)
        const activeCourses = res.data.filter(c => c.active === true);
        setCourses(activeCourses);
      } catch (err) {
        console.error("Lỗi tải khóa học:", err);
      }
    };
    fetchCourses();
  }, []);

  const handleViewDetail = (courseId) => {
    // Chuyển sang trang chi tiết để xem và mua
    navigate(`/course-detail/${courseId}`);
  };

  return (
    <div className="course-page">
      <div className="container">
        {/* HEADER ĐÃ THÊM NÚT QUAY LẠI */}
        <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-back"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0',
              background: 'none',
              border: 'none',
              color: '#1976d2',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} /> Quay lại Dashboard
          </button>

          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Thư Viện Khóa Học</h1>
            <p style={{ color: '#666', marginTop: '5px' }}>Khám phá và nâng cao kiến thức IGCSE</p>
          </div>
        </div>

        <div className="course-grid">
          {courses.length === 0 ? <p>Chưa có khóa học nào đang mở.</p> : courses.map((course) => (
            <div key={course.courseId} className="course-card">
              <div className="card-body">
                {/* Giả lập ảnh bìa nếu chưa có */}
                <div style={{ height: '150px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '3rem' }}>📚</span>
                </div>

                <h2 className="course-title">{course.title}</h2>
                <p className="course-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description}
                </p>

                <div className="card-meta">
                  <span className="price-tag" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                    {course.price > 0 ? `${Number(course.price).toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
                  </span>
                  <span className="duration-tag">⏱ {course.duration}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleViewDetail(course.courseId)}
                  className="btn-action"
                  style={{ backgroundColor: '#2196f3', color: 'white', width: '100%' }}
                >
                  Xem Chi Tiết & Đăng Ký
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}