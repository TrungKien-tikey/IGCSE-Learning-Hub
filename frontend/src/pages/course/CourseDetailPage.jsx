import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetailPage.css'; // File CSS ở bước 3

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false); // Trạng thái: Đã mua hay chưa?
    const [loading, setLoading] = useState(true);

    // GIẢ LẬP ID USER (Sau này lấy từ localStorage)
    const currentUserId = 1;
    const API_URL = 'http://localhost:8079/api/courses';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy thông tin khóa học
                const courseRes = await axios.get(`${API_URL}/${courseId}`);
                setCourse(courseRes.data);

                // 2. Lấy danh sách bài học (Mục lục)
                const lessonRes = await axios.get(`${API_URL}/${courseId}/lessons`);
                setLessons(lessonRes.data);

                // 3. Kiểm tra xem user này đã mua chưa
                const checkRes = await axios.get(`${API_URL}/${courseId}/check-enrollment?userId=${currentUserId}`);
                setIsEnrolled(checkRes.data); // true hoặc false

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    // Xử lý khi bấm nút Đăng Ký
    const handleEnroll = async () => {
        if (!currentUserId) {
            alert("Vui lòng đăng nhập để mua khóa học!");
            navigate('/'); // Chuyển về login
            return;
        }

        try {
            if (window.confirm(`Bạn có muốn đăng ký khóa học "${course.title}" với giá $${course.price}?`)) {
                await axios.post(`${API_URL}/${courseId}/enroll?userId=${currentUserId}`);
                alert("🎉 Đăng ký thành công! Chào mừng bạn vào học.");
                setIsEnrolled(true); // Đổi trạng thái nút bấm ngay lập tức
            }
        } catch (err) {
            alert("Lỗi đăng ký: " + (err.response?.data || err.message));
        }
    };

    // Xử lý khi bấm nút Vào Học
    const handleStartLearning = () => {
        navigate(`/learning/${courseId}`); // Chuyển sang trang StudentLearningPage
    };

    if (loading) return <div className="loading-screen">Đang tải thông tin khóa học...</div>;
    if (!course) return <div className="error-screen">Không tìm thấy khóa học!</div>;

    return (
        <div className="detail-page">
            {/* --- BANNER HEADER --- */}
            <div className="detail-header">
                <div className="container header-content">
                    <div className="header-text">
                        <span className="badge-cat">IGCSE Math</span>
                        <h1>{course.title}</h1>
                        <p className="desc">{course.description || "Khóa học chất lượng cao dành cho học sinh IGCSE, bám sát chương trình chuẩn Cambridge."}</p>
                        <div className="meta-info">
                            <span>⭐ 4.8 (120 đánh giá)</span>
                            <span>👨‍🏫 Giáo viên: Nguyễn Văn A</span>
                            <span>📅 Cập nhật: 2024</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BODY --- */}
            <div className="container detail-body">

                {/* CỘT TRÁI: Nội dung chi tiết */}
                <div className="left-col">
                    <div className="section box-shadow">
                        <h3>Bạn sẽ học được gì?</h3>
                        <ul className="learning-outcomes">
                            <li>✅ Nắm vững kiến thức toán IGCSE cốt lõi</li>
                            <li>✅ Giải quyết các bài toán khó với phương pháp đơn giản</li>
                            <li>✅ Luyện tập với kho đề thi thử phong phú</li>
                            <li>✅ Tự tin đạt điểm A* trong kỳ thi sắp tới</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h3>Nội dung khóa học</h3>
                        <div className="course-stats-bar">
                            <span>📚 {lessons.length} bài giảng</span>
                            <span>⏳ Thời lượng: {course.duration}</span>
                        </div>

                        <div className="syllabus-list">
                            {lessons.length > 0 ? lessons.map((lesson, index) => (
                                <div key={lesson.lessonId} className="syllabus-item">
                                    <div className="lesson-icon">▶</div>
                                    <div className="lesson-info">
                                        <span className="lesson-idx">Bài {lesson.orderIndex}</span>
                                        <span className="lesson-name">{lesson.title}</span>
                                    </div>
                                    {/* Nếu chưa mua thì hiện cái ổ khóa */}
                                    {!isEnrolled && <span className="lock-icon">🔒</span>}
                                </div>
                            )) : <p>Chưa có bài học nào được cập nhật.</p>}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Card Mua Hàng (Sticky) */}
                <div className="right-col">
                    <div className="enroll-card box-shadow">
                        <div className="preview-video">
                            <div className="play-btn">▶</div>
                            <span>Xem giới thiệu</span>
                        </div>
                        <div className="card-content">
                            <div className="price-row">
                                <span className="price-current">{course.price > 0 ? `$${course.price}` : 'Miễn phí'}</span>
                                {course.price > 0 && <span className="price-original">${course.price * 1.5}</span>}
                            </div>

                            {/* LOGIC NÚT BẤM QUAN TRỌNG */}
                            {isEnrolled ? (
                                <button onClick={handleStartLearning} className="btn-main btn-learning">
                                    🚀 VÀO HỌC NGAY
                                </button>
                            ) : (
                                <button onClick={handleEnroll} className="btn-main btn-buy">
                                    ĐĂNG KÝ NGAY
                                </button>
                            )}

                            <p className="guarantee-text">Hoàn tiền trong 30 ngày nếu không hài lòng</p>

                            <div className="features-list">
                                <p><strong>Khóa học bao gồm:</strong></p>
                                <ul>
                                    <li>📺 Video bài giảng Full HD</li>
                                    <li>📝 Bài tập thực hành mỗi chương</li>
                                    <li>📱 Truy cập trên Mobile và Web</li>
                                    <li>🏆 Chứng chỉ hoàn thành</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}