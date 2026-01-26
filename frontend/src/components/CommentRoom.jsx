import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../api/axiosClient'; // Đảm bảo đường dẫn này đúng với project của bạn

const CommentRoom = ({ examId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [resolvedUsername, setResolvedUsername] = useState("Người dùng");
    const [currentUserId, setCurrentUserId] = useState(null);

    // 1. Lấy thông tin User từ Token khi component load
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Ưu tiên lấy userId từ các trường phổ biến trong JWT
                const userId = decoded.userId || decoded.id || decoded.sub;
                setCurrentUserId(userId);

                // Thử lấy tên từ localStorage trước để hiển thị ngay lập tức
                const savedName = localStorage.getItem('fullName');
                if (savedName) {
                    setResolvedUsername(savedName);
                }
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
    }, []);

    // 2. Fetch thông tin chi tiết và danh sách bình luận
    useEffect(() => {
        const fetchUserFromAuth = async () => {
            if (!currentUserId) return;
            try {
                // Sử dụng axiosClient để có Header Authorization (tránh lỗi 403)
                const res = await axiosClient.get(`/auth/users/${currentUserId}`);
                if (res.data && res.data.fullName) {
                    setResolvedUsername(res.data.fullName);
                    localStorage.setItem('fullName', res.data.fullName); // Cập nhật lại cache
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin người dùng từ Auth Service:", err);
            }
        };

        fetchUserFromAuth();
        fetchComments();
    }, [currentUserId, examId]);

    // 3. Hàm tải danh sách bình luận
    const fetchComments = async () => {
        if (!examId) return;
        try {
            const res = await axiosClient.get(`/comments/exam/${examId}`);
            setComments(res.data);
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        }
    };

    // 4. Hàm gửi bình luận
    const handleSend = async () => {
        if (!newComment.trim() || !currentUserId) return;

        let senderName = resolvedUsername;

        // Kiểm tra lại tên một lần nữa trước khi gửi để tránh "Người dùng"
        if (senderName === "Người dùng") {
            const cachedName = localStorage.getItem('fullName');
            if (cachedName) {
                senderName = cachedName;
            } else {
                try {
                    const res = await axiosClient.get(`/auth/users/${currentUserId}`);
                    if (res.data && res.data.fullName) {
                        senderName = res.data.fullName;
                    }
                } catch (e) {
                    console.error("Không thể lấy tên thật, gửi bằng tên mặc định");
                }
            }
        }

        const commentData = {
            examId: examId,
            userId: currentUserId,
            username: senderName,
            content: newComment
        };

        try {
            await axiosClient.post('/comments', commentData);
            setNewComment(""); 
            fetchComments(); // Tải lại danh sách sau khi gửi thành công
        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
            alert("Không thể gửi bình luận. Vui lòng kiểm tra lại kết nối!");
        }
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner mt-4 max-h-[500px] flex flex-col border border-gray-200">
            <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 text-gray-700">💬 Thảo luận bài thi</h4>
            
            <div className="space-y-3 mb-4 overflow-y-auto pr-2 flex-1">
                {comments.length === 0 ? (
                    <p className="text-gray-400 text-sm italic text-center py-4">Chưa có bình luận nào.</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-blue-600 text-sm">
                                    {c.username && c.username !== "Người dùng" ? c.username : "Học viên"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ""}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm">{c.content}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2 bg-white p-2 rounded-lg border border-gray-300">
                <input 
                    className="flex-1 outline-none text-sm px-2"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Viết bình luận..."
                />
                <button 
                    onClick={handleSend}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors"
                > Gửi </button>
            </div>
        </div>
    );
};

export default CommentRoom;