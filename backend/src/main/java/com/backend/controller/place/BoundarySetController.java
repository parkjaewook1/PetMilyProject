package com.backend.controller.place;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
public class BoundarySetController {

    @GetMapping("/api/boundarySet")
    public String getBoundarySet() throws IOException {
        Resource resource = new ClassPathResource("data/korea-boundaries.geojson");
        try (var input = resource.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
