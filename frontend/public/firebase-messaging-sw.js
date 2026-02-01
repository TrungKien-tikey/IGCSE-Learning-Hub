importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Copy y nguyên config từ file firebase.ts của bạn vào đây
const firebaseConfig = {
  apiKey: "AIzaSyBRIuYBUgk1HC5A-ksWibunUjDbdQo2CBk",
  authDomain: "igcse-learning-hub-a3858.firebaseapp.com",
  projectId: "igcse-learning-hub-a3858",
  storageBucket: "igcse-learning-hub-a3858.firebasestorage.app",
  messagingSenderId: "244147059332",
  appId: "1:244147059332:web:c20b8d6592a033461060d1",
  measurementId: "G-627C4EZM57"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Xử lý sự kiện nhận thông báo khi App đang chạy ngầm (Background)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Tùy chỉnh tiêu đề và nội dung thông báo hiển thị
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // Đường dẫn icon của app (tùy chọn)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});