import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient'; // Dùng axiosClient đã cấu hình
import './ChatPage.css'; // Tạo file css này ở dưới

// Giả lập lấy ID người đang đăng nhập (Thực tế lấy từ localStorage/Context)
const CURRENT_USER_ID = 1; 

export default function ChatPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Lấy courseId được truyền từ StudentLearningPage
    const { courseId, courseTitle } = location.state || {};

    const [participants, setParticipants] = useState([]); // Danh sách người trong khóa
    const [selectedUser, setSelectedUser] = useState(null); // Người đang chat cùng
    const [messages, setMessages] = useState([]); // Tin nhắn hiện tại
    const [inputMsg, setInputMsg] = useState('');
    const [socket, setSocket] = useState(null);

    // 1. Fetch danh sách người dùng trong khóa học
    useEffect(() => {
        if (!courseId) return;

        const fetchParticipants = async () => {
            try {
                // Gọi API tạo ở Bước 1
                const res = await axiosClient.get(`http://localhost:8079/api/courses/${courseId}/participants`);
                const userIds = res.data;

                // Lưu ý: API trên chỉ trả về ID. 
                // Ở đây ta giả lập map ID ra tên. Thực tế bạn cần gọi API User Service: POST /users/batch-info
                const mappedUsers = userIds.map(id => ({
                    userId: id,
                    name: id === 1 ? "Tôi" : (id === 2 ? "Giáo viên A" : `Học viên ${id}`),
                    role: id === 2 ? "Teacher" : "Student",
                    avatar: "https://via.placeholder.com/40"
                })).filter(u => u.userId !== CURRENT_USER_ID); // Loại bỏ chính mình khỏi danh sách chat

                setParticipants(mappedUsers);
            } catch (err) {
                console.error("Lỗi lấy danh sách lớp:", err);
            }
        };
        fetchParticipants();
    }, [courseId]);

    // 2. Kết nối WebSocket (Giữ nguyên logic cũ hoặc sửa lại theo STOMP)
    // Giả sử bạn dùng thư viện WebSocket chuẩn hoặc SockJS/Stomp
    useEffect(() => {
        if (!selectedUser) return;

        // Code kết nối Socket ở đây (tùy thuộc vào thư viện bạn dùng trong dự án)
        // Ví dụ logic load tin nhắn cũ:
        // axiosClient.get(`/chat/history/${selectedUser.userId}`)...
        
        // Mock tin nhắn mẫu để hiển thị giao diện
        setMessages([
            { senderId: selectedUser.userId, content: "Chào bạn, mình có thể giúp gì?" },
            { senderId: CURRENT_USER_ID, content: "Mình muốn hỏi về bài tập 2." }
        ]);

    }, [selectedUser]);

    const handleSendMessage = () => {
        if (!inputMsg.trim() || !selectedUser) return;
        
        const newMsg = { senderId: CURRENT_USER_ID, content: inputMsg };
        setMessages([...messages, newMsg]);
        
        // Gửi qua Socket: stompClient.send(...)
        
        setInputMsg('');
    };

    return (
        <div className="chat-container">
            {/* Header chung */}
            <div className="chat-header-bar">
                <button onClick={() => navigate(-1)}>⬅ Quay lại</button>
                <h3>Thảo luận: {courseTitle || "Khóa học chung"}</h3>
            </div>

            <div className="chat-body">
                {/* CỘT TRÁI: DANH SÁCH THÀNH VIÊN */}
                <div className="user-list-sidebar">
                    <div className="sidebar-title">Thành viên lớp học</div>
                    <div className="ul-scroll">
                        {participants.length === 0 && <p style={{padding:10}}>Đang tải...</p>}
                        {participants.map(user => (
                            <div 
                                key={user.userId} 
                                className={`user-item ${selectedUser?.userId === user.userId ? 'active' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <img src={user.avatar} alt="avt" className="u-avatar" />
                                <div className="u-info">
                                    <div className="u-name">{user.name}</div>
                                    <div className="u-role">{user.role}</div>
                                </div>
                                <div className="u-status">●</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CỘT PHẢI: KHUNG CHAT */}
                <div className="chat-window">
                    {selectedUser ? (
                        <>
                            <div className="cw-header">
                                <b>{selectedUser.name}</b> 
                                <span style={{fontSize: 12, color: '#888', marginLeft: 8}}>{selectedUser.role}</span>
                            </div>
                            
                            <div className="cw-messages">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`msg-row ${msg.senderId === CURRENT_USER_ID ? 'my-msg' : 'their-msg'}`}>
                                        <div className="msg-bubble">
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cw-input">
                                <input 
                                    type="text" 
                                    placeholder="Nhập tin nhắn..." 
                                    value={inputMsg}
                                    onChange={e => setInputMsg(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button onClick={handleSendMessage}>Gửi</button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat">
                            <p>Chọn một thành viên bên trái để bắt đầu trò chuyện 💬</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}