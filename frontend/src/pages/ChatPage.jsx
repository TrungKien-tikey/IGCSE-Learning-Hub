import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const ChatPage = () => {
    // State cho cấu hình kết nối
    const [myId, setMyId] = useState(1);
    const [roomId, setRoomId] = useState('room_1_2');
    const [receiverId, setReceiverId] = useState(2);
    const [isConnected, setIsConnected] = useState(false);
    
    // State cho tin nhắn
    const [messages, setMessages] = useState([]);
    const [msgContent, setMsgContent] = useState('');
    
    // Refs để giữ instance của stompClient và auto scroll
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    const BASE_URL = 'http://localhost:8083'; // Cấu hình địa chỉ Server

    // Auto scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Hàm kết nối WebSocket
    const connect = () => {
        if (!myId || !roomId) {
            alert("Vui lòng nhập ID và Room ID!");
            return;
        }

        const socket = new SockJS(`${BASE_URL}/ws`);
        const client = Stomp.over(socket);

        // Tắt debug log nếu muốn console sạch hơn
        // client.debug = null; 

        client.connect({}, (frame) => {
            console.log('Connected: ' + frame);
            setIsConnected(true);
            stompClientRef.current = client;

            // --- 1. LOAD LỊCH SỬ CHAT ---
            // Subscribe vào đường dẫn @SubscribeMapping bên Java
            client.subscribe(`/app/history/${roomId}`, (response) => {
                console.log("Đã nhận lịch sử chat!");
                const historyList = JSON.parse(response.body);
                setMessages(historyList);
            });

            // --- 2. LẮNG NGHE TIN NHẮN MỚI (Real-time) ---
            client.subscribe(`/queue/messages/${myId}`, (messageOutput) => {
                const newMessage = JSON.parse(messageOutput.body);
                // Cập nhật danh sách tin nhắn (dùng callback để đảm bảo state mới nhất)
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            });

        }, (error) => {
            alert("Lỗi kết nối Server: " + error);
            console.error(error);
            setIsConnected(false);
        });
    };

    // Hàm gửi tin nhắn
    const sendMessage = (e) => {
        e.preventDefault(); // Ngăn reload form
        if (!msgContent.trim() || !stompClientRef.current) return;

        const chatMessage = {
            senderId: Number(myId),
            receiverId: Number(receiverId),
            roomId: roomId,
            content: msgContent
        };

        // Gửi lên server
        stompClientRef.current.send("/app/private-message", {}, JSON.stringify(chatMessage));
        setMsgContent('');
    };

    // Ngắt kết nối khi component bị hủy (Unmount)
    useEffect(() => {
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    // Format thời gian
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="p-6 max-w-3xl mx-auto font-sans">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
                📨  Chat 
            </h2>

            {/* Phần 1: Cấu hình kết nối */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">1. Kết nối</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Của Bạn</label>
                        <input
                            type="number"
                            className="border rounded px-3 py-2 w-24 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={myId}
                            onChange={(e) => setMyId(e.target.value)}
                            disabled={isConnected}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                        <input
                            type="text"
                            className="border rounded px-3 py-2 w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            disabled={isConnected}
                        />
                    </div>
                    <button
                        onClick={connect}
                        disabled={isConnected}
                        className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                            isConnected 
                            ? 'bg-green-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isConnected ? 'Đã Kết Nối' : 'Kết Nối & Vào Phòng'}
                    </button>
                    {isConnected && (
                        <span className="text-green-600 font-medium self-center ml-2">
                            ● Online (ID: {myId})
                        </span>
                    )}
                </div>
            </div>

            {/* Phần 2: Khu vực Chat */}
            <div className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold">2. Chat Box</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Người nhận ID:</label>
                        <input
                            type="number"
                            className="border rounded px-2 py-1 w-20 text-center"
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Danh sách tin nhắn */}
                <div className="h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4 flex flex-col gap-2">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-400 italic mt-10">Chưa có tin nhắn nào...</p>
                    )}
                    
                    {messages.map((msg, index) => {
                        const isMe = msg.senderId == myId; // so sánh tương đối vì input là string/number
                        return (
                            <div 
                                key={index} 
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                    isMe 
                                    ? 'bg-blue-100 text-gray-800 rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                }`}>
                                    <div className="text-xs font-bold mb-1 text-gray-500">
                                        {isMe ? 'Tôi' : `User ${msg.senderId}`}
                                    </div>
                                    <div className="text-sm break-words">{msg.content}</div>
                                    <div className="text-[10px] text-gray-400 text-right mt-1">
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Ô nhập tin nhắn */}
                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 border rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nhập tin nhắn..."
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                        Gửi
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;