import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './LessonModal.css';

export default function LessonModal({ course, isOpen, onClose }) {
  const [lessons, setLessons] = useState([]);
  const [editingLesson, setEditingLesson] = useState(null); // null = chế độ thêm, object = chế độ sửa
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    orderIndex: 1
  });

  // URL API Backend (Sửa lại port nếu cần)
  const API_URL = 'http://localhost:8082/api/courses';

  // Load danh sách bài học khi mở modal
  useEffect(() => {
    if (isOpen && course) {
      fetchLessons();
      resetForm();
    }
  }, [isOpen, course]);

  const fetchLessons = async () => {
    try {
      const res = await axios.get(`${API_URL}/${course.courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error("Lỗi tải bài học:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        // SỬA (PUT /api/courses/lessons/{id})
        await axios.put(`${API_URL}/lessons/${editingLesson.lessonId}`, formData);
        alert("Cập nhật bài học thành công!");
      } else {
        // THÊM (POST /api/courses/{courseId}/lessons)
        await axios.post(`${API_URL}/${course.courseId}/lessons`, formData);
        alert("Thêm bài học thành công!");
      }
      fetchLessons(); // Tải lại danh sách
      resetForm();
    } catch (err) {
      alert("Lỗi lưu bài học: " + (err.response?.data || err.message));
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      orderIndex: lesson.orderIndex || 1
    });
  };

  const handleDelete = async (lessonId) => {
    if (window.confirm("Bạn chắc chắn xóa bài này?")) {
      try {
        await axios.delete(`${API_URL}/lessons/${lessonId}`);
        fetchLessons();
      } catch (err) {
        alert("Không thể xóa bài học!");
      }
    }
  };

  const resetForm = () => {
    setEditingLesson(null);
    setFormData({ title: '', content: '', videoUrl: '', orderIndex: lessons.length + 1 });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '800px'}}>
        <div className="modal-header">
          <h3>Quản lý bài học: {course?.title}</h3>
          <button onClick={onClose} className="btn-close">&times;</button>
        </div>

        <div className="modal-body" style={{display: 'flex', gap: '20px'}}>
          
          {/* CỘT TRÁI: Form Thêm/Sửa */}
          <div style={{flex: 1, borderRight: '1px solid #eee', paddingRight: '20px'}}>
            <h4>{editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tiêu đề bài học</label>
                <input name="title" value={formData.title} onChange={handleInputChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Thứ tự (Index)</label>
                <input type="number" name="orderIndex" value={formData.orderIndex} onChange={handleInputChange} className="form-input" style={{width: '80px'}} />
              </div>
              <div className="form-group">
                <label>Video URL (Youtube/Driver)</label>
                <input name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} className="form-input" placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Nội dung chi tiết</label>
                <textarea name="content" rows="4" value={formData.content} onChange={handleInputChange} className="form-textarea" />
              </div>
              
              <div style={{marginTop: '10px'}}>
                 <button type="submit" className="btn-submit" style={{width: '100%'}}>
                   {editingLesson ? 'Cập nhật' : 'Thêm bài học'}
                 </button>
                 {editingLesson && (
                   <button type="button" onClick={resetForm} className="btn-cancel" style={{width: '100%', marginTop: '5px'}}>
                     Hủy sửa
                   </button>
                 )}
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: Danh sách bài học */}
          <div style={{flex: 1.2}}>
            <h4>Danh sách bài ({lessons.length})</h4>
            <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px'}}>
              {lessons.length === 0 ? <p style={{padding: '10px', color: '#999'}}>Chưa có bài học nào.</p> : (
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  {lessons.map((lesson) => (
                    <li key={lesson.lessonId} style={{padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <strong>#{lesson.orderIndex}. {lesson.title}</strong>
                        {lesson.videoUrl && <div style={{fontSize: '12px', color: 'blue'}}>🎥 Có video</div>}
                      </div>
                      <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={() => handleEdit(lesson)} style={{padding: '4px 8px', cursor: 'pointer', background: '#e3f2fd', border: 'none', borderRadius: '4px'}}>Sửa</button>
                        <button onClick={() => handleDelete(lesson.lessonId)} style={{padding: '4px 8px', cursor: 'pointer', background: '#ffebee', color: 'red', border: 'none', borderRadius: '4px'}}>Xóa</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}