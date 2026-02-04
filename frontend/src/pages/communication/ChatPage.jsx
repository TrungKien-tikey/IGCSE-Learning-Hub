import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { jwtDecode } from 'jwt-decode';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Info, ChevronLeft } from 'lucide-react'; 
import './ChatPage.css';

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// --- HÀM 1: Xóa dấu Tiếng Việt ---
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
        if (normalizedText[i] === normalizedSearch[searchIndex]) {
            searchIndex++;
        }
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
    
    // State hỗ trợ Mobile
    const [isMobileChatActive, setIsMobileChatActive] = useState(false);

    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    // 1. Lấy ID người dùng từ Token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUserId(decoded.userId || decoded.id || decoded.sub);
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // 2. Fetch danh sách thành viên
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
                        return {
                            userId: id,
                            name: `Học viên (ID: ${id})`,
                            role: "Member",
                            avatar: DEFAULT_AVATAR
                        };
                    }
                });

                const usersData = await Promise.all(userPromises);
                setParticipants(usersData.filter(u => u !== null));
            } catch (err) {
                console.error("Lỗi lấy danh sách thành viên:", err);
            }
        };

        fetchParticipants();
    }, [courseId, currentUserId]);

    // 3. Kết nối WebSocket
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
            console.log("Đã kết nối WebSocket");

            client.subscribe(`/queue/messages/${currentUserId}`, (payload) => {
                const receivedMsg = JSON.parse(payload.body);

                setSelectedUser(prevSelected => {
                    const isRelevantMessage = prevSelected && (
                        String(receivedMsg.senderId) === String(prevSelected.userId) ||
                        String(receivedMsg.receiverId) === String(prevSelected.userId)
                    );

                    if (isRelevantMessage) {
                        setMessages(prevMsgs => {
                            const isExist = prevMsgs.some(msg => msg.id === receivedMsg.id);
                            if (isExist) return prevMsgs;
                            return [...prevMsgs, receivedMsg];
                        });
                    }
                    return prevSelected;
                });
            });

        }, (err) => {
            console.error("Lỗi kết nối Socket:", err);
        });

        stompClientRef.current = client;

        return () => {
            if (client && client.connected) {
                client.disconnect();
            }
        };
    }, [currentUserId]);

    // 4. Load lịch sử chat
    useEffect(() => {
        if (!selectedUser || !currentUserId) return;
        const roomId = getRoomId(currentUserId, selectedUser.userId);

        const fetchHistory = async () => {
            try {
                const res = await axiosClient.get(`/api/chat/history/${roomId}`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) {
                console.error("Lỗi tải lịch sử chat:", err);
            }
        };
        fetchHistory();
    }, [selectedUser, currentUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const getRoomId = (uid1, uid2) => {
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    };

    const handleSendMessage = () => {
        if (!inputMsg.trim() || !selectedUser || !stompClientRef.current) return;

        const chatMessage = {
            senderId: currentUserId,
            receiverId: selectedUser.userId,
            content: inputMsg,
            roomId: getRoomId(currentUserId, selectedUser.userId),
            timestamp: new Date().toISOString()
        };

        stompClientRef.current.send("/app/private-message", {}, JSON.stringify(chatMessage));
        setInputMsg('');
    };

    // Hàm chọn user (Dành cho Mobile)
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setIsMobileChatActive(true);
    };

    // Hàm quay lại danh sách (Dành cho Mobile)
    const handleBackToList = () => {
        setIsMobileChatActive(false);
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
                
                {/* --- SIDEBAR --- */}
                <div className="user-list-sidebar">
                    <div className="sidebar-header">
                        <button onClick={() => navigate(-1)} className="btn-icon-back" title="Quay lại">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-info">
                            <span className="course-name">{courseTitle || "Lớp học"}</span>
                            <span className="online-status">Trực tuyến</span>
                        </div>
                    </div>

                    <div className="sidebar-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm thành viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <div className="avatar-wrapper">
                                        <img
                                            src={user.avatar}
                                            alt="avt"
                                            className="u-avatar"
                                            onError={handleImgError}
                                        />
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

                {/* --- CHAT WINDOW --- */}
                <div className="chat-window">
                    {selectedUser ? (
                        <>
                            <div className="cw-header">
                                <div className="header-user-info">
                                    {/* Nút Back chỉ hiện trên Mobile */}
                                    <button className="mobile-back-btn" onClick={handleBackToList}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    
                                    <img
                                        src={selectedUser.avatar}
                                        alt=""
                                        className="header-avt"
                                        onError={handleImgError}
                                    />
                                    <div className="header-text-info">
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
                                    return (
                                        <div key={idx} className={`msg-row ${isMe ? 'my-msg' : 'their-msg'}`}>
                                            {!isMe && (
                                                <img
                                                    src={selectedUser.avatar}
                                                    className="msg-avt"
                                                    alt=""
                                                    onError={handleImgError}
                                                />
                                            )}
                                            <div className="msg-content-wrapper">
                                                <div className="msg-bubble">
                                                    {msg.content}
                                                </div>
                                                <div className="msg-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
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
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={inputMsg}
                                        onChange={e => setInputMsg(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMsg.trim()}
                                        className="btn-send"
                                    >
                                        <Send size={18} />
                                    </button>
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