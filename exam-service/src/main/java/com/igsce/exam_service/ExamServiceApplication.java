package com.igsce.exam_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.context.annotation.ComponentScan(
    basePackages = { "com.igsce" }
)
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = { "com.igsce" })
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = { "com.igsce" })
public class ExamServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ExamServiceApplication.class, args);
	}

}
