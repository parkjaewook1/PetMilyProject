package com.backend.config;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfiguration {

    // application.properties에 설정한 컨테이너 이름을 가져옵니다.
    @Value("${spring.cloud.azure.storage.blob.container-name}")
    private String containerName;

    /**
     * Azure Blob Storage의 특정 컨테이너(버킷과 유사)를 제어하는 클라이언트를 빈으로 등록합니다.
     * BlobServiceClient는 라이브러리가 application.properties 설정을 보고 자동으로 만들어줍니다.
     */
    @Bean
    public BlobContainerClient blobContainerClient(BlobServiceClient blobServiceClient) {
        return blobServiceClient.getBlobContainerClient(containerName);
    }
}