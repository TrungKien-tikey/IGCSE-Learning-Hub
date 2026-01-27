import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { jwtDecode } from 'jwt-decode'; 
import { Send, ArrowLeft, MoreVertical, Phone, Video, Info } from 'lucide-react'; // Thêm icon cho đẹp
import './ChatPage.css';




const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
// --- HÀM 1: Xóa dấu Tiếng Việt (Phiên bản "Bất tử" chấp mọi bảng mã) ---
const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.toLowerCase();

    // 1. Thay thế thủ công các nguyên âm có dấu (Cách này chắc chắn xử lý được 'ậ')
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");

    // 2. Dùng Normalize NFD để xử lý các dấu tổ hợp lạ (nếu còn sót)
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Xóa hết khoảng trắng để so sánh liền mạch
    return str.replace(/\s+/g, ''); 
};

const isFuzzyMatch = (text, search) => {
    const normalizedText = removeVietnameseTones(text);
    const normalizedSearch = removeVietnameseTones(search);
    
    if (!normalizedSearch) return true;

    // 1. Tìm chuỗi liền kề (Substring) -> Giúp tìm "au" ra "Hậu"
    if (normalizedText.includes(normalizedSearch)) {
        return true;
    }

    // 2. Tìm ký tự rời rạc (Subsequence) -> Giúp tìm "nvh" ra "Nguyễn Văn Hậu"
    let searchIndex = 0;
    for (let i = 0; i < normalizedText.length; i++) {
        if (normalizedText[i] === normalizedSearch[searchIndex]) {
            searchIndex++;
        }
        if (searchIndex === normalizedSearch.length) {
            return true;
        }
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
            console.log("Không tìm thấy accessToken!");
            navigate('/login');
        }
    }, [navigate]);

    // 2. Fetch danh sách thành viên
    useEffect(() => {
        if (!courseId || !currentUserId) return;

        const fetchParticipants = async () => {
            try {
                // Sử dụng axiosClient để tận dụng baseURL và interceptor
                const resIds = await axiosClient.get(`/courses/${courseId}/participants`);
                const userIds = resIds.data;

                const userPromises = userIds.map(async (id) => {
                    if (String(id) === String(currentUserId)) return null;
                    try {
                        const userRes = await axiosClient.get(`/auth/users/${id}`); 
                        return {
                            userId: id,
                            name: userRes.data.fullName || userRes.data.username || `User ${id}`,
                            role: userRes.data.role || "Member",
                            avatar: DEFAULT_AVATAR // Backend chưa có avatar thật, dùng default
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


    const socket = new SockJS('http://localhost:8089/ws'); 
    const client = Stomp.over(socket);
    client.debug = null;    

    client.connect({}, () => {
        console.log("Đã kết nối WebSocket");

        client.subscribe(`/queue/messages/${currentUserId}`, (payload) => {
            const receivedMsg = JSON.parse(payload.body);

            // Cập nhật State
            setSelectedUser(prevSelected => {
                // Kiểm tra xem tin nhắn có thuộc về cuộc trò chuyện đang mở không
                // (Là tin người kia gửi đến HOẶC tin mình gửi đi từ thiết bị khác)
                const isRelevantMessage = prevSelected && (
                    String(receivedMsg.senderId) === String(prevSelected.userId) || 
                    String(receivedMsg.receiverId) === String(prevSelected.userId)
                );

                if (isRelevantMessage) {
                    setMessages(prevMsgs => {
                        // --- ĐOẠN SỬA QUAN TRỌNG NHẤT ---
                        // Kiểm tra xem tin nhắn này đã tồn tại trong list chưa (dựa vào ID)
                        // Nếu 'receivedMsg' chưa có ID từ DB, bạn có thể so sánh timestamp
                        const isExist = prevMsgs.some(msg => msg.id === receivedMsg.id);

                        if (isExist) {
                            return prevMsgs; // Nếu trùng thì bỏ qua, không thêm
                        }
                        return [...prevMsgs, receivedMsg]; // Chưa có thì mới thêm
                    });
                }
                return prevSelected;
            });
        });

    }, (err) => {
        console.error("Lỗi kết nối Socket:", err);
    });

    stompClientRef.current = client;

    // Cleanup function: Ngắt kết nối khi component unmount hoặc userId đổi
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
                const res = await axiosClient.get(`/chat/history/${roomId}`);
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
        timestamp: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString()
    };

    // 1. Chỉ gửi lên Server
    stompClientRef.current.send("/app/private-message", {}, JSON.stringify(chatMessage));

    setInputMsg('');
};
    // Helper xử lý ảnh lỗi
    const handleImgError = (e) => {
        e.target.onerror = null; 
        e.target.src = DEFAULT_AVATAR;
    };

    const filteredParticipants = useMemo(() => {
        return participants.filter(user => isFuzzyMatch(user.name, searchTerm));
    }, [participants, searchTerm]);

    return (
        <div className="chat-dashboard-wrapper">
            <div className="chat-container">
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
                    
                    {/* Ô TÌM KIẾM */}
                    <div className="sidebar-search">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm thành viên..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="ul-scroll">
                        {/* Kiểm tra danh sách sau khi lọc */}
                        {filteredParticipants.length === 0 ? (
                            <div className="empty-state-sidebar">
                                {searchTerm ? "Không tìm thấy ai" : "Chưa có thành viên nào"}
                            </div>
                        ) : (
                            filteredParticipants.map(user => (
                                <div 
                                    key={user.userId} 
                                    className={`user-item ${selectedUser?.userId === user.userId ? 'active' : ''}`}
                                    onClick={() => setSelectedUser(user)}
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
                                    <img 
                                        src={selectedUser.avatar} 
                                        alt="" 
                                        className="header-avt"
                                        onError={handleImgError}
                                    />
                                    <div>
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
                                                        timeZone: "Asia/Ho_Chi_Minh",
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