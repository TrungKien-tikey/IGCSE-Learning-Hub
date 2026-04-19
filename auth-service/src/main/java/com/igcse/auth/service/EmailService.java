package com.igcse.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public void sendEmail(String to, String subject, String body) {
        // Cho phép tắt gửi mail ở môi trường dev/local để tránh quota SMTP
        if (!mailEnabled) {
            System.out.printf("Email sending disabled by configuration. to=%s | subject=%s%n", to, subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("IGCSE Learning Hub <noreply@igcse.com>"); // Tên người gửi giả định
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        System.out.println("Mail sent successfully to " + to);
    }
}
