package com.backend.security;

import com.backend.domain.member.Member;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;

public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();

        return path.equals("/api/member/login")
                || path.equals("/api/member/signup")
                || path.equals("/api/member/reissue")
                || path.startsWith("/api/diaryBoard/list")
                || path.startsWith("/api/diaryBoard/view")
                || path.startsWith("/api/diaryComment/list")
                || path.startsWith("/api/posts");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("[JWTFilter] URI=" + request.getRequestURI() + ", Method=" + request.getMethod());

        String accessToken = request.getHeader("access");
        if (accessToken == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7);
            }
        }
        System.out.println("[JWTFilter] accessToken=" + accessToken);

        // access 없음 → refresh 쿠키로 재발급 시도
        if (accessToken == null) {
            System.out.println("[JWTFilter] access token 없음 → refresh 쿠키 확인");

            String refreshToken = null;
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                refreshToken = Arrays.stream(cookies)
                        .filter(c -> "refresh".equals(c.getName()))
                        .map(Cookie::getValue)
                        .filter(v -> v != null && !v.trim().isEmpty())
                        .reduce((first, second) -> second)
                        .orElse(null);
            }
            System.out.println("[JWTFilter] refreshToken=" + refreshToken);

            if (refreshToken != null) {
                try {
                    jwtUtil.isExpired(refreshToken);
                    String category = jwtUtil.getCategory(refreshToken);
                    if (!"refresh".equals(category)) {
                        System.out.println("[JWTFilter] 401: refresh 카테고리 아님");
                        unauthorized(response, "invalid refresh token");
                        return;
                    }

                    String username = jwtUtil.getUsername(refreshToken);
                    String role = jwtUtil.getRole(refreshToken);
                    Long userId = jwtUtil.getUserId(refreshToken);

                    // null 방지 기본값
                    if (role == null || role.isBlank()) role = "ROLE_USER";
                    if (username == null) username = "";

                    System.out.println("[JWTFilter] refresh OK: username=" + username + ", role=" + role + ", userId=" + userId);

                    // 새 access 토큰 발급 (userId 포함)
                    String newAccess = jwtUtil.createAccessToken(username, role, userId);
                    response.setHeader("access", newAccess);

                    // principal 구성
                    Member member = new Member();
                    member.setUsername(username);
                    member.setPassword("password");
                    member.setTokenRole(role);
                    if (userId != null) member.setId(userId.intValue());

                    CustomUserDetails principal = new CustomUserDetails(member);
                    Authentication authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    System.out.println("[JWTFilter] refresh로 인증 세팅 완료 → username=" + username);

                } catch (io.jsonwebtoken.ExpiredJwtException e) {
                    System.out.println("[JWTFilter] 401: refresh 만료");
                    unauthorized(response, "refresh token expired");
                    return;
                } catch (Exception e) {
                    System.out.println("[JWTFilter] 401: refresh 검증 실패: " + e.getMessage());
                    unauthorized(response, "invalid refresh token");
                    return;
                }
            } else {
                System.out.println("[JWTFilter] 401: access도 refresh도 없음");
                unauthorized(response, "no token");
                return;
            }

            filterChain.doFilter(request, response);
            return;
        }

        // access 토큰 검증
        try {
            if (jwtUtil.isExpired(accessToken)) {
                System.out.println("[JWTFilter] 401: access 만료");
                unauthorized(response, "access token expired");
                return;
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.out.println("[JWTFilter] 401: access 만료(예외)");
            unauthorized(response, "access token expired");
            return;
        } catch (Exception e) {
            System.out.println("[JWTFilter] 401: access 검증 실패: " + e.getMessage());
            unauthorized(response, "invalid access token");
            return;
        }

        String category = jwtUtil.getCategory(accessToken);
        if (!"access".equals(category)) {
            System.out.println("[JWTFilter] 401: category 불일치(" + category + ")");
            unauthorized(response, "invalid access token");
            return;
        }

        String username = jwtUtil.getUsername(accessToken);
        String role = jwtUtil.getRole(accessToken);
        Long userId = null;
        try {
            userId = jwtUtil.getUserId(accessToken);
        } catch (Exception ignore) { /* 구 토큰 대비 */ }

        // null 방지 기본값
        if (role == null || role.isBlank()) role = "ROLE_USER";
        if (username == null) username = "";

        System.out.println("[JWTFilter] access OK: username=" + username + ", role=" + role + ", userId=" + userId);

        // principal 구성
        Member member = new Member();
        member.setUsername(username);
        member.setPassword("password");
        member.setTokenRole(role);
        if (userId != null) member.setId(userId.intValue());

        CustomUserDetails customUserDetails = new CustomUserDetails(member);

        Authentication authToken = new UsernamePasswordAuthenticationToken(
                customUserDetails, null, customUserDetails.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("text/plain;charset=UTF-8");
        try (PrintWriter writer = response.getWriter()) {
            writer.print(message);
        }
    }
}