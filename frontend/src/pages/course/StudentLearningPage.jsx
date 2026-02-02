import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { 
  PlayCircle, 
  FileText, 
  MessageSquare, 
  ArrowLeft, 
  Download, 
  FileBox, 
  ChevronRight,
  BookOpen,
  MonitorPlay,
  CheckCircle, 
  CheckSquare
} from 'lucide-react';
import './LessonPage.css'; 

export default function StudentLearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [courseTitle, setCourseTitle] = useState("Đang tải...");
    const [completedLessonIds, setCompletedLessonIds] = useState([]);

    const API_URL = '/courses';

    useEffect(() => {
        fetchCourseAndLessons();
        fetchCompletedStatus();
    }, [courseId]);

    const fetchCourseAndLessons = async () => {
        try {
            const courseRes = await axiosClient.get(`${API_URL}/${courseId}`);
            setCourseTitle(courseRes.data.title);

            const lessonRes = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
            setLessons(lessonRes.data);

            if (lessonRes.data.length > 0) {
                setCurrentLesson(lessonRes.data[0]);
            }
        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert("Bạn chưa có quyền truy cập khóa học này!");
                // Nếu lỗi quyền truy cập, cũng dùng logic back thông minh hoặc về trang chủ
                navigate('/');
            }
        }
    };

    const fetchCompletedStatus = async () => {
        try {
            const res = await axiosClient.get(`${API_URL}/${courseId}/lessons/completed-ids`);
            setCompletedLessonIds(res.data);
        } catch (error) {
            console.error("Lỗi khi tải trạng thái bài học:", error);
        }
    };

    const handleMarkAsComplete = async () => {
        if (!currentLesson) return;
        try {
            await axiosClient.post(`${API_URL}/${courseId}/lessons/${currentLesson.lessonId}/complete`);
            if (!completedLessonIds.includes(currentLesson.lessonId)) {
                setCompletedLessonIds([...completedLessonIds, currentLesson.lessonId]);
            }
        } catch (error) {
            console.error("Lỗi khi lưu tiến độ:", error);
            alert("Có lỗi xảy ra khi lưu tiến độ.");
        }
    };

    // --- HÀM XỬ LÝ NÚT THOÁT THÔNG MINH ---
    const handleBack = () => {
        const role = localStorage.getItem('userRole'); // Lấy role từ LocalStorage

        if (role === 'ADMIN') {
            // Admin quay về trang quản lý khóa học (AdminDashboard) hoặc danh sách tất cả khóa
            navigate('/admin/dashboard'); 
        } else if (role === 'MANAGER') {
            // Manager quay về trang duyệt bài hoặc thống kê
            navigate('/course-approval'); 
        } else if (role === 'TEACHER') {
             // Giáo viên có thể muốn về Dashboard giáo viên hoặc trang khóa học của tôi
            navigate('/teacher-dashboard');
        } else {
            // Học sinh (hoặc mặc định) về trang khóa học của tôi
            navigate('/my-courses');
        }
    };

    const getDownloadLink = (url) => {
        if (!url) return "#";
        if (url.includes("cloudinary.com")) {
            return url.replace("/upload/", "/upload/fl_attachment/");
        }
        return url;
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return null;
    };

    const handleOpenChat = () => {
        navigate('/chat', {
            state: { courseId, courseTitle }
        });
    };

    const handleSelectLesson = (lesson) => {
        setCurrentLesson(lesson);
        const contentArea = document.querySelector('.lp-editor-area');
        if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isCurrentLessonCompleted = currentLesson && completedLessonIds.includes(currentLesson.lessonId);

    return (
        <div className="lp-dashboard-root">
            <header className="lp-glass-nav">
                <div className="nav-left">
                    {/* Sửa onClick gọi hàm handleBack thay vì navigate cứng */}
                    <button onClick={handleBack} className="back-circle-btn" title="Quay lại">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="brand-box">
                        <span className="brand-text student-brand">{courseTitle}</span>
                    </div>
                </div>

                <div className="nav-right">
                    <button className="chat-action-btn" onClick={handleOpenChat}>
                        <MessageSquare size={20} />
                        <span>Tin nhắn</span>
                    </button>
                    <div className="p-avatar-group">
                        <div className="p-avatar-img student-avatar">Use</div>
                        <div className="p-avatar-info">
                            <span className="p-name">Người dùng</span>
                            <span className="p-status">Đang xem</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="lp-content-wrapper">
                <aside className="lp-sidebar-modern student-sidebar">
                    <div className="sidebar-top-section">
                        <h3 className="sidebar-heading"><BookOpen size={18} /> Lộ trình học</h3>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Đã hoàn thành: {completedLessonIds.length}/{lessons.length} bài
                        </div>
                    </div>
                    
                    <div className="lesson-nav-list">
                        {lessons.map((l) => {
                            const isCompleted = completedLessonIds.includes(l.lessonId);
                            return (
                                <div
                                    key={l.lessonId}
                                    className={`lesson-nav-card ${currentLesson?.lessonId === l.lessonId ? 'active' : ''}`}
                                    onClick={() => handleSelectLesson(l)}
                                >
                                    <div className={`nav-card-prefix ${isCompleted ? 'completed-tick' : ''}`} 
                                         style={isCompleted ? { background: '#10b981', color: 'white', borderColor: '#10b981' } : {}}>
                                        {isCompleted ? <CheckCircle size={14} /> : l.orderIndex}
                                    </div>

                                    <div className="nav-card-info">
                                        <span className="nav-card-title" style={isCompleted ? { color: '#059669' } : {}}>
                                            {l.title}
                                        </span>
                                        <div className="student-lesson-type">
                                            {l.videoUrl ? <MonitorPlay size={12} /> : <FileText size={12} />}
                                            <span>{l.videoUrl ? 'Video bài giảng' : 'Tài liệu đọc'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="chevron-icon" size={16} />
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <main className="lp-editor-area student-learning-area">
                    {currentLesson ? (
                        <div className="editor-glass-card student-card">
                            <div className="student-lesson-header">
                                <h1 className="lesson-main-title">{currentLesson.title}</h1>
                                <div className={`lesson-meta-badge ${isCurrentLessonCompleted ? 'completed-badge' : ''}`}
                                     style={isCurrentLessonCompleted ? { background: '#d1fae5', color: '#065f46' } : {}}>
                                    {isCurrentLessonCompleted ? 'Đã hoàn thành' : `Bài soạn ${currentLesson.orderIndex}`}
                                </div>
                            </div>

                            {currentLesson.videoUrl && (
                                <div className="student-video-container">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getEmbedUrl(currentLesson.videoUrl)}
                                        title="Video bài giảng"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {currentLesson.resourceUrl && (
                                <div className="student-attachment-box">
                                    <div className="attachment-info-group">
                                        <div className="attachment-icon">
                                            <FileBox size={24} />
                                        </div>
                                        <div className="attachment-texts">
                                            <span className="attachment-name">
                                                {currentLesson.resourceName || "Tai-lieu-hoc-tap.pdf"}
                                            </span>
                                            <span className="attachment-sub">Tệp đính kèm bài học (nhấn để tải)</span>
                                        </div>
                                    </div>
                                    
                                    <a 
                                        href={getDownloadLink(currentLesson.resourceUrl)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        download={currentLesson.resourceName || "document"}
                                        className="student-dl-btn"
                                    >
                                        <Download size={18} />
                                        <span>Tải tài liệu</span>
                                    </a>
                                </div>
                            )}

                            {currentLesson.content && (
                                <div className="student-text-content">
                                    {currentLesson.content.split('\n').map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            )}

                            <div className="lesson-completion-section" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                                <button 
                                    className={`mark-complete-btn ${isCurrentLessonCompleted ? 'completed' : ''}`}
                                    onClick={handleMarkAsComplete}
                                    disabled={isCurrentLessonCompleted}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: isCurrentLessonCompleted ? 'default' : 'pointer',
                                        background: isCurrentLessonCompleted ? '#10b981' : '#2563eb',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        opacity: isCurrentLessonCompleted ? 0.9 : 1
                                    }}
                                >
                                    {isCurrentLessonCompleted ? <CheckCircle size={20} /> : <CheckSquare size={20} />}
                                    {isCurrentLessonCompleted ? 'Bạn đã hoàn thành bài này' : 'Đánh dấu hoàn thành'}
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="student-empty-state">
                            <BookOpen size={60} />
                            <h2>Sẵn sàng để bắt đầu?</h2>
                            <p>Hãy chọn một bài học từ menu bên trái để bắt đầu khám phá kiến thức mới.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}