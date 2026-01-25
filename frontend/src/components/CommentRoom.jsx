import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const CommentRoom = ({ examId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [resolvedUsername, setResolvedUsername] = useState("Người dùng");
    const [currentUserId, setCurrentUserId] = useState(null);

    const COMM_SERVICE_URL = "http://localhost:8000/api/v1/comments";
    const AUTH_SERVICE_URL = "http://localhost:8000/api/v1/auth"; 

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId || decoded.id || decoded.sub;
                setCurrentUserId(userId);
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchUserFromAuth = async () => {
            if (!currentUserId) return;
            try {
                const res = await axios.get(`${AUTH_SERVICE_URL}/users/${currentUserId}`);
                if (res.data && res.data.fullName) {
                    setResolvedUsername(res.data.fullName);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin:", err);
            }
        };

        fetchUserFromAuth();
        fetchComments();
    }, [currentUserId, examId]);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`${COMM_SERVICE_URL}/exam/${examId}`);
            setComments(res.data);
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        }
    };

    const handleSend = async () => {
        if (!newComment.trim() || !currentUserId) return;

        const commentData = {
            examId: examId,
            userId: currentUserId,
            username: resolvedUsername, // Gửi FullName đã lấy được
            content: newComment
        };

        try {
            await axios.post(COMM_SERVICE_URL, commentData);
            setNewComment(""); 
            fetchComments();   
        } catch (error) {
            alert("Lỗi kết nối server!");
        }
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner mt-4 max-h-[500px] flex flex-col border border-gray-200">
            <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 text-gray-700">Thảo luận bài thi</h4>
            
            <div className="space-y-3 mb-4 overflow-y-auto pr-2 flex-1">
                {comments.length === 0 ? (
                    <p className="text-gray-400 text-sm italic text-center py-4">Chưa có bình luận nào.</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                                {/* Hiển thị tên từ database, nếu null hiện "Học viên" */}
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
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
                > Gửi </button>
            </div>
        </div>
    );
};

export default CommentRoom;