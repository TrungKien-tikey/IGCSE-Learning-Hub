package com.igcse.ai.client;

import com.igcse.ai.dto.external.CourseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
public class CourseClient {
    private static final Logger logger = LoggerFactory.getLogger(CourseClient.class);
    private final RestTemplate restTemplate;

    @Value("${course.service.url:http://course-service:8079}")
    private String courseServiceUrl;

    public CourseClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<CourseDTO> getAllCourses() {
        try {
            String url = courseServiceUrl + "/api/v1/courses";
            logger.info("Fetching all courses from: {}", url);

            ResponseEntity<List<CourseDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<CourseDTO>>() {
                    });

            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error fetching courses from course-service: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public CourseDTO getCourseById(Long courseId) {
        try {
            String url = courseServiceUrl + "/api/v1/courses/" + courseId;
            logger.debug("Fetching course details from: {}", url);

            ResponseEntity<CourseDTO> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    CourseDTO.class);

            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching course {} from course-service: {}", courseId, e.getMessage());
            return null;
        }
    }
}
