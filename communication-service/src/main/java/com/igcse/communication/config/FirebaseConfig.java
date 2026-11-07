package com.igcse.communication.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.Nullable;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    @Nullable
    public FirebaseApp firebaseApp() throws IOException {
        System.err.println("---------- BẮT ĐẦU KHỞI TẠO FIREBASE APP ----------");

        if (!FirebaseApp.getApps().isEmpty()) {
            System.err.println("---------- FIREBASE ĐÃ CÓ SẴN, DÙNG LẠI ----------");
            return FirebaseApp.getInstance();
        }

        java.io.InputStream serviceAccountStream = null;

        // Ưu tiên 1: Đọc từ đường dẫn cấu hình (env FIREBASE_CREDENTIALS_PATH)
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            java.io.File configuredFile = new java.io.File(credentialsPath);
            if (configuredFile.exists() && configuredFile.isFile()) {
                System.err.println(" Đang dùng file từ cấu hình: " + configuredFile.getAbsolutePath());
                serviceAccountStream = new java.io.FileInputStream(configuredFile);
            }
        }

        // Ưu tiên 2: Đọc từ file bên ngoài (dùng cho Docker volume mount)
        if (serviceAccountStream == null) {
            java.io.File externalFile = new java.io.File("/app/serviceAccountKey.json");
            if (externalFile.exists() && externalFile.isFile()) {
                System.err.println(" Đang dùng file từ Docker volume: " + externalFile.getAbsolutePath());
                serviceAccountStream = new java.io.FileInputStream(externalFile);
            }
        }

        // Ưu tiên 3: Đọc từ classpath (fallback tương thích)
        if (serviceAccountStream == null) {
            ClassPathResource resource = new ClassPathResource("serviceAccountKey.json");
            if (resource.exists()) {
                System.err.println(" Đang dùng file từ classpath: " + resource.getURI());
                serviceAccountStream = resource.getInputStream();
            }
        }

        if (serviceAccountStream == null) {
            System.err.println(" ⚠️  WARNING: KHÔNG TÌM THẤY FILE 'serviceAccountKey.json'!");
            System.err.println(" Firebase notifications sẽ bị tắt. Để enable, hãy đặt file tại:");
            System.err.println("   - Cấu hình: " + credentialsPath);
            System.err.println("   - Docker: /app/serviceAccountKey.json");
            System.err.println("   - Local: communication-service/serviceAccountKey.json");
            System.err.println(" Service vẫn hoạt động bình thường (WebSocket, Chat sẽ OK)");
            return null;
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