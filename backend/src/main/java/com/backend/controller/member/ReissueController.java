package com.backend.controller.member;

import com.backend.domain.member.RefreshEntity;
import com.backend.mapper.member.RefreshMapper;
import com.backend.security.JWTUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;

@RestController
@RequestMapping("/api/member")
public class ReissueController {

    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;

    // Access/Refresh 토큰 만료 시간 상수
    private static final long ACCESS_EXPIRE_MS = 600000L;     // 10분
    private static final long REFRESH_EXPIRE_MS = 36000000L;  // 10시간

    public ReissueController(JWTUtil jwtUtil, RefreshMapper refreshMapper) {
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
    }

    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {

        System.out.println("=== /api/member/reissue 호출됨 ===");

        // 1. Refresh token 추출
        String refresh = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.println("쿠키 이름: " + cookie.getName() + ", 값: " + cookie.getValue());
                if ("refresh".equals(cookie.getName())) {
                    refresh = cookie.getValue();
                }
            }
        }
        System.out.println("받은 refresh: " + refresh);

        if (refresh == null) {
            return new ResponseEntity<>("refresh token null", HttpStatus.BAD_REQUEST);
        }

        // 2. 만료 확인
        try {
            jwtUtil.isExpired(refresh);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("refresh token expired", HttpStatus.BAD_REQUEST);
        }

        // 3. category 확인
        String category = jwtUtil.getCategory(refresh);
        if (!"refresh".equals(category)) {
            return new ResponseEntity<>("invalid refresh token", HttpStatus.BAD_REQUEST);
        }

        // 4. DB 존재 여부 확인
        if (!refreshMapper.existsByRefresh(refresh)) {
            return new ResponseEntity<>("invalid refresh token", HttpStatus.BAD_REQUEST);
        }

        // 5. 토큰 정보 추출
        String username = jwtUtil.getUsername(refresh);
        String role = jwtUtil.getRole(refresh);
        Integer userId = jwtUtil.getUserId(refresh);

        // role null 방지
        if (role == null || role.isBlank()) {
            role = "ROLE_USER";
        }

        System.out.println("username: " + username + ", role: " + role + ", userId: " + userId);

        // 6. JWT 신규 발급 (userId 포함)
        String newAccess = jwtUtil.createJwt("access", username, role, userId, ACCESS_EXPIRE_MS);
        String newRefresh = jwtUtil.createJwt("refresh", username, role, userId, REFRESH_EXPIRE_MS);

        // 7. Refresh 토큰 DB 갱신
        refreshMapper.deleteByRefresh(refresh);
        addRefreshEntity(username, newRefresh, REFRESH_EXPIRE_MS);

        // 8. 응답 헤더/쿠키 설정
        response.setHeader("access", newAccess);
        response.addCookie(createCookie("refresh", newRefresh));

        return new ResponseEntity<>(HttpStatus.OK);
    }

    private void addRefreshEntity(String username, String refresh, long expiredMs) {
        Timestamp expiration = new Timestamp(System.currentTimeMillis() + expiredMs);
        RefreshEntity refreshEntity = new RefreshEntity();
        refreshEntity.setUsername(username);
        refreshEntity.setRefresh(refresh);
        refreshEntity.setExpiration(expiration);
        refreshMapper.insertbyRefresh(refreshEntity);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setMaxAge((int) (REFRESH_EXPIRE_MS / 1000)); // 초 단위
        cookie.setSecure(false); // HTTPS 환경이면 true
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        return cookie;
    }
}