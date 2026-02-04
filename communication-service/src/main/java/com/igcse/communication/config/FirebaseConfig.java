package com.igcse.communication.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.Nullable;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Optional;

@Configuration
public class FirebaseConfig {

    @Bean
    @Nullable
    public FirebaseApp firebaseApp() throws IOException {
        System.err.println("---------- BẮT ĐẦU KHỞI TẠO FIREBASE APP ----------");

        if (!FirebaseApp.getApps().isEmpty()) {
            System.err.println("---------- FIREBASE ĐÃ CÓ SẴN, DÙNG LẠI ----------");
            return FirebaseApp.getInstance();
        }

        java.io.InputStream serviceAccountStream = null;

        // Ưu tiên 1: Đọc từ file bên ngoài (dùng cho Docker volume mount)
        java.io.File externalFile = new java.io.File("/app/serviceAccountKey.json");
        if (externalFile.exists() && externalFile.isFile()) {
            System.err.println(" Đang dùng file từ Docker volume: " + externalFile.getAbsolutePath());
            serviceAccountStream = new java.io.FileInputStream(externalFile);
        } else {
            // Ưu tiên 2: Đọc từ classpath (dùng cho local development)
            ClassPathResource resource = new ClassPathResource("serviceAccountKey.json");
            if (resource.exists()) {
                System.err.println(" Đang dùng file từ classpath: " + resource.getURI());
                serviceAccountStream = resource.getInputStream();
            } else {
                System.err.println(" ⚠️  WARNING: KHÔNG TÌM THẤY FILE 'serviceAccountKey.json'!");
                System.err.println(" Firebase notifications sẽ bị tắt. Để enable, hãy đặt file tại:");
                System.err.println("   - Docker: /app/serviceAccountKey.json");
                System.err.println("   - Local: communication-service/src/main/resources/serviceAccountKey.json");
                System.err.println(" Service vẫn hoạt động bình thường (WebSocket, Chat sẽ OK)");
                return null;
            }
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                .build();

        FirebaseApp app = FirebaseApp.initializeApp(options);
        System.err.println("---------- KHỞI TẠO FIREBASE THÀNH CÔNG ----------");
        return app;
    }

    @Bean
    @Nullable
    public FirebaseMessaging firebaseMessaging(@Nullable FirebaseApp firebaseApp) {
        System.err.println("---------- ĐANG TẠO BEAN FIREBASE MESSAGING ----------");
        if (firebaseApp == null) {
            System.err.println(" Firebase không được khởi tạo, FirebaseMessaging sẽ null");
            return null;
        }
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}