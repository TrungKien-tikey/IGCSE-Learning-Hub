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
  MonitorPlay
} from 'lucide-react';
import './LessonPage.css'; 

export default function StudentLearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [courseTitle, setCourseTitle] = useState("Đang tải...");

    const API_URL = '/courses';

    useEffect(() => {
        fetchCourseAndLessons();
    }, [courseId]);

    const fetchCourseAndLessons = async () => {
        try {
            // 1. Lấy thông tin khóa học
            const courseRes = await axiosClient.get(`${API_URL}/${courseId}`);
            setCourseTitle(courseRes.data.title);

            // 2. Lấy danh sách bài học
            const lessonRes = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
            setLessons(lessonRes.data);

            if (lessonRes.data.length > 0) {
                setCurrentLesson(lessonRes.data[0]);
            }
        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert("Bạn chưa có quyền truy cập khóa học này!");
                navigate('/my-courses');
            }
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
        // Tự động cuộn lên đầu nội dung khi đổi bài
        const contentArea = document.querySelector('.lp-editor-area');
        if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="lp-dashboard-root">
            {/* HEADER - GLASSMORPHISM STYLE */}
            <header className="lp-glass-nav">
                <div className="nav-left">
                    <button onClick={() => navigate('/my-courses')} className="back-circle-btn" title="Quay lại">
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
                        <div className="p-avatar-img student-avatar">HV</div>
                        <div className="p-avatar-info">
                            <span className="p-name">Học viên</span>
                            <span className="p-status">Đang học tập</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="lp-content-wrapper">
                {/* SIDEBAR MỤC LỤC BÀI HỌC */}
                <aside className="lp-sidebar-modern student-sidebar">
                    <div className="sidebar-top-section">
                        <h3 className="sidebar-heading"><BookOpen size={18} /> Lộ trình học</h3>
                    </div>
                    
                    <div className="lesson-nav-list">
                        {lessons.map((l) => (
                            <div
                                key={l.lessonId}
                                className={`lesson-nav-card ${currentLesson?.lessonId === l.lessonId ? 'active' : ''}`}
                                onClick={() => handleSelectLesson(l)}
                            >
                                <div className="nav-card-prefix">{l.orderIndex}</div>
                                <div className="nav-card-info">
                                    <span className="nav-card-title">{l.title}</span>
                                    <div className="student-lesson-type">
                                        {l.videoUrl ? <MonitorPlay size={12} /> : <FileText size={12} />}
                                        <span>{l.videoUrl ? 'Video bài giảng' : 'Tài liệu đọc'}</span>
                                    </div>
                                </div>
                                <ChevronRight className="chevron-icon" size={16} />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH */}
                <main className="lp-editor-area student-learning-area">
                    {currentLesson ? (
                        <div className="editor-glass-card student-card">
                            <div className="student-lesson-header">
                                <h1 className="lesson-main-title">{currentLesson.title}</h1>
                                <div className="lesson-meta-badge">
                                    Bài soạn {currentLesson.orderIndex}
                                </div>
                            </div>

                            {/* HIỂN THỊ VIDEO */}
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

                            {/* HIỂN THỊ TÀI LIỆU ĐÍNH KÈM */}
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

                            {/* NỘI DUNG CHỮ - CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU */}
                            {currentLesson.content && (
                                <div className="student-text-content">
                                    {currentLesson.content.split('\n').map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            )}
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