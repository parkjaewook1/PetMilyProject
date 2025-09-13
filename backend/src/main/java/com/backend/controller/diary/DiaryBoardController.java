package com.backend.controller.diary;

import com.backend.domain.diary.DiaryBoard;
import com.backend.domain.diary.DiaryProfile;
import com.backend.domain.diary.MoodStat;
import com.backend.service.diary.DiaryBoardService;
import com.backend.service.diary.DiaryProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diaryBoard")
@RequiredArgsConstructor
public class DiaryBoardController {

    private final DiaryBoardService diaryBoardService;
    private final DiaryProfileService diaryProfileService;


    // 기존 다이어리 메인 (파일 포함)
    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addDiary(
            @ModelAttribute DiaryBoard diaryBoard,
            @RequestParam(value = "files[]", required = false) MultipartFile[] files,
            Authentication authentication) {
        if (!diaryBoardService.validate(diaryBoard)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            diaryBoardService.add(diaryBoard, files, authentication);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 감정일기 (파일 없음)
    @PostMapping("/add-mood")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addMood(@RequestBody DiaryBoard diaryBoard,
                                     Authentication authentication) {
        if (diaryBoardService.validate(diaryBoard)) {
            diaryBoardService.add(diaryBoard, authentication);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam(defaultValue = "1") Integer page,
                                    @RequestParam(value = "type", required = false) String searchType,
                                    @RequestParam(value = "keyword", defaultValue = "") String keyword,
                                    @RequestParam(value = "memberId", required = false) Integer memberId) {
        return diaryBoardService.list(page, searchType, keyword, memberId);
    }

    @GetMapping("/{id}")
    public ResponseEntity get(@PathVariable Integer id) {

        DiaryBoard diaryBoard = diaryBoardService.get(id);
        if (diaryBoard == null) {
            return ResponseEntity.notFound().build();
        } else {
            return ResponseEntity.ok().body(diaryBoard);
        }

    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity delete(@PathVariable Integer id, Authentication authentication, @RequestParam(required = false) Integer memberId) {
        if (diaryBoardService.hasAccess(id, authentication, memberId)) {
            diaryBoardService.remove(id);
            return ResponseEntity.ok().build();

        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

    }

    @PutMapping("/edit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity edit(DiaryBoard diaryBoard,
//                               @RequestParam(value = "removeFileList[]", required = false) List<String> removeFileList,
//                               @RequestParam(value = "addFileList[]", required = false) MultipartFile[] addFileList,
                               Authentication authentication,
                               @RequestParam(required = false) Integer memberId) throws IOException {
        if (!diaryBoardService.hasAccess(diaryBoard.getId(), authentication, memberId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (diaryBoardService.validate(diaryBoard)) {
            diaryBoardService.edit(diaryBoard
//                    , removeFileList, addFileList
            );
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("profile/{ownerId}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Integer ownerId) {
        Map<String, Object> response = new HashMap<>();
        DiaryProfile diaryProfile = diaryProfileService.getProfileByMemberId(ownerId);

        // diaryProfile이 null인 경우 기본 값 설정
        if (diaryProfile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        response.put("status_message", diaryProfile.getStatusMessage());
        response.put("introduction", diaryProfile.getIntroduction());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity createProfile(@RequestBody Map<String, Object> data) {
        Integer ownerId = (Integer) data.get("ownerId");
        String statusMessage = (String) data.get("status_message");
        String introduction = (String) data.get("introduction");
        try {
            if (!diaryProfileService.profileExists(ownerId)) {
                diaryProfileService.createProfile(ownerId, statusMessage, introduction);
                return ResponseEntity.status(HttpStatus.CREATED).build();
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT).build(); // 이미 존재할 경우 충돌 응답
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/profile/{ownerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity updateProfile(@PathVariable Integer ownerId, @RequestBody Map<String, Object> data) {
        String statusMessage = (String) data.get("status_message");
        String introduction = (String) data.get("introduction");
        try {
            if (diaryProfileService.profileExists(ownerId)) {
                diaryProfileService.updateProfile(ownerId, statusMessage, introduction);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build(); // 데이터가 없을 경우 Not Found 응답
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/mood-stats")
    public List<MoodStat> getMonthlyMoodStats(@RequestParam Integer memberId,
                                              @RequestParam String yearMonth) {
        return diaryBoardService.getMonthlyMoodStats(memberId, yearMonth);
    }
}