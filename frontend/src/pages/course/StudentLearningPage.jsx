import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { PlayCircle, FileText, Bell, MessageSquare, CheckCircle } from 'lucide-react';
import './LessonPage.css';

export default function StudentLearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // 1. Lấy thông tin User
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || "STUDENT";
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || "";

    // 2. States
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [courseTitle, setCourseTitle] = useState("Đang tải...");
    const [completedLessons, setCompletedLessons] = useState([]); // State lưu danh sách ID bài đã học

    const API_URL = '/courses';

    // 3. Hàm xử lý thoát
    const handleExit = () => {
        if (role === 'MANAGER' || role === 'ADMIN') {
            navigate('/course-approval');
        } else if (role === 'TEACHER') {
            navigate('/teacher-courses');
        } else {
            navigate('/my-courses');
        }
    };

    // 4. Hàm chuyển bài học
    const handleLessonChange = (lesson) => {
        setCurrentLesson(lesson);
        // Cuộn lên đầu trang khi đổi bài
        window.scrollTo(0, 0);
    };

    // 5. Hàm lấy tiến độ (Các bài đã học)
    const fetchProgress = async () => {
        if (!userId) return;
        try {
            const res = await axiosClient.get(`${API_URL}/${courseId}/lessons/completed-ids`);
            // Ép kiểu sang Number
            const ids = (res.data || []).map(id => Number(id));
            setCompletedLessons(ids);
        } catch (err) {
            console.error("Lỗi lấy tiến độ:", err);
        }
    };

    // 6. useEffect khởi tạo dữ liệu
    useEffect(() => {
        const initData = async () => {
            try {
                // a. Lấy thông tin khóa học để hiện tên
                const courseRes = await axiosClient.get(`${API_URL}/${courseId}`);
                setCourseTitle(courseRes.data.title);

                // b. Lấy danh sách bài học
                const res = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
                const lessonList = res.data;
                setLessons(lessonList);

                // c. Chọn bài đầu tiên nếu chưa chọn
                if (lessonList.length > 0 && !currentLesson) {
                    setCurrentLesson(lessonList[0]);
                }

                // d. Tải tiến độ (Nếu là học sinh)
                if (userId && userRole === 'STUDENT') {
                    await fetchProgress();
                }

            } catch (error) {
                console.error("Lỗi khởi tạo dữ liệu:", error);
                // Xử lý lỗi 401/403
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error("Bạn chưa tham gia khóa học này!");
                    navigate('/my-courses');
                } else {
                    toast.error("Không thể tải nội dung khóa học");
                }
            }
        };

        initData();
    }, [courseId, userId]);

    // 7. Xử lý đánh dấu hoàn thành
    const handleMarkAsComplete = async () => {
        if (!currentLesson) return;
        try {
            await axiosClient.post(`${API_URL}/${courseId}/lessons/${currentLesson.lessonId}/complete`);
            
            // Cập nhật state ngay lập tức (Thêm ID bài hiện tại vào mảng)
            setCompletedLessons(prev => [...prev, Number(currentLesson.lessonId)]);
            
            toast.success("Đã hoàn thành bài học!");
            
            // Tự động chuyển bài tiếp theo sau 1s (Optional)
            // setTimeout(() => handleNextLesson(), 1000);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi lưu trạng thái");
        }
    };

    // 8. Logic điều hướng Next / Previous
    const getCurrentIndex = () => lessons.findIndex(l => l.lessonId === currentLesson?.lessonId);
    
    const handleNextLesson = () => {
        const index = getCurrentIndex();
        if (index < lessons.length - 1) {
            handleLessonChange(lessons[index + 1]);
        }
    };

    const handlePrevLesson = () => {
        const index = getCurrentIndex();
        if (index > 0) {
            handleLessonChange(lessons[index - 1]);
        }
    };

    // 9. Helper Youtube
    const getEmbedUrl = (url) => {
        if (!url) return null;
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^&?]*))/);
        return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
    };

    const handleOpenChat = () => {
        navigate('/chat', { state: { courseId, courseTitle } });
    };

    return (
        <div className="lp-container">
            {/* HEADER */}
            <header className="lp-header">
                <div className="lp-brand">
                    <button onClick={handleExit} className="btn-back">⬅ Thoát</button>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                        <span className="lp-course-name">{courseTitle}</span>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {userRole}: {user.fullName || "User"}
                        </span>
                    </div>
                </div>

                <div className="lp-tools">
                    <div className="icon-btn" title="Thảo luận" onClick={handleOpenChat}>
                        <MessageSquare size={20} />
                    </div>
                    <div className="user-info">
                        <div className="avatar" style={{ background: '#2196f3' }}>HV</div>
                    </div>
                </div>
            </header>

            {/* BODY */}
            <div className="lp-body">
                {/* SIDEBAR */}
                <aside className="lp-sidebar">
                    <div className="sidebar-top">
                        <h3>NỘI DUNG BÀI HỌC</h3>
                    </div>
                    <div className="lesson-list">
                        {lessons.map((lesson) => {
                            const isCompleted = completedLessons.includes(Number(lesson.lessonId));
                            return (
                                <div
                                    key={lesson.lessonId}
                                    className={`lesson-item ${currentLesson?.lessonId === lesson.lessonId ? 'active' : ''}`}
                                    onClick={() => handleLessonChange(lesson)}
                                >
                                    <div className="icon-status">
                                        {isCompleted ? (
                                            <span style={{ color: 'green', fontWeight: 'bold' }}>✓</span>
                                        ) : (
                                            <span className="circle-placeholder">○</span>
                                        )}
                                    </div>
                                    <div className="lesson-title">{lesson.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="lp-content" style={{ background: '#fff' }}>
                    <div className="paper" style={{ boxShadow: 'none', padding: '0 40px' }}>
                        {currentLesson ? (
                            <>
                                <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                    {currentLesson.title}
                                </h1>

                                {/* Video */}
                                {currentLesson.videoUrl && (
                                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
                                        <iframe
                                            width="100%" height="100%"
                                            src={getEmbedUrl(currentLesson.videoUrl)}
                                            title="Video bài giảng" frameBorder="0" allowFullScreen
                                        ></iframe>
                                    </div>
                                )}

                                {/* Content Text */}
                                <div className="lesson-content-text" style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#444' }}>
                                    {currentLesson.content ? (
                                        currentLesson.content.split('\n').map((para, idx) => (
                                            <p key={idx} style={{ marginBottom: '15px' }}>{para}</p>
                                        ))
                                    ) : (
                                        <p style={{ fontStyle: 'italic', color: '#888' }}>Không có nội dung văn bản.</p>
                                    )}
                                </div>

                                {/* Nút Hoàn thành bài học */}
                                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                    {!completedLessons.includes(Number(currentLesson.lessonId)) ? (
                                        <button 
                                            onClick={handleMarkAsComplete}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '1rem',
                                                backgroundColor: '#4caf50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <CheckCircle size={20}/> Đánh dấu đã học xong
                                        </button>
                                    ) : (
                                        <button disabled style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#e0e0e0',
                                            color: '#888',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'not-allowed'
                                        }}>
                                            ✓ Đã hoàn thành
                                        </button>
                                    )}
                                </div>

                                {/* Nav Buttons */}
                                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                    <button 
                                        className="btn-nav" 
                                        onClick={handlePrevLesson}
                                        disabled={getCurrentIndex() === 0}
                                        style={{ opacity: getCurrentIndex() === 0 ? 0.5 : 1 }}
                                    >
                                        ← Bài trước
                                    </button>
                                    
                                    <button 
                                        className="btn-nav" 
                                        onClick={handleNextLesson}
                                        disabled={getCurrentIndex() === lessons.length - 1}
                                        style={{ 
                                            background: '#2196f3', color: 'white', border: 'none',
                                            opacity: getCurrentIndex() === lessons.length - 1 ? 0.5 : 1 
                                        }}
                                    >
                                        Bài tiếp theo →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                                <h3>Đang tải nội dung...</h3>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}