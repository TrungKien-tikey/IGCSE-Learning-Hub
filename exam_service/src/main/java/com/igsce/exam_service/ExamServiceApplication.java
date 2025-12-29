package com.igsce.exam_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ExamServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ExamServiceApplication.class, args);
	}

}
