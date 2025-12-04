package com.backend.controller.member;

import com.backend.domain.member.Member;
import com.backend.domain.member.Profile;
import com.backend.security.CustomUserDetails;
import com.backend.service.member.EmailSenderService;
import com.backend.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {

    private final MemberService service;
    private final EmailSenderService emailSenderService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity signup(@RequestBody Member member) {
        service.signup(member);
        return ResponseEntity.ok().build();
    }

    // 회원가입 전 username 중복 체크 (로그인 전)
    // 🔄 [수정] 리턴 타입을 String -> Boolean으로 변경
    @GetMapping(value = "/check", params = "username")
    public ResponseEntity<Boolean> checkUsername(@RequestParam("username") String username) {
        Member member = service.getByUsername(username);

        if (member == null) {
            // ✅ [수정] 사용 가능하면 true 반환 (200 OK)
            return ResponseEntity.ok(true);
        } else {
            // ❌ [수정] 중복이면 409 상태코드와 함께 false 반환 (혹은 그냥 상태코드만)
            return ResponseEntity.status(HttpStatus.CONFLICT).body(false);
        }
    }

    // 회원가입 및 수정 시 nickname 중복 체크
    // 🔄 [수정] 로그인한 사용자의 경우, 본인 닉네임은 중복 아님 처리
    @GetMapping(value = "/check", params = "nickname")
    public ResponseEntity<Boolean> checkNickname(
            @RequestParam("nickname") String nickname,
            @AuthenticationPrincipal CustomUserDetails principal) { // 👈 로그인 정보 추가

        Member member = service.getByNickname(nickname);

        if (member == null) {
            // 1. 닉네임을 쓰는 사람이 아예 없으면 -> 사용 가능 (true)
            return ResponseEntity.ok(true);
        } else {
            // 2. 누군가 쓰고 있음. 근데 그게 나인가?
            if (principal != null && member.getId().equals(principal.getId())) {
                // 로그인 상태이고, 찾은 회원의 ID가 내 ID와 같다면 -> 사용 가능 (true)
                return ResponseEntity.ok(true);
            }

            // 3. 남이 쓰고 있음 -> 중복 (false + 409)
            return ResponseEntity.status(HttpStatus.CONFLICT).body(false);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getById(@PathVariable Integer id,
                                          @AuthenticationPrincipal CustomUserDetails user) {
        // 로그인 안 한 경우 user가 null
        if (user != null) {
            System.out.println("로그인한 사용자 ID: " + user.getId());
        } else {
            System.out.println("비로그인 접근");
        }

        Member member = service.getById(id);
        if (member == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(member);
    }

    // 회원 수정 (로그인 후)
    @PutMapping("/edit")
    public ResponseEntity update(@AuthenticationPrincipal CustomUserDetails principal,
                                 @RequestBody Member member) {
        if (service.update(principal.getId(), member)) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 프로필 이미지 업로드 (로그인 후)
    @PostMapping("/profile")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam("profileImage") MultipartFile file) {
        try {
            service.saveProfileImage(principal.getId(), file);
            Profile profile = service.getProfileByMemberId(principal.getId());
            String imageUrl = service.getSrcPrefix() + profile.getUploadPath();

            Map<String, String> response = new HashMap<>();
            response.put("message", "프로필 이미지가 저장되었습니다.");
            response.put("profileImage", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "프로필 이미지 저장 실패: " + e.getMessage()));
        }
    }

    // 프로필 이미지 삭제 (로그인 후)
    @DeleteMapping("/profile")
    public ResponseEntity<String> deleteProfileImage(@AuthenticationPrincipal CustomUserDetails principal) {
        try {
            service.deleteProfileByMemberId(principal.getId());
            return ResponseEntity.ok("프로필 이미지 삭제 성공");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("프로필 이미지 삭제 실패: " + e.getMessage());
        }
    }

    // 회원 삭제 (로그인 후)
    @DeleteMapping
    public ResponseEntity delete(@AuthenticationPrincipal CustomUserDetails principal,
                                 @RequestParam(required = false) String password) {
        if (principal.getId() == 1 || (password != null && service.validatePassword(principal.getId(), password))) {
            service.delete(principal.getId());
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 회원 목록 (관리자 전용)
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getMemberList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Map<String, Object> response = service.list(page, pageSize);
        return ResponseEntity.ok(response);
    }

    // 비밀번호 찾기 페이지 (로그인 전)
    @GetMapping("/find")
    public String findPassword(Model model) {
        return "/member/find";
    }

    // 비밀번호 찾기 이메일 발송 (로그인 전)
    @Transactional
    @PostMapping("/sendEmail")
    public ResponseEntity<String> sendEmail(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        Member memberEmail = service.getByUsername(username);
        if (memberEmail == null) {
            return ResponseEntity.notFound().build();
        }
        String tempPassword = emailSenderService.createMail(username);
        return ResponseEntity.ok(tempPassword);
    }

    // OAuth 로그인 후 내 정보 조회 (로그인 후)
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.getMemberInfoById(principal.getId()));
    }

    // 다이어리 ID 검증 (로그인 여부 무관)
    @GetMapping("/validateDiaryId/{diaryId}")
    public ResponseEntity<Map<String, Object>> validateDiaryId(@PathVariable String diaryId) {
        Map<String, Object> response = new HashMap<>();
        Member member = service.getMemberByDiaryId(diaryId);

        if (member != null) {
            response.put("isValid", true);
            response.put("nickname", member.getNickname());
            response.put("ownerId", member.getId());
            return ResponseEntity.ok(response);
        } else {
            response.put("isValid", false);
            return ResponseEntity.ok(response);
        }
    }
}