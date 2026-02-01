"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Clock, Check, Circle, Bell, ArrowLeft } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import notificationService from '../../services/notificationService';

// Key lưu LocalStorage cho thông báo hệ thống
const LOCAL_STORAGE_KEY = "read_global_notifications";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, UNREAD, READ
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. LOGIC LOCAL STORAGE ---
  const getReadGlobalIds = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const saveReadGlobalId = (id) => {
    const currentIds = getReadGlobalIds();
    if (!currentIds.includes(id)) {
      const newIds = [...currentIds, id];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newIds));
    }
  };

  // --- 2. TẢI DỮ LIỆU ---
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications();
      const rawData = Array.isArray(res) ? res : (res?.data || []);
      
      const readGlobalIds = getReadGlobalIds();

      const processedData = rawData.map(notif => {
        const isGlobal = notif.userId === 0;
        const isReadLocal = isGlobal && readGlobalIds.includes(notif.id);
        return {
          ...notif,
          isRead: notif.isRead || isReadLocal 
        };
      });

      // Sắp xếp: Chưa đọc lên đầu, sau đó đến thời gian mới nhất
      const sorted = processedData.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sorted);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- 3. XỬ LÝ CUỘN ĐẾN THÔNG BÁO CỤ THỂ (GIỐNG EXAM LIST) ---
  useEffect(() => {
    if (!loading && notifications.length > 0 && location.state?.scrollToId) {
      const targetId = location.state.scrollToId;
      const element = document.getElementById(`notif-card-${targetId}`);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = "all 0.5s";
        element.style.borderLeft = "8px solid #2563eb";
        element.style.transform = "scale(1.02)";
        element.style.zIndex = "10";

        setTimeout(() => {
          element.style.transform = "scale(1)";
          element.style.borderLeft = notifications.find(n => n.id === targetId)?.isRead 
            ? "1px solid #e2e8f0" 
            : "4px solid #2563eb";
          window.history.replaceState({}, document.title);
        }, 3000);
      }
    }
  }, [loading, notifications, location.state]);

  // --- 4. CÁC HÀM XỬ LÝ ---
  const markAsReadLogic = async (notif) => {
    if (notif.isRead) return;
    if (notif.userId === 0) {
      saveReadGlobalId(notif.id);
    } else {
      try {
        await notificationService.markAsRead(notif.id);
      } catch (err) {
        console.error("Lỗi API mark read:", err);
      }
    }
    setNotifications(prev => prev.map(n => 
      n.id === notif.id ? { ...n, isRead: true } : n
    ));
  };

  const handleContentClick = async (notif) => {
    await markAsReadLogic(notif);
    const targetExamId = notif.examId || notif.exam_id;
    if (targetExamId) {
      navigate('/exams', { state: { scrollToId: targetExamId } });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString('vi-VN', {
      timeZone: "Asia/Ho_Chi_Minh", // Đảm bảo khớp thời gian thực Việt Nam
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === "UNREAD") return !n.isRead;
    if (filterStatus === "READ") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg">
                 <Bell size={24} />
              </div>
              Thông báo
            </h1>
            <p className="text-gray-500 mt-1 ml-1">
              Bạn có <span className="font-bold text-blue-600">{unreadCount}</span> thông báo chưa đọc
            </p>
          </div>
          
          {/* Bộ lọc Tabs giống Exam List */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'UNREAD', label: 'Chưa đọc' },
              { id: 'READ', label: 'Đã xem' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  filterStatus === tab.id 
                    ? "bg-white text-gray-800 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- DANH SÁCH THÔNG BÁO --- */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white border rounded-2xl p-16 text-center shadow-sm">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={40} className="text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Trống trơn</h3>
              <p className="text-gray-400 mt-2">Không có thông báo nào trong mục này.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id}
                id={`notif-card-${notif.id}`}
                onClick={() => handleContentClick(notif)} 
                className={`
                  group relative p-5 flex gap-5 items-start cursor-pointer transition-all duration-300 border rounded-xl
                  hover:shadow-md hover:border-blue-300
                  ${notif.isRead 
                    ? 'bg-white border-gray-100 opacity-80' 
                    : 'bg-white border-blue-100 border-l-4 border-l-blue-600'
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                  ${notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-600'}
                `}>
                  <BookOpen size={22} />
                </div>

                {/* Nội dung */}
                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-lg font-bold leading-tight ${notif.isRead ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-700'}`}>
                      {notif.title}
                    </h3>
                    
                    <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                        ${notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-700'}
                      `}>
                        <Clock size={12} /> 
                        {formatDate(notif.createdAt)}
                      </span>
                      
                      {!notif.isRead && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">MỚI</span>
                      )}

                      <span className="text-xs text-gray-400 italic">
                        {notif.userId === 0 ? "Hệ thống" : "Cá nhân"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút Đánh dấu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsReadLogic(notif);
                  }}
                  className={`
                    absolute right-5 top-5 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${notif.isRead ? 'text-green-500' : 'text-gray-200 hover:text-blue-600 hover:bg-blue-50'}
                  `}
                >
                  {notif.isRead ? <Check size={22} strokeWidth={3} /> : <Circle size={22} />}
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="text-center mt-12 mb-8 text-xs text-gray-400 uppercase tracking-widest">
            IGCSE Learning Hub &copy; 2026
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;