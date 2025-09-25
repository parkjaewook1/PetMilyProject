package com.backend.controller.diary;

import com.backend.domain.diary.DiaryProfile;
import com.backend.domain.diary.MoodStat;
import com.backend.security.CustomUserDetails;
import com.backend.service.diary.DiaryProfileService;
import com.backend.service.diary.DiaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryProfileService diaryProfileService;
    private final DiaryService diaryService;

    /**
     * memberId 또는 encodedId(DIARY-xxx-ID)로 다이어리 조회
     * - encodedId면 변환 후 주인 검증
     * - 숫자면 그대로 memberId 사용 후 주인 검증
     */
    @GetMapping("/byMember/{value}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDiaryByMemberValue(
            @PathVariable String value,
            @AuthenticationPrincipal CustomUserDetails user) {

        Integer memberId = null;

        // 1. 숫자인지 문자열(encodedId)인지 판별
        try {
            memberId = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            memberId = extractUserIdFromDiaryId(value);
        }

        if (memberId == null) {
            return ResponseEntity.badRequest().body(null);
        }


        // 3. 다이어리 조회
        var diary = diaryService.getDiaryByMemberId(memberId);
        if (diary == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // 4. 응답 구성
        Map<String, Object> result = new HashMap<>();
        result.put("id", diary.getId());
        result.put("memberId", diary.getMemberId());
        result.put("title", diary.getTitle());
        return ResponseEntity.ok(result);
    }

    // utils.js의 extractUserIdFromDiaryId를 자바로 옮긴 버전
    private Integer extractUserIdFromDiaryId(String diaryId) {
        if (diaryId == null) return null;
        String[] parts = diaryId.split("-");
        if (parts.length == 3) {
            try {
                return Integer.parseInt(parts[1]) / 17;
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    @GetMapping("/profile/{ownerId}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Integer ownerId) {
        Map<String, Object> response = new HashMap<>();
        DiaryProfile diaryProfile = diaryProfileService.getProfileByMemberId(ownerId);

        if (diaryProfile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        response.put("status_message", diaryProfile.getStatusMessage());
        response.put("introduction", diaryProfile.getIntroduction());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createProfile(@RequestBody Map<String, Object> data) {
        Integer ownerId = (Integer) data.get("ownerId");
        String statusMessage = (String) data.get("status_message");
        String introduction = (String) data.get("introduction");
        try {
            if (!diaryProfileService.profileExists(ownerId)) {
                diaryProfileService.createProfile(ownerId, statusMessage, introduction);
                return ResponseEntity.status(HttpStatus.CREATED).build();
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/profile/{ownerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@PathVariable Integer ownerId,
                                           @RequestBody Map<String, Object> data) {
        String statusMessage = (String) data.get("status_message");
        String introduction = (String) data.get("introduction");
        try {
            if (diaryProfileService.profileExists(ownerId)) {
                diaryProfileService.updateProfile(ownerId, statusMessage, introduction);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/mood-stats")
    public List<MoodStat> getMonthlyMoodStats(@RequestParam Integer memberId,
                                              @RequestParam String yearMonth) {
        return diaryService.getMonthlyMoodStats(memberId, yearMonth);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiaryById(@PathVariable Long id) {
        var diary = diaryService.getDiaryById(id);
        if (diary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(diary);
    }
}