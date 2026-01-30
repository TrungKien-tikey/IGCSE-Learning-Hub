import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { purchaseCourse } from '../../api/paymentService'; // Import payment API
import './CourseDetailPage.css'; // File CSS ở bước 3

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false); // Trạng thái: Đã mua hay chưa?
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // User info

    // GIẢ LẬP ID USER (Sau này lấy từ localStorage)
    const API_URL = '/courses';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy thông tin khóa học (Public)
                const courseRes = await axiosClient.get(`${API_URL}/${courseId}`);
                setCourse(courseRes.data);

                // 2. Lấy danh sách bài học (Public hoặc Protected tùy logic backend)
                const lessonRes = await axiosClient.get(`${API_URL}/${courseId}/lessons`);
                setLessons(lessonRes.data);

                // 3. Kiểm tra đăng ký (CẦN TOKEN)
                try {
                    // Gọi API check-enrollment kiểu mới (Header)
                    const checkRes = await axiosClient.get(`${API_URL}/${courseId}/check-enrollment`);
                    setIsEnrolled(checkRes.data); // true/false
                } catch (e) {
                    console.log("Lỗi check enrollment (có thể do chưa đăng nhập hoặc token hết hạn)");
                    // Không làm gì cả, cứ để isEnrolled = false
                }

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Fetch User Info for Payment
        const fetchUser = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const res = await axiosClient.get('/users/me');
                    setCurrentUser(res.data);
                } catch (e) {
                    console.error("Error fetching user", e);
                }
            }
        };
        fetchUser();
    }, [courseId]);

    // Xử lý khi bấm nút Đăng Ký
    const handleEnroll = async () => {
        // 1. Lấy Token
        const token = localStorage.getItem('accessToken');

        if (!token) {
            toast.warning("Vui lòng đăng nhập để mua khóa học!");
            navigate('/login');
            return;
        }

        try {
            if (window.confirm(`Bạn có muốn đăng ký khóa học "${course.title}" với giá ${course.price > 0 ? `${Number(course.price).toLocaleString('vi-VN')} ₫` : 'miễn phí'}?`)) {

                // 2. Logic thanh toán
                const paymentData = {
                    studentId: currentUser?.userId || currentUser?.id, // Fallback ID
                    studentName: currentUser?.fullName || currentUser?.username || "Student",
                    courseId: course.id || course.courseId,
                    teacherId: course.teacherId || 1, // Default teacher ID if missing (mock)
                    amount: course.price,
                    paymentMethod: "BANK_TRANSFER"
                };

                const result = await purchaseCourse(paymentData);

                if (result.success) {
                    toast.success(result.message);
                    // Alert Payment Info
                    alert(`Vui lòng chuyển khoản ${Number(course.price).toLocaleString('vi-VN')} ₫ đến STK: 123456789 (Vietcombank)\nNội dung: "KHOA HOC ${result.transactionId}"\n\nAdmin sẽ kích hoạt khóa học sau khi nhận được thanh toán.`);
                    // Note: isEnrolled remains false until confirmed by Admin. 
                    // Ideally should show "Pending" status.
                } else {
                    // Nếu amount = 0 hoặc logic khác
                    setIsEnrolled(true);
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                navigate('/login');
            } else {
                toast.error("Lỗi đăng ký: " + (err.response?.data || "Có lỗi xảy ra"));
            }
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
                                <span className="price-current">{course.price > 0 ? `${Number(course.price).toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</span>
                                {course.price > 0 && <span className="price-original">{Number(course.price * 1.5).toLocaleString('vi-VN')} ₫</span>}
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