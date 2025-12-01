package com.backend.controller.diary;

import com.backend.domain.diary.DiaryProfile;
import com.backend.domain.diary.MoodStat;
import com.backend.domain.member.Member;
import com.backend.security.CustomUserDetails;
import com.backend.service.diary.DiaryFileService;
import com.backend.service.diary.DiaryProfileService;
import com.backend.service.diary.DiaryService;
import com.backend.service.friends.FriendsService;
import com.backend.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryProfileService diaryProfileService;
    private final DiaryService diaryService;
    private final DiaryFileService diaryFileService;
    private final MemberService memberService;
    private final FriendsService friendsService;

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

        // 1. memberId 파싱 (숫자 or encodedId)
        Integer memberId = null;
        try {
            memberId = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            memberId = extractUserIdFromDiaryId(value);
        }

        if (memberId == null) {
            return ResponseEntity.ok(Map.of("isValid", false));
        }

        // 2. 다이어리 조회
        var diary = diaryService.getDiaryByMemberId(memberId);
        if (diary == null) {
            return ResponseEntity.ok(Map.of("isValid", false));
        }

        // 3. 주인 정보
        Member member = memberService.getById(diary.getMemberId());
        String nickname = (member != null) ? member.getNickname() : null;

        // 4. 소유자 여부
        boolean isOwner = (user != null && user.getId().equals(diary.getMemberId()));

        // 5. 친구 여부
        boolean isFriend = false;
        if (!isOwner && user != null) {
            isFriend = friendsService.checkFriendship(user.getId(), diary.getMemberId());
        }

        // 6. 공개 범위
        String visibility = diary.getVisibility(); // "PUBLIC", "FRIENDS", "PRIVATE"

        // 7. 접근 제어
        boolean canAccess = isOwner
                || "PUBLIC".equalsIgnoreCase(visibility)
                || ("FRIENDS".equalsIgnoreCase(visibility) && isFriend);

        if (!canAccess) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("isValid", false, "message", "잘못된 접근"));
        }

        // 8. 응답 데이터
        Map<String, Object> result = new HashMap<>();
        result.put("isValid", true);
        result.put("id", diary.getId());
        result.put("memberId", diary.getMemberId());
        result.put("nickname", nickname);
        result.put("title", diary.getTitle());
        result.put("isOwner", isOwner);
        result.put("isFriend", isFriend);
        result.put("visibility", visibility);

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
        System.out.println("ownerId 입니다 = " + ownerId);

//        if (diaryProfile == null) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
//        }
        if (diaryProfile == null) {
            return ResponseEntity.ok(response);
        }

        response.put("status_message", diaryProfile.getStatusMessage());
        response.put("introduction", diaryProfile.getIntroduction());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?>
    createProfile(@RequestBody Map<String, Object> data) {
        System.out.println("data = " + data);
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
    public ResponseEntity<?> getDiaryById(@PathVariable Integer id) {
        var diary = diaryService.getDiaryById(id);
        if (diary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(diary);
    }

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @PostMapping("/{id}/banner")
    public ResponseEntity<String> uploadBanner(@PathVariable Long id,
                                               @RequestParam("banner") MultipartFile file) throws IOException {
        String fileUrl = diaryFileService.saveBanner(file);
        // 필요하다면 diaryService 통해 DB에 fileUrl 저장
        return ResponseEntity.ok(fileUrl);
    }


}
