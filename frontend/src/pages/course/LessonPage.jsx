import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { MessageSquare } from 'lucide-react'; // Thêm icon từ lucide
import './LessonPage.css';

export default function LessonPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', content: '', videoUrl: '', orderIndex: 1
  });

  const API_URL = '/courses';

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      const res = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLessonId(lesson.lessonId);
    setFormData({
      title: lesson.title,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      orderIndex: lesson.orderIndex
    });
  };

  const handleCreateNew = () => {
    setSelectedLessonId(null);
    setFormData({ title: '', content: '', videoUrl: '', orderIndex: lessons.length + 1 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedLessonId) {
        await axiosClient.put(`${API_URL}/lessons/${selectedLessonId}`, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post(`${API_URL}/${courseId}/lessons`, formData);
        toast.success("Thêm bài mới thành công!");
      }
      fetchLessons();
      if (!selectedLessonId) handleCreateNew();
    } catch (err) { toast.error("Lỗi lưu dữ liệu: " + (err.response?.data || err.message)); }
  };

  const handleDelete = async (e, lessonId) => {
    e.stopPropagation();

    if (window.confirm("Bạn có chắc chắn muốn xóa bài học này không?")) {
      try {
        await axiosClient.delete(`${API_URL}/lessons/${lessonId}`);
        toast.success("Đã xóa thành công!");
        fetchLessons();

        if (selectedLessonId === lessonId) {
          handleCreateNew();
        }
      } catch (err) {
        toast.error("Lỗi: Không thể xóa bài học này.");
      }
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  // Hàm mở chat đồng bộ với StudentLearningPage
  const handleOpenChat = () => {
    navigate('/chat', {
      state: {
        courseId: courseId,
        courseTitle: "Thảo luận lớp học"
      }
    });
  };

  return (
    <div className="lp-container">
      {/* 1. HEADER */}
      <header className="lp-header">
        <div className="lp-brand">
          <button onClick={() => navigate('/courses')} className="btn-back">⬅ Quay lại</button>
          <span className="lp-course-name">Quản lý nội dung khóa học</span>
        </div>
        <div className="lp-tools">
          {/* SỬA ICON BÌNH LUẬN TẠI ĐÂY */}
          <div
            className="icon-btn"
            title="Thảo luận cùng lớp"
            onClick={handleOpenChat}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageSquare size={20} />
          </div>

          <div className="user-info">
            <span>Giáo viên A</span>
            <div className="avatar">GV</div>
          </div>
          <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: 10, cursor: 'pointer' }}>Đăng xuất</button>
        </div>
      </header>

      {/* 2. BODY */}
      <div className="lp-body">
        {/* CỘT TRÁI: SIDEBAR */}
        <aside className="lp-sidebar">
          <div className="sidebar-top">
            <h3>MỤC LỤC</h3>
            <button onClick={handleCreateNew} className="btn-new-lesson">+ Thêm Bài</button>
          </div>
          <div className="lesson-list">
            {lessons.map((l) => (
              <div
                key={l.lessonId}
                className={`lesson-item ${selectedLessonId === l.lessonId ? 'active' : ''}`}
                onClick={() => handleSelectLesson(l)}
              >
                <span className="idx">#{l.orderIndex}</span>
                <span className="txt">{l.title}</span>
                <button
                  className="btn-delete-mini"
                  onClick={(e) => handleDelete(e, l.lessonId)}
                  title="Xóa bài này"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* CỘT PHẢI: EDITOR */}
        <main className="lp-content">
          <div className="paper">
            <h2>{selectedLessonId ? 'Chỉnh Sửa Bài Học' : 'Soạn Thảo Bài Mới'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Tiêu đề bài học</label>
                <input className="inp-title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Nhập tên bài..." required />
              </div>
              <div className="row">
                <div className="col">
                  <label>Thứ tự</label>
                  <input type="number" className="inp" value={formData.orderIndex} onChange={e => setFormData({ ...formData, orderIndex: e.target.value })} />
                </div>
                <div className="col">
                  <label>Video URL (Youtube)</label>
                  <input className="inp" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label>Nội dung chi tiết</label>
                <textarea className="inp-area" rows="15" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Nhập nội dung bài giảng..." />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">LƯU BÀI GIẢNG</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}