package com.backend.service.diary;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiaryFileService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    public String saveBanner(MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get(uploadDir, fileName);

        Files.createDirectories(path.getParent());
        file.transferTo(path.toFile());

        return "/uploads/" + fileName; // 프론트에서 접근 가능한 URL
    }
}