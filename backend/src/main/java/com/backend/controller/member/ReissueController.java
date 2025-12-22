package com.backend.controller.member;

import com.backend.domain.member.RefreshEntity;
import com.backend.mapper.member.RefreshMapper;
import com.backend.security.JWTUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
public class ReissueController {

    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;

    public ReissueController(JWTUtil jwtUtil, RefreshMapper refreshMapper) {
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
    }

    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {

        System.out.println("=== /api/member/reissue 호출됨 ===");

        // 1) Refresh token 추출 (쿠키 우선)
        String refresh = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refresh".equals(cookie.getName())) {
                    refresh = cookie.getValue();
                    break;
                }
            }
        }

        // 쿠키에 없으면 헤더(Refresh-Token)에서도 확인
        if (refresh == null) {
            refresh = request.getHeader("Refresh-Token");
            System.out.println("헤더에서 찾은 refresh: " + refresh);
        }

        // refresh 자체가 없으면 400
        if (refresh == null || refresh.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("refresh token null");
        }

        // 2) 만료 확인 -> 만료면 401
        if (jwtUtil.isExpired(refresh)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("refresh token expired");
        }

        // 3) category 확인 (refresh 토큰인지) -> 아니면 401
        String category = jwtUtil.getCategory(refresh);
        if (!"refresh".equals(category)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid refresh token");
        }

        // 4) DB 존재 여부 확인 -> 없으면 401
        if (!refreshMapper.existsByRefresh(refresh)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid refresh token");
        }

        // 5) 토큰 정보 추출
        String username = jwtUtil.getUsername(refresh);
        String role = jwtUtil.getRole(refresh);
        Integer userId = jwtUtil.getUserId(refresh);

        // 6) JWT 신규 발급 (✅ 표준화된 API 사용)
        String newAccess = jwtUtil.createAccessToken(username, role, userId);
        String newRefresh = jwtUtil.createRefreshToken(username, role, userId);

        // 7) Refresh 토큰 DB 갱신 (✅ 만료시간 14일 통일)
        refreshMapper.deleteByRefresh(refresh);
        addRefreshEntity(username, newRefresh, JWTUtil.REFRESH_TOKEN_EXP_MS);

        // 8) 응답 설정
        response.setHeader("access", newAccess);
        response.setHeader("Refresh-Token", newRefresh);
        response.addCookie(createCookie("refresh", newRefresh));

        // body에도 같이 내려주기(프론트 통일 쉬움)
        Map<String, String> tokenMap = new HashMap<>();
        tokenMap.put("access", newAccess);
        tokenMap.put("refresh", newRefresh);

        return ResponseEntity.ok(tokenMap);
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
        cookie.setMaxAge((int) (JWTUtil.REFRESH_TOKEN_EXP_MS / 1000));
        cookie.setSecure(false); // ✅ https 배포면 true + SameSite 고려
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        return cookie;
    }
}
