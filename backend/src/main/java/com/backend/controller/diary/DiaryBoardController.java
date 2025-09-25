package com.backend.controller.diary;

import com.backend.domain.diary.DiaryBoard;
import com.backend.security.CustomUserDetails;
import com.backend.service.diary.DiaryBoardService;
import com.backend.service.diary.DiaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/diaryBoard")
@RequiredArgsConstructor
@Slf4j
public class DiaryBoardController {

    private final DiaryBoardService diaryBoardService;
    private final DiaryService diaryService; // memberId로 diary PK 조회용

    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addDiary(
            @ModelAttribute DiaryBoard diaryBoard,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal CustomUserDetails user,
            Authentication authentication
    ) {
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 로그인한 사용자 기준으로 diary 조회
        var diary = diaryService.getDiaryByMemberId(user.getId());
        if (diary == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // DB 저장용 diaryId 세팅
        diaryBoard.setDiaryId(diary.getId());

        if (!diaryBoardService.validate(diaryBoard)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            diaryBoardService.add(diaryBoard, files, authentication);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            log.error("Error adding diary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/add-mood")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addMood(@RequestBody DiaryBoard diaryBoard,
                                     @AuthenticationPrincipal CustomUserDetails user,
                                     Authentication authentication) {
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
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
                                    @RequestParam(value = "memberId", required = false) Integer memberId,
                                    @RequestParam(value = "diaryId", required = false) Integer diaryId) {
        return diaryBoardService.list(page, searchType, keyword, memberId, diaryId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Integer id) {
        DiaryBoard diaryBoard = diaryBoardService.get(id);
        return diaryBoard == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(diaryBoard);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable Integer id,
                                    Authentication authentication,
                                    @RequestParam(required = false) Integer memberId) {
        if (diaryBoardService.hasAccess(id, authentication, memberId)) {
            diaryBoardService.remove(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping("/edit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> edit(DiaryBoard diaryBoard,
                                  @AuthenticationPrincipal CustomUserDetails user,
                                  Authentication authentication,
                                  @RequestParam(required = false) Integer memberId) throws IOException {
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!diaryBoardService.hasAccess(diaryBoard.getId(), authentication, memberId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (diaryBoardService.validate(diaryBoard)) {
            diaryBoardService.edit(diaryBoard);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }


}