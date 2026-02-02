package com.igcse.course.listener;

import com.igcse.course.config.RabbitMQConfig;
import com.igcse.course.event.CourseEnrollmentEvent;
import com.igcse.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentListener {

    private final CourseService courseService;

    @RabbitListener(queues = RabbitMQConfig.ENROLLMENT_QUEUE)
    public void handleCourseEnrollment(CourseEnrollmentEvent event) {
        log.info("Received CourseEnrollmentEvent: Student {} -> Course {}", event.getStudentId(), event.getCourseId());

        try {
            boolean success = courseService.enrollCourse(event.getCourseId(), event.getStudentId());
            if (success) {
                log.info("Successfully enrolled student {} to course {}", event.getStudentId(), event.getCourseId());
            } else {
                log.warn("Student {} already enrolled or course {} not found/inactive", event.getStudentId(),
                        event.getCourseId());
            }
        } catch (Exception e) {
            log.error("Error processing enrollment event: {}", e.getMessage(), e);
            // Throwing exception triggers RabbitMQ retry (DLQ strategy needs to be
            // configured for prod)
            throw e;
        }
    }
}
