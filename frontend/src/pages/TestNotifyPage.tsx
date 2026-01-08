'use client';

import { useState, useEffect } from 'react';
import { requestPermission, onMessageListener } from '../firebase';

export default function TestNotificationPage() {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<string>('Chưa sẵn sàng');
  const [notification, setNotification] = useState<{title?: string, body?: string} | null>(null);

  useEffect(() => {
    // Lắng nghe tin nhắn khi đang mở app
    onMessageListener().then((payload: any) => {
      setNotification({
        title: payload?.notification?.title,
        body: payload?.notification?.body,
      });
      alert(`TING TING! \n${payload?.notification?.title}\n${payload?.notification?.body}`);
    });
  }, []);

  const handleGetToken = async () => {
    setStatus('Đang xin quyền...');
    const fcmToken = await requestPermission();
    if (fcmToken) {
      setToken(fcmToken);
      setStatus('Đã có Token! Giờ hãy đăng ký vào lớp học.');
    } else {
      setStatus('Không lấy được token (Check console log)');
    }
  };

  const handleSubscribe = async () => {
    if (!token) {
        alert("Chưa có Token"); 
        return;
    }

    // Gọi về Backend Communication Service của bạn
    // Giả sử backend chạy port 8083
    try {
        const response = await fetch(`http://localhost:8083/api/test-notify/subscribe?token=${token}&topic=course_1`, {
            method: 'POST'
        });
        const text = await response.text();
        alert("Server phản hồi: " + text);
        setStatus("Đã vào lớp course_1. Đợi tin nhắn...");
    } catch (err) {
        alert("Lỗi gọi backend: " + err);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Test Push Notification</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Trạng thái: <span style={{ color: 'blue' }}>{status}</span></h3>
        {notification && (
            <div style={{ backgroundColor: '#e6fffa', padding: '10px', marginTop: '10px' }}>
                <strong>Tin nhắn mới nhất:</strong>
                <p>{notification.title}</p>
                <p>{notification.body}</p>
            </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
            onClick={handleGetToken}
            style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Bước 1: Bật thông báo (Lấy Token)
        </button>

        <button 
            onClick={handleSubscribe}
            disabled={!token}
            style={{ padding: '10px 20px', background: token ? '#00a651' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Bước 2: Vào lớp (Subscribe course_1)
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Token của bạn:</h4>
        <textarea readOnly value={token} style={{ width: '100%', height: '100px' }} />
      </div>
    </div>
  );
}