package com.backend.controller.diary;

import com.backend.security.CustomUserDetails;
import com.backend.service.diary.DiaryVisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/diary-visit")
@RequiredArgsConstructor
public class DiaryVisitController {

    private final DiaryVisitService service;

    @PostMapping("/{diaryId}")
    public ResponseEntity<Void> recordVisit(@PathVariable Integer diaryId,
                                            @AuthenticationPrincipal CustomUserDetails user) {
        service.recordVisit(diaryId, user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{diaryId}/count")
    public ResponseEntity<Map<String, Integer>> getCounts(@PathVariable Integer diaryId) {
        Map<String, Integer> result = new HashMap<>();
        result.put("today", service.getTodayCount(diaryId));
        result.put("total", service.getTotalCount(diaryId));
        return ResponseEntity.ok(result);
    }
}
