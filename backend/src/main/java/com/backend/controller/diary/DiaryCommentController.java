package com.backend.controller.diary;

import com.backend.domain.diary.DiaryComment;
import com.backend.service.diary.DiaryCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/diaryComment")
public class DiaryCommentController {
    private final DiaryCommentService service;

    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DiaryComment> add(@RequestBody DiaryComment diaryComment,
                                            Authentication authentication) {
        try {
            // ✅ 다이어리 접근 제어
            if (!service.canAccessDiary(diaryComment.getDiaryId(), authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (service.validate(diaryComment)) {
                DiaryComment saved = service.add(diaryComment, authentication);
                return ResponseEntity.ok(saved);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ 부모 댓글 목록 (페이징, 대댓글 미리보기 포함)
    // ✅ 부모 댓글 목록 (페이징 + 검색)
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam Integer diaryId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "all") String type,      // ✅ 검색 타입
            @RequestParam(defaultValue = "") String keyword,      // ✅ 검색 키워드
            Authentication authentication) {

        // ✅ 다이어리 접근 제어
        if (!service.canAccessDiary(diaryId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("isValid", false, "message", "잘못된 접근"));
        }

        Map<String, Object> response = service.list(diaryId, page, pageSize, type, keyword);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> diaryDelete(@PathVariable Integer id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        DiaryComment target = service.get(id);
        if (target == null) {
            return ResponseEntity.notFound().build();
        }

        // ✅ 다이어리 접근 제어 + 댓글 권한 체크
        if (!service.canAccessDiary(target.getDiaryId(), authentication) ||
                !service.hasAccess(id, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.diaryDelete(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/edit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> edit(@RequestBody DiaryComment diaryComment, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // ✅ 다이어리 접근 제어 + 댓글 권한 체크
        if (!service.canAccessDiary(diaryComment.getDiaryId(), authentication) ||
                !service.hasAccess(diaryComment.getId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (service.validate(diaryComment)) {
            service.edit(diaryComment);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity get(@PathVariable Integer id, Authentication authentication) {
        DiaryComment diaryComment = service.get(id);
        if (diaryComment == null) {
            return ResponseEntity.notFound().build();
        }

        // ✅ 다이어리 접근 제어
        if (!service.canAccessDiary(diaryComment.getDiaryId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok().body(diaryComment);
    }

    // 최근 방명록 (대댓글 제외)
    @GetMapping("/{diaryId}/recent-comments")
    public ResponseEntity<List<DiaryComment>> getRecentComments(
            @PathVariable Integer diaryId,
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {

        if (!service.canAccessDiary(diaryId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(service.getRecentComments(diaryId, limit));
    }

    // ✅ 특정 댓글의 전체 대댓글 조회 (더보기 API)
    @GetMapping("/{id}/replies")
    public ResponseEntity<List<DiaryComment>> getAllReplies(@PathVariable Integer id,
                                                            Authentication authentication) {
        DiaryComment parent = service.get(id);
        if (parent == null) {
            return ResponseEntity.notFound().build();
        }

        if (!service.canAccessDiary(parent.getDiaryId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(service.getAllReplies(id));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DiaryComment>> all(@RequestParam Integer diaryId,
                                                  Authentication authentication) {
        if (!service.canAccessDiary(diaryId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(service.selectAllByDiaryId(diaryId));
    }
}