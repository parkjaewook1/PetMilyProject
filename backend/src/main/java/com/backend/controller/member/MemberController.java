package com.backend.controller.member;

import com.backend.domain.member.Member;
import com.backend.domain.member.Profile;
import com.backend.dto.member.PublicMemberProfile;
import com.backend.security.CustomUserDetails;
import com.backend.service.member.EmailSenderService;
import com.backend.service.member.MemberService;
import com.backend.service.member.AdminMemberService;
import com.backend.dto.member.AdminMemberPage;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final AdminMemberService adminMemberService;
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
    public ResponseEntity<PublicMemberProfile> getById(@PathVariable Integer id) {
        PublicMemberProfile profile = service.getProfile(id);
        return profile == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(profile);
    }

    // 회원 수정 (로그인 후)
    @PutMapping("/edit")
    public ResponseEntity<?> update(@AuthenticationPrincipal CustomUserDetails principal,
                                    @RequestBody Member member) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (service.update(principal.getId(), member)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ✅ 관리자/본인: 특정 회원(id) 수정
    @PutMapping("/edit/{id}")
    public ResponseEntity<?> updateByAdminOrOwner(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Integer id,
            @RequestBody Member member
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 관리자 판별 (프로젝트에 맞게 조정 가능)
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        boolean isOwner = principal.getId().equals(id);

        // 관리자도 아니고 본인도 아니면 금지
        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // ✅ 여기서 핵심: 수정 대상은 principal이 아니라 PathVariable id
        if (service.update(id, member)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "프로필 이미지 저장에 실패했습니다."));
        }
    }

    // 프로필 이미지 삭제 (로그인 후)
    @DeleteMapping("/profile")
    public ResponseEntity<String> deleteProfileImage(@AuthenticationPrincipal CustomUserDetails principal) {
        try {
            service.deleteProfileByMemberId(principal.getId());
            return ResponseEntity.ok("프로필 이미지 삭제 성공");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("프로필 이미지 삭제에 실패했습니다.");
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

    // Separate from DELETE /api/member (self-service withdrawal).
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteByAdministrator(@PathVariable Integer id) {
        try {
            adminMemberService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "연관 데이터가 있어 회원을 삭제할 수 없습니다."));
        }
    }

    @GetMapping("/list")
    public AdminMemberPage getMemberList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return adminMemberService.list(page, pageSize);
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
        emailSenderService.createMail(username);
        return ResponseEntity.ok("안내 메일을 전송했습니다.");
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