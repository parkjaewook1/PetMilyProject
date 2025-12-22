package com.backend.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JWTUtil {

    private final SecretKey secretKey;

    // Access / Refresh 만료 시간 상수
    public static final long ACCESS_TOKEN_EXP_MS = 1000L * 60 * 60 * 2;        // 2시간
    public static final long REFRESH_TOKEN_EXP_MS = 1000L * 60 * 60 * 24 * 14; // 14일

    public JWTUtil(@Value("${jwt.secret.key}") String secret) {
        System.out.println("Loaded JWT Secret Key: " + secret);
        this.secretKey = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm()
        );
    }

    // ====== 토큰 Claim Getter ======
    public String getCategory(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("category", String.class);
    }

    public String getUsername(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("username", String.class);
    }

    public String getRole(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    public Integer getUserId(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("userId", Integer.class);
    }

    // ====== 토큰 만료 여부 ======
    public boolean isExpired(String token) {
        try {
            Date exp = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration();
            return exp.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    // ====== 토큰 생성 (표준화) ======
    public String createAccessToken(String username, String role, Integer userId) {
        return createJwt("access", username, role, userId, ACCESS_TOKEN_EXP_MS);
    }

    public String createRefreshToken(String username, String role, Integer userId) {
        return createJwt("refresh", username, role, userId, REFRESH_TOKEN_EXP_MS);
    }

    public String createJwt(String category, String username, String role, Integer userId, Long expiredMs) {
        // ✅ 여기서 한 번에 방어 처리 (로그인/재발급 어디서 호출해도 안전)
        if (category == null || category.isBlank()) category = "access";
        if (username == null) username = "";
        if (role == null || role.isBlank()) role = "ROLE_USER";
        if (userId == null) userId = 0;
        if (expiredMs == null || expiredMs <= 0) expiredMs = ACCESS_TOKEN_EXP_MS;

        return Jwts.builder()
                .claim("category", category)
                .claim("username", username)
                .claim("role", role)
                .claim("userId", userId)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(secretKey)
                .compact();
    }
}
