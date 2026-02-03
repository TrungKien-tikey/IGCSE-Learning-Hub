import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  MessageSquare,
  ArrowLeft,
  Plus,
  Trash2,
  FileUp,
  CheckCircle,
  XCircle,
  Video,
  FileText,
  ListOrdered,
  Save,
  BookOpen,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import './LessonPage.css';

export default function LessonPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Trạng thái phần trăm tải lên

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    resourceUrl: '',
    resourceName: '',
    orderIndex: 1,
    meetingUrl: '', // MỚI
    startTime: ''   // MỚI
  });

  const API_URL = '/api/courses';
  const CLOUD_NAME = "dnssxbv0k";
  const UPLOAD_PRESET = "dnssxbv0k";

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      const res = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bài học:", err);
    }
  };

  // HÀM XỬ LÝ TẢI FILE NGAY KHI CHỌN
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`);

    // Theo dõi tiến độ
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    // Khi tải xong thành công
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        setFormData(prev => ({
          ...prev,
          resourceUrl: response.secure_url,
          resourceName: file.name
        }));
        setIsUploading(false);
      } else {
        alert("Lỗi tải file lên Cloudinary!");
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      alert("Lỗi kết nối mạng khi tải file.");
      setIsUploading(false);
    };

    xhr.send(data);
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLessonId(lesson.lessonId);
    setFormData({
      title: lesson.title || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      resourceUrl: lesson.resourceUrl || '',
      resourceName: lesson.resourceName || '',
      orderIndex: lesson.orderIndex,
      meetingUrl: lesson.meetingUrl || '', // MỚI
      startTime: lesson.startTime || ''   // MỚI
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleCreateNew = () => {
    setSelectedLessonId(null);
    setFormData({
      title: '', content: '', videoUrl: '', resourceUrl: '', resourceName: '',
      orderIndex: lessons.length + 1, meetingUrl: '', // MỚI
      startTime: ''   // MỚI
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleRemoveAttachment = () => {
    if (window.confirm("Xóa tài liệu đính kèm này?")) {
      setFormData(prev => ({ ...prev, resourceUrl: '', resourceName: '' }));
      setUploadProgress(0);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isUploading) {
      alert("Vui lòng đợi file tải lên hoàn tất!");
      return;
    }

    try {
      const payload = { ...formData };

      if (selectedLessonId) {
        await axiosClient.put(`${API_URL}/lessons/${selectedLessonId}`, payload);
      } else {
        await axiosClient.post(`${API_URL}/${courseId}/lessons`, payload);
      }

      await fetchLessons();
      alert("Đã lưu bài giảng thành công!");
      if (!selectedLessonId) handleCreateNew();
    } catch (err) {
      alert("Lỗi lưu dữ liệu bài học.");
    }
  };

  const handleDeleteLesson = async (e, lessonId) => {
    e.stopPropagation();
    if (window.confirm("Xóa bài học này?")) {
      try {
        await axiosClient.delete(`${API_URL}/lessons/${lessonId}`);
        fetchLessons();
        if (selectedLessonId === lessonId) handleCreateNew();
      } catch (err) {
        alert("Lỗi khi xóa.");
      }
    }
  };

  return (
    <div className="lp-dashboard-root">
      <header className="lp-glass-nav">
        <div className="nav-left">
          {/* SỬA TẠI ĐÂY: Dùng navigate(-1) để quay lại trang trước đó */}
          <button onClick={() => navigate(-1)} className="back-circle-btn" title="Quay lại">
            <ArrowLeft size={22} />
          </button>
          <div className="brand-box">
            <LayoutDashboard className="brand-icon" />
            <span className="brand-text">Lesson</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="chat-action-btn" onClick={() => navigate('/chat', { state: { courseId } })}>
            <MessageSquare size={20} />
            <span>Tin nhắn</span>
          </button>
          <div className="p-avatar-group">
            <div className="p-avatar-img">GV</div>
            <div className="p-avatar-info">
              <span className="p-name">Giáo viên</span>
              <span className="p-status">Online</span>
            </div>
          </div>
        </div>
      </header>

      <div className="lp-content-wrapper">
        <aside className="lp-sidebar-modern">
          <div className="sidebar-top-section">
            <h3 className="sidebar-heading"><BookOpen size={18} /> Giáo trình</h3>
            <button onClick={handleCreateNew} className="add-lesson-gradient">
              <Plus size={20} />
            </button>
          </div>

          <div className="lesson-nav-list">
            {lessons.map((l) => (
              <div
                key={l.lessonId}
                className={`lesson-nav-card ${selectedLessonId === l.lessonId ? 'active' : ''}`}
                onClick={() => handleSelectLesson(l)}
              >
                <div className="nav-card-prefix">{l.orderIndex}</div>
                <div className="nav-card-info">
                  <span className="nav-card-title">{l.title}</span>
                  <span className="nav-card-sub">Bài học chi tiết</span>
                </div>
                <button className="nav-card-del" onClick={(e) => handleDeleteLesson(e, l.lessonId)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="lp-editor-area">
          <div className="editor-glass-card">
            <div className="editor-heading">
              <div className="heading-icon-box"><FileText color="#fff" size={24} /></div>
              <div className="heading-text">
                <h2>{selectedLessonId ? 'Cập nhật nội dung' : 'Tạo mới bài giảng'}</h2>
                <p>Nội dung sẽ được tự động đồng bộ khi nhấn Lưu</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="modern-form">
              <div className="form-grid">
                <div className="form-item full-width">
                  <label>Tiêu đề bài học</label>
                  <div className="input-with-icon">
                    <BookOpen className="field-icon" />
                    <input
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tiêu đề..."
                      required
                    />
                  </div>
                </div>

                <div className="form-item">
                  <label>Thứ tự bài</label>
                  <div className="input-with-icon">
                    <ListOrdered className="field-icon" />
                    <input type="number" value={formData.orderIndex} onChange={e => setFormData({ ...formData, orderIndex: e.target.value })} />
                  </div>
                </div>

                <div className="form-item">
                  <label>Video Youtube</label>
                  <div className="input-with-icon">
                    <Video className="field-icon" />
                    <input value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="Link video..." />
                  </div>
                </div>
                {/* --- Link Google Drive (Lưu vào resourceUrl) --- */}
                <div className="form-item full-width">
                  <label>Link Google Drive (Nếu không dùng tệp tải lên)</label>
                  <div className="input-with-icon">
                    <BookOpen className="field-icon" />
                    <input
                      value={formData.resourceUrl}
                      onChange={e => {
                        // Nếu dán link drive thì tự đặt tên resourceName để dễ quản lý
                        setFormData({ ...formData, resourceUrl: e.target.value, resourceName: "Link Google Drive" });
                      }}
                      placeholder="Dán link folder/file Drive vào đây..."
                    />
                  </div>
                </div>

                {/* --- Link Google Meet --- */}
                <div className="form-item">
                  <label>Link Google Meet (Lớp trực tuyến)</label>
                  <div className="input-with-icon">
                    <Video className="field-icon" />
                    <input
                      value={formData.meetingUrl}
                      onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>

                {/* --- Thời gian bắt đầu học --- */}
                <div className="form-item">
                  <label>Thời gian bắt đầu học</label>
                  <div className="input-with-icon">
                    <ListOrdered className="field-icon" />
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-item full-width">
                  <div className="upload-container-modern">
                    <label className="upload-label">Tài liệu đính kèm</label>

                    {formData.resourceUrl ? (
                      <div className="active-file-card">
                        <div className="f-icon-box"><FileText size={24} /></div>
                        <div className="f-info">
                          <span className="f-name">{formData.resourceName}</span>
                        </div>
                        <button type="button" onClick={handleRemoveAttachment} className="f-delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className={`modern-drop-zone ${isUploading ? 'disabled' : ''}`}>
                        <FileUp size={32} className="drop-icon" />
                        <div className="drop-info">
                          <p>{isUploading ? `Đang tải lên... ${uploadProgress}%` : 'Nhấn để chọn tệp tải lên ngay'}</p>
                          <small>PDF, DOCX, ZIP (Max 10MB)</small>
                        </div>
                        <input type="file" onChange={handleFileChange} disabled={isUploading} />

                        {/* THANH TIẾN TRÌNH (PROGRESS BAR) */}
                        {isUploading && (
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-item full-width">
                  <label>Nội dung học tập</label>
                  <textarea rows="8" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                </div>
              </div>

              <div className="form-submit-bar">
                <button type="submit" className="save-btn-gradient" disabled={isUploading}>
                  <Save size={20} /> <span>Lưu nội dung</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}