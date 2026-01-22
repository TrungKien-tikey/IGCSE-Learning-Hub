// frontend/src/pages/CoursePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Dùng để chuyển trang
import './CoursePage.css';

export default function CoursePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Sửa/Thêm Khóa học
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', duration: ''
  });

  const API_URL = 'http://localhost:8079/api/courses';

  const fetchCourses = async () => {
    try {
      const response = await axios.get(API_URL);
      setCourses(response.data);
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối Backend! Hãy kiểm tra server.');
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
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration || ''
    });
    setCurrentId(course.courseId);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert("Lỗi: " + (err.response?.data || err.message));
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Bạn chắc chắn xóa khóa học này?")) {
      try {
        await axios.delete(`${API_URL}/${courseId}`);
        // Cập nhật lại danh sách ngay lập tức
        setCourses(prev => prev.filter(c => c.courseId !== courseId));
        alert("Đã xóa thành công!");
      } catch (err) {
        alert("Không thể xóa (Có thể do ràng buộc dữ liệu)!");
      }
    }
  };

  // --- HÀM ẨN KHÓA HỌC ---
  const handleDeactivate = async (courseId) => {
    if (window.confirm("Bạn muốn ẩn khóa học này (Vô hiệu hóa)?")) {
      try {
        // Gọi API deactivate
        await axios.delete(`${API_URL}/${courseId}/deactivate`);
        alert("Đã ẩn khóa học thành công!");
        fetchCourses(); // Load lại để thấy trạng thái "Đã ẩn"
      } catch (err) {
        console.error(err);
        // Nếu lỗi 404: Nghĩa là Backend chưa có API này -> Cần Restart Server Java
        if (err.response && err.response.status === 404) {
          alert("Lỗi: Backend chưa cập nhật API ẩn. Hãy Restart Server Java!");
        } else {
          alert("Lỗi: Không thể vô hiệu hóa.");
        }
      }
    }
  };
  // 2. THÊM HÀM HIỆN (ACTIVATE)
  const handleActivate = async (courseId) => {
    try {
      await axios.put(`${API_URL}/${courseId}/activate`);
      alert("Khóa học đã hiển thị công khai!");
      fetchCourses(); // Load lại danh sách
    } catch (err) {
      alert("Lỗi hiện khóa học");
    }
  };

  // --- HÀM CHUYỂN TRANG SOẠN BÀI (Dùng navigate) ---
  const handleGoToLessonPage = (courseId) => {
    // Chuyển hướng sang trang LessonPage (Trang mới hoàn toàn)
    navigate(`/courses/${courseId}/lessons`);
  };

  return (
    <div className="course-page">
      <div className="container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản Lý Khóa Học</h1>
            <p style={{ color: '#666' }}>Giáo viên: Nguyễn Văn A</p>
          </div>
          <button onClick={openAddModal} className="btn-add">
            + Tạo Khóa Mới
          </button>
        </div>

        {/* Grid Danh sách */}
        <div className="course-grid">
          {courses.map((course) => (
            <div key={course.courseId} className="course-card">

              <div className="card-body">
                <h2 className="course-title" title={course.title}>
                  {course.title}
                  {/* Hiển thị trạng thái ẩn nếu có */}
                  {!course.active && <span style={{ color: 'red', fontSize: '0.8em' }}> (Đã ẩn)</span>}
                </h2>
                <p className="course-desc">{course.description}</p>
                <div className="card-meta">
                  <span className="price-tag">{course.price ? `$${course.price}` : 'Free'}</span>
                  <span className="duration-tag">⏱ {course.duration}</span>
                </div>
              </div>

              <div className="card-actions">
                {/* Nút Soạn bài -> Chuyển trang */}
                <button
                  onClick={() => handleGoToLessonPage(course.courseId)}
                  className="btn-action"
                  style={{ backgroundColor: '#673ab7', color: 'white', flex: 2 }}
                >
                  📚 Soạn Bài
                </button>

                <button onClick={() => openEditModal(course)} className="btn-action btn-edit">Sửa</button>

                {/* Nút Ẩn */}
                {course.active ? (
                  <button
                    onClick={() => handleDeactivate(course.courseId)}
                    className="btn-action"
                    style={{ backgroundColor: '#ff9800', color: 'white' }}
                    title="Đang hiện -> Bấm để Ẩn"
                  >
                    Ẩn
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(course.courseId)}
                    className="btn-action"
                    style={{ backgroundColor: '#4caf50', color: 'white' }} // Màu xanh lá
                    title="Đang ẩn -> Bấm để Hiện"
                  >
                    Hiện
                  </button>
                )}

                <button onClick={() => handleDelete(course.courseId)} className="btn-action btn-delete">Xóa</button>
              </div>

            </div>
          ))}
        </div>

        {/* Modal Popup (Chỉ dành cho Thêm/Sửa Course) */}
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
                    <input name="title" value={formData.title} onChange={handleInputChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="form-textarea" />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Giá ($)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="form-input" />
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

        {/* TUYỆT ĐỐI KHÔNG ĐỂ THẺ <LessonModal> Ở ĐÂY NỮA */}

      </div>
    </div>
  );
}