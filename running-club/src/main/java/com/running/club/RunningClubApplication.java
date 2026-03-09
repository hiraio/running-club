package com.running.club;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.running.club.domain.Member;
import com.running.club.repository.MemberRepository;


@SpringBootApplication
public class RunningClubApplication {

	public static void main(String[] args) {
		SpringApplication.run(RunningClubApplication.class, args);
	}
	

}
