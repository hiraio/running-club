package com.running.club;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RunningClubApplication {

	public static void main(String[] args) {
		SpringApplication.run(RunningClubApplication.class, args);
	}
	

}
