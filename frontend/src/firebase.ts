import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Dán config bạn vừa copy từ Firebase Console vào đây
const firebaseConfig = {
  apiKey: "AIzaSyBRIuYBUgk1HC5A-ksWibunUjDbdQo2CBk",
  authDomain: "igcse-learning-hub-a3858.firebaseapp.com",
  projectId: "igcse-learning-hub-a3858",
  storageBucket: "igcse-learning-hub-a3858.firebasestorage.app",
  messagingSenderId: "244147059332",
  appId: "1:244147059332:web:c20b8d6592a033461060d1",
  measurementId: "G-627C4EZM57"
};

const app = initializeApp(firebaseConfig);

export const requestForToken = async () => {
  try {
    const messaging = getMessaging(app);
    // VapidKey: Bạn lấy ở tab "Cloud Messaging" -> "Web configuration" trong Firebase Console
    // Nếu lười thì để trống hàm getToken() cũng được, nhưng tốt nhất nên tạo key pair trên console
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BAIvhEKMsQq9NfpHqBI72wKj0QhNIdQf88zXWEnrzkfv57fs0Kh_dLmuwU2p1kcUQExekAU1CIp3rlkof9NWU8Y"
      });
      console.log("FCM Token:", token);
      return token;
    } else {
      console.error("Permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting permission:", error);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        // Nghe tin nhắn khi đang mở tab
        import("firebase/messaging").then(({ onMessage }) => {
            onMessage(messaging, (payload) => {
                console.log("Message received: ", payload);
                resolve(payload);
            });
        });
      }
    });
  });
};