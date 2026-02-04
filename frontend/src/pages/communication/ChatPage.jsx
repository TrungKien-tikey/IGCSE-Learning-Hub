import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { jwtDecode } from 'jwt-decode';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Info, ChevronLeft } from 'lucide-react'; 
import './ChatPage.css';

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return str.replace(/\s+/g, '');
};

const isFuzzyMatch = (text, search) => {
    const normalizedText = removeVietnameseTones(text);
    const normalizedSearch = removeVietnameseTones(search);
    if (!normalizedSearch) return true;
    if (normalizedText.includes(normalizedSearch)) return true;
    let searchIndex = 0;
    for (let i = 0; i < normalizedText.length; i++) {
        if (normalizedText[i] === normalizedSearch[searchIndex]) searchIndex++;
        if (searchIndex === normalizedSearch.length) return true;
    }
    return false;
};

export default function ChatPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const { courseId, courseTitle } = location.state || {};

    const [currentUserId, setCurrentUserId] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileChatActive, setIsMobileChatActive] = useState(false);

    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUserId(decoded.userId || decoded.id || decoded.sub);
            } catch (error) { navigate('/login'); }
        } else { navigate('/login'); }
    }, [navigate]);

    useEffect(() => {
        if (!courseId || !currentUserId) return;
        const fetchParticipants = async () => {
            try {
                const resIds = await axiosClient.get(`/api/courses/${courseId}/participants`);
                const userIds = resIds.data;
                const userPromises = userIds.map(async (id) => {
                    if (String(id) === String(currentUserId)) return null;
                    try {
                        const userRes = await axiosClient.get(`/api/users/${id}`);
                        return {
                            userId: id,
                            name: userRes.data.fullName || userRes.data.username || `User ${id}`,
                            role: userRes.data.role || "Member",
                            avatar: DEFAULT_AVATAR
                        };
                    } catch (err) {
                        return { userId: id, name: `User ${id}`, role: "Member", avatar: DEFAULT_AVATAR };
                    }
                });
                const usersData = await Promise.all(userPromises);
                setParticipants(usersData.filter(u => u !== null));
            } catch (err) {}
        };
        fetchParticipants();
    }, [courseId, currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;
        const socketUrl = import.meta.env.VITE_MAIN_API_URL
            ? `${import.meta.env.VITE_MAIN_API_URL}/api/chat/ws`
            : 'http://localhost:8089/api/chat/ws';
            
        const socket = new SockJS(socketUrl, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
            withCredentials: false
        });
        const client = Stomp.over(socket);
        client.debug = null;
        client.connect({}, () => {
            client.subscribe(`/queue/messages/${currentUserId}`, (payload) => {
                const receivedMsg = JSON.parse(payload.body);
                setSelectedUser(prevSelected => {
                    if (prevSelected && (String(receivedMsg.senderId) === String(prevSelected.userId) || String(receivedMsg.receiverId) === String(prevSelected.userId))) {
                        setMessages(prevMsgs => {
                            if (prevMsgs.some(msg => msg.id === receivedMsg.id)) return prevMsgs;
                            return [...prevMsgs, receivedMsg];
                        });
                    }
                    return prevSelected;
                });
            });
        });
        stompClientRef.current = client;
        return () => { if (client && client.connected) client.disconnect(); };
    }, [currentUserId]);

    useEffect(() => {
        if (!selectedUser || !currentUserId) return;
        const roomId = currentUserId < selectedUser.userId ? `${currentUserId}_${selectedUser.userId}` : `${selectedUser.userId}_${currentUserId}`;
        axiosClient.get(`/api/chat/history/${roomId}`).then(res => setMessages(res.data)).catch(() => {});
    }, [selectedUser, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMsg.trim() || !selectedUser || !stompClientRef.current) return;
        const chatMessage = {
            senderId: currentUserId, receiverId: selectedUser.userId,
            content: inputMsg, roomId: currentUserId < selectedUser.userId ? `${currentUserId}_${selectedUser.userId}` : `${selectedUser.userId}_${currentUserId}`,
            timestamp: new Date().toISOString()
        };
        stompClientRef.current.send("/app/private-message", {}, JSON.stringify(chatMessage));
        setInputMsg('');
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_AVATAR;
    };

    const filteredParticipants = useMemo(() => {
        return participants.filter(user => isFuzzyMatch(user.name, searchTerm));
    }, [participants, searchTerm]);

    return (
        <div className="chat-dashboard-wrapper">
            <div className={`chat-container ${isMobileChatActive ? 'mobile-chat-view' : 'mobile-list-view'}`}>
                
                <div className="user-list-sidebar">
                    {/* --- NGROK FIX HINT --- */}
                    {!stompClientRef.current?.connected && (
                        <div style={{ padding: '10px', background: '#fff3cd', color: '#856404', fontSize: '12px', textAlign: 'center' }}>
                            <p>Lỗi kết nối? <a href={`${import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8089'}/api/chat/ws/info`} target="_blank" rel="noreferrer">Click vào đây</a> để xác thực Ngrok, sau đó F5.</p>
                        </div>
                    )}
                    <div className="sidebar-header">
                        <button onClick={() => navigate(-1)} className="btn-icon-back">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-info">
                            <span className="course-name">{courseTitle || "Lớp học"}</span>
                            <div className="online-wrapper">
                                <span className="status-dot-mini"></span>
                                <span className="online-status">Trực tuyến</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-search">
                        <input type="text" placeholder="Tìm kiếm thành viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="ul-scroll">
                        {filteredParticipants.length === 0 ? (
                            <div className="empty-state-sidebar">
                                {searchTerm ? "Không tìm thấy ai" : "Chưa có thành viên nào"}
                            </div>
                        ) : (
                            filteredParticipants.map(user => (
                                <div
                                    key={user.userId}
                                    className={`user-item ${selectedUser?.userId === user.userId ? 'active' : ''}`}
                                    onClick={() => { setSelectedUser(user); setIsMobileChatActive(true); }}
                                >
                                    <div className="avatar-wrapper">
                                        <img src={user.avatar} alt="avt" className="u-avatar" onError={handleImgError} />
                                        <span className="status-dot"></span>
                                    </div>
                                    <div className="u-info">
                                        <div className="u-name">{user.name}</div>
                                        <div className="u-role">{user.role}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="chat-window">
                    {selectedUser ? (
                        <>
                            <div className="cw-header">
                                <div className="header-user-info">
                                    <button className="mobile-back-btn" onClick={() => setIsMobileChatActive(false)}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    <img src={selectedUser.avatar} alt="" className="header-avt" onError={handleImgError} />
                                    <div className="header-text-container">
                                        <b className="header-username">{selectedUser.name}</b>
                                        <span className="header-user-role">{selectedUser.role}</span>
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-action"><Info size={18} /></button>
                                </div>
                            </div>

                            <div className="cw-messages">
                                {messages.map((msg, idx) => {
                                    const isMe = String(msg.senderId) === String(currentUserId);
                                    
                                    // Tạo đối tượng Date từ timestamp và cộng thêm 7 giờ
                                    const dateWithOffset = new Date(msg.timestamp);
                                    dateWithOffset.setHours(dateWithOffset.getHours() + 7);

                                    return (
                                        <div key={idx} className={`msg-row ${isMe ? 'my-msg' : 'their-msg'}`}>
                                            {!isMe && (
                                                <img 
                                                    src={selectedUser.avatar} 
                                                    className="msg-avt" 
                                                    alt="" 
                                                    onError={(e) => e.target.src = DEFAULT_AVATAR} 
                                                />
                                            )}
                                            <div className="msg-content-wrapper">
                                                <div className="msg-bubble">{msg.content}</div>
                                                <div className="msg-time">
                                                    {dateWithOffset.toLocaleTimeString("vi-VN", { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit', 
                                                        hour12: false 
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="cw-input-area">
                                <div className="input-wrapper">
                                    <input type="text" placeholder="Nhập tin nhắn..." value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                    <button onClick={handleSendMessage} disabled={!inputMsg.trim()} className="btn-send"><Send size={18} /></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat">
                            <div className="empty-chat-content">
                                <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" alt="chat" />
                                <h3>Bắt đầu cuộc trò chuyện</h3>
                                <p>Chọn một thành viên từ danh sách bên trái để trao đổi.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}