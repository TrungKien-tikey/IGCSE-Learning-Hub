import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Check, Circle, Bell, Filter } from 'lucide-react';
import notificationService from '../../services/notificationService'; 

// Key lưu LocalStorage
const LOCAL_STORAGE_KEY = "read_global_notifications";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


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

  const sortNotifications = (list) => {
    return [...list].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

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

      setNotifications(sortNotifications(processedData));
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

    const updatedList = notifications.map(n => 
      n.id === notif.id ? { ...n, isRead: true } : n
    );
    setNotifications(sortNotifications(updatedList));
  };

  const handleMarkAsReadOnly = async (e, notif) => {
    e.stopPropagation(); 
    await markAsReadLogic(notif);
  };

  const handleContentClick = async (notif) => {
    await markAsReadLogic(notif);

    const targetExamId = notif.examId || notif.exam_id;
    if (targetExamId) {
      navigate('/exams', { state: { scrollToId: targetExamId } });
    } else {
      console.warn("Thông báo không có ID bài thi");
    }
  };

  // Tính số lượng chưa đọc để hiển thị cho đẹp
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-200">
                 <Bell size={24} />
              </div>
              Thông báo
            </h1>
            <p className="text-gray-500 mt-1 ml-1">
              Bạn có <span className="font-bold text-blue-600">{unreadCount}</span> thông báo chưa đọc
            </p>
          </div>
          
          {/* Nút giả lập bộ lọc để nhìn cho pro */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all shadow-sm">
            <Filter size={18} />
            <span className="font-medium text-sm">Lọc tin</span>
          </button>
        </div>

        {/* --- LIST CONTAINER --- */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="bg-blue-50 p-6 rounded-full mb-4">
                <BookOpen size={48} className="text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Không có thông báo mới</h3>
              <p className="text-gray-400 mt-2">Tuyệt vời! Bạn đã cập nhật tất cả thông tin.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleContentClick(notif)} 
                  className={`
                    group relative p-5 flex gap-5 items-start cursor-pointer transition-all duration-300
                    hover:bg-gray-50
                    ${notif.isRead 
                      ? 'bg-white' 
                      : 'bg-gradient-to-r from-blue-50/80 to-white border-l-4 border-blue-600' // Hiệu ứng chưa đọc xịn hơn
                    }
                  `}
                >
                  {/* 1. Icon Container */}
                  <div className={`
                    mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105
                    ${notif.isRead 
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-white text-blue-600 shadow-blue-100 border border-blue-100 ring-2 ring-blue-50'
                    }
                  `}>
                    <BookOpen size={22} strokeWidth={notif.isRead ? 2 : 2.5} />
                  </div>

                  {/* 2. Nội dung */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex flex-col gap-1">
                      <h3 className={`text-base font-bold leading-tight transition-colors ${notif.isRead ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-700'}`}>
                        {notif.title}
                      </h3>
                      
                      <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit
                          ${notif.isRead ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'}
                        `}>
                          <Clock size={12} /> 
                          {new Date(notif.createdAt).toLocaleString('vi-VN', {
                             hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </span>
                        
                        {!notif.isRead && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">MỚI</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Nút Tích (Đã style lại) */}
                  <button
                    onClick={(e) => handleMarkAsReadOnly(e, notif)}
                    className={`
                      absolute right-5 top-1/2 -translate-y-1/2
                      h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300
                      focus:outline-none z-10
                      ${notif.isRead 
                        ? 'text-green-500 hover:bg-green-50' 
                        : 'text-gray-300 bg-white border border-gray-200 shadow-sm hover:border-blue-500 hover:text-blue-600 hover:shadow-md hover:scale-110' 
                      }
                    `}
                    title={notif.isRead ? "Đã xem" : "Đánh dấu đã xem"}
                  >
                    {notif.isRead 
                      ? <Check size={20} strokeWidth={3} /> 
                      : <Circle size={20} strokeWidth={2} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer nhỏ cho trang trí */}
        <div className="text-center mt-8 text-xs text-gray-400">
            Hệ thống quản lý học tập &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;