package com.backend.controller.member;

import com.backend.domain.member.RefreshEntity;
import com.backend.mapper.member.RefreshMapper;
import com.backend.mapper.member.MemberMapper;
import com.backend.domain.member.Member;
import io.jsonwebtoken.JwtException;
import org.springframework.transaction.annotation.Transactional;
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
    private final MemberMapper memberMapper;

    public ReissueController(JWTUtil jwtUtil, RefreshMapper refreshMapper, MemberMapper memberMapper) {
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
        this.memberMapper = memberMapper;
    }

    @Transactional
    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {


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
        }

        // refresh 자체가 없으면 400
        if (refresh == null || refresh.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("refresh token null");
        }

        String username;
        Integer userId;
        try {
            if (jwtUtil.isExpired(refresh) || !"refresh".equals(jwtUtil.getCategory(refresh))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            username = jwtUtil.getUsername(refresh);
            userId = jwtUtil.getUserId(refresh);
        } catch (JwtException | IllegalArgumentException | NullPointerException error) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        RefreshEntity stored = refreshMapper.findByRefresh(refresh);
        Member current = userId == null ? null : memberMapper.selectAuthorizationById(userId);
        if (stored == null || current == null || username == null ||
                !username.equals(current.getUsername()) || !username.equals(stored.getUsername()) ||
                stored.getExpiration() == null || stored.getExpiration().before(new Timestamp(System.currentTimeMillis()))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // Rotate only once, and derive privileges from the current DB record, never the old refresh claim.
        if (refreshMapper.deleteByRefresh(refresh) < 1) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String role = current.getTokenRole();
        String newAccess = jwtUtil.createAccessToken(username, role, userId);
        String newRefresh = jwtUtil.createRefreshToken(username, role, userId);
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
