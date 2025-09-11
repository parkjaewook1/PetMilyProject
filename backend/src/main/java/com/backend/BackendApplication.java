package com.backend;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class BackendApplication {

    @Autowired
    private Environment env;

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);


    }

    @PostConstruct
    public void checkAwsKey() {
        System.out.println("=== AWS KEY CHECK ===");
        System.out.println("aws.access.key = " + env.getProperty("aws.access.key"));
        System.out.println("aws.secret.key = " + env.getProperty("aws.secret.key"));
        System.out.println("=====================");
    }

}
