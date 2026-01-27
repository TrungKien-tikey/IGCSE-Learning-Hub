import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { PlayCircle, FileText, Bell, MessageSquare, LogOut } from 'lucide-react';
import './LessonPage.css'; // <--- QUAN TRỌNG: Dùng chung CSS với trang Giáo viên

export default function StudentLearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [courseTitle, setCourseTitle] = useState("Đang tải...");

    // Lấy role hoặc tên user từ storage để hiển thị (cho xịn)
    const userRole = localStorage.getItem('userRole') || "Student";

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
            // Nếu lỗi 401 hoặc 403 (Không có quyền truy cập khóa học này)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert("Bạn chưa mua khóa học này hoặc phiên đăng nhập hết hạn!");
                navigate('/my-courses');
            }
        }
    };

    // Hàm xử lý link Youtube (Chuyển watch?v= thành embed/)
    const getEmbedUrl = (url) => {
        if (!url) return null;
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^&?]*))/);
        return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
    };
    const handleOpenChat = () => {
        // Chuyển hướng sang trang /chat
        // Truyền kèm state (courseId và title) để trang Chat biết cần load danh sách nào
        navigate('/chat', {
            state: {
                courseId: courseId,
                courseTitle: courseTitle
            }
        });
    };

    return (
        <div className="lp-container">
            {/* --- 1. HEADER (Giống hệt trang Giáo viên) --- */}
            <header className="lp-header">
                <div className="lp-brand">
                    <button onClick={() => navigate('/my-courses')} className="btn-back">⬅ Thoát</button>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                        <span className="lp-course-name" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{courseTitle}</span>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Học viên: An Nguyen</span>
                    </div>
                </div>

                {/* Các icon chức năng */}
                <div className="lp-tools">
                    <div
                        className="icon-btn"
                        title="Thảo luận cùng lớp"
                        onClick={handleOpenChat}
                        style={{ cursor: 'pointer' }} // Thêm con trỏ tay để biết là nút bấm
                    >
                        <MessageSquare size={20} />
                    </div>
                    <div className="user-info">
                        <div className="avatar" style={{ background: '#2196f3' }}>HV</div>
                    </div>
                </div>
            </header>

            {/* --- 2. BODY (Chia 2 cột) --- */}
            <div className="lp-body">

                {/* CỘT TRÁI: SIDEBAR (MỤC LỤC) */}
                <aside className="lp-sidebar">
                    <div className="sidebar-top">
                        <h3>NỘI DUNG BÀI HỌC</h3>
                        {/* Không có nút Thêm bài mới ở đây */}
                    </div>
                    <div className="lesson-list">
                        {lessons.map((l) => (
                            <div
                                key={l.lessonId}
                                className={`lesson-item ${currentLesson?.lessonId === l.lessonId ? 'active' : ''}`}
                                onClick={() => setCurrentLesson(l)}
                            >
                                {/* Số thứ tự */}
                                <span className="idx">#{l.orderIndex}</span>

                                {/* Tên bài */}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <span className="txt">{l.title}</span>
                                    <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {l.videoUrl ? <PlayCircle size={12} /> : <FileText size={12} />}
                                        {l.videoUrl ? 'Video' : 'Bài đọc'}
                                    </div>
                                </div>

                                {/* Checkbox đã học xong (Giả lập) */}
                                <input type="checkbox" checked={false} onChange={() => { }} style={{ cursor: 'pointer' }} title="Đánh dấu đã học" />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* CỘT PHẢI: MÀN HÌNH HỌC (VIEWER) */}
                {/* Thay thế Form nhập liệu bằng giao diện hiển thị */}
                <main className="lp-content" style={{ background: '#fff' }}> {/* Nền trắng giống giấy */}
                    <div className="paper" style={{ boxShadow: 'none', padding: '0 40px' }}>

                        {currentLesson ? (
                            <>
                                {/* 1. Tiêu đề lớn */}
                                <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                    {currentLesson.title}
                                </h1>

                                {/* 2. Video Player (Nếu có) */}
                                {currentLesson.videoUrl && (
                                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={getEmbedUrl(currentLesson.videoUrl)}
                                            title="Video bài giảng"
                                            frameBorder="0"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}

                                {/* 3. Nội dung văn bản (Content) */}
                                <div className="lesson-content-text" style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#444' }}>
                                    {currentLesson.content ? (
                                        currentLesson.content.split('\n').map((para, idx) => (
                                            <p key={idx} style={{ marginBottom: '15px' }}>{para}</p>
                                        ))
                                    ) : (
                                        <p style={{ fontStyle: 'italic', color: '#888' }}>Không có nội dung văn bản cho bài này.</p>
                                    )}
                                </div>

                                {/* 4. Nút điều hướng bài tiếp theo */}
                                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                    <button className="btn-nav" disabled>Bài trước</button>
                                    <button className="btn-nav" style={{ background: '#2196f3', color: 'white', border: 'none' }}>Bài tiếp theo →</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                                <h3>Chọn một bài học từ menu bên trái để bắt đầu.</h3>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}