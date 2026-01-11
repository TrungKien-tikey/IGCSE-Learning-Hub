// frontend/src/pages/CoursePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CoursePage.css'; // <--- QUAN TRỌNG: Import file CSS vừa tạo
import LessonModal from './LessonModal'; // Import file vừa tạo
export default function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  // ... các state cũ ...
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState(null);

  const openLessonModal = (course) => {
    setSelectedCourseForLesson(course);
    setIsLessonModalOpen(true);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: ''
  });

  const API_URL = 'http://localhost:8082/api/courses';

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      console.log("Dữ liệu từ Server:", response.data);
      setCourses(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối Backend! Hãy kiểm tra server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const openAddModal = () => {
    setFormData({ title: '', description: '', price: '', duration: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    console.log("Dữ liệu khóa học được chọn:", course); // <--- Thêm dòng này
    console.log("ID sẽ lưu:", course.courseId);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration
    });
    setCurrentId(course.courseId);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.duration) {
      alert("Vui lòng nhập Tên và Thời lượng!");
      return;
    }
    try {
      if (isEditing && currentId) {
        await axios.put(`${API_URL}/${currentId}`, formData);
        alert("Cập nhật thành công!");
      } else {
        await axios.post(API_URL, formData);
        alert("Thêm mới thành công!");
      }
      fetchCourses();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra! " + (err.response?.data || err.message));
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Bạn chắc chắn xóa khóa học này?")) {
      try {
        await axios.delete(`${API_URL}/${courseId}`);
        setCourses(prev => prev.filter(c => c.courseId !== courseId));
        alert("Đã xóa thành công!");
      } catch (err) {
        console.error(err);
        alert("Không thể xóa!");
      }
    }
  };
  // Thêm hàm này bên dưới hàm handleDelete
  const handleDeactivate = async (courseId) => {
    if (window.confirm("Bạn muốn ẩn khóa học này (Vô hiệu hóa)?")) {
      try {
        // Gọi API deactivate của Backend
        await axios.delete(`${API_URL}/${courseId}/deactivate`);

        // Cập nhật lại giao diện (Ví dụ: đổi màu hoặc reload lại)
        alert("Đã vô hiệu hóa thành công!");
        fetchCourses(); // Load lại danh sách để thấy trạng thái mới
      } catch (err) {
        console.error(err);
        alert("Lỗi: Không thể vô hiệu hóa.");
      }
    }
  };

  return (
    <div className="course-page">
      <div className="container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản Lý Khóa Học</h1>
            <p style={{ color: '#666', marginTop: '5px' }}>Danh sách các môn học IGCSE</p>
          </div>
          <button onClick={openAddModal} className="btn-add">
            + Thêm Khóa Học
          </button>
        </div>

        {/* Thông báo lỗi */}
        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Đang tải dữ liệu...</div>
        ) : (
          /* Grid Danh sách */
          <div className="course-grid">
            {courses.length === 0 ? <p>Chưa có dữ liệu.</p> : courses.map((course) => (
              <div key={course.courseId} className="course-card">
                <div className="card-body">
                  <h2 className="course-title" title={course.title}>
                    {course.title}
                    {!course.active && <span style={{ color: 'red', fontSize: '0.8em' }}> (Đã ẩn)</span>}
                  </h2>
                  <p className="course-desc">
                    {course.description || "Chưa có mô tả..."}
                  </p>
                  <div className="card-meta">
                    <span className="price-tag">
                      {course.price ? `$${course.price}` : 'Free'}
                    </span>
                    <span className="duration-tag">
                      ⏱ {course.duration}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={() => openEditModal(course)} className="btn-action btn-edit">Sửa</button>
                  {/* 1. THÊM NÚT VÔ HIỆU HÓA */}
                  <button
                    onClick={() => handleDeactivate(course.courseId)}
                    className="btn-action btn-warning"
                    title="Tạm ẩn khóa học"
                    style={{ backgroundColor: '#ff9800', color: 'white' }} // Style nhanh
                  >
                    Ẩn
                  </button>

                  {/* Sửa lời gọi hàm xóa: truyền courseId */}
                  <button onClick={() => handleDelete(course.courseId)} className="btn-action btn-delete">Xóa</button>
                  <button onClick={() => openLessonModal(course)} className="btn-action" style={{ backgroundColor: '#673ab7', color: 'white' }}>
                    Bài học
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Popup */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{isEditing ? 'Cập Nhật Khóa Học' : 'Thêm Mới Khóa Học'}</h3>
                <button onClick={closeModal} className="btn-close">&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Tên khóa học</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} className="form-input" placeholder="Nhập tên môn học..." required />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="form-textarea" placeholder="Mô tả nội dung..." />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Giá ($)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="form-input" placeholder="0" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Thời lượng</label>
                      <input name="duration" value={formData.duration} onChange={handleInputChange} className="form-input" placeholder="VD: 3 tháng" required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn-cancel">Hủy</button>
                  <button type="submit" className="btn-submit">Lưu Lại</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <LessonModal
        course={selectedCourseForLesson}
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
      />
    </div>
  );
}