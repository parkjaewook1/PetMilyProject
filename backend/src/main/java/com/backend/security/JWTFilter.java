package com.backend.security;

import com.backend.domain.member.Member;
import com.backend.domain.member.OAuth2Member;
import com.backend.oauth2.CustomOAuth2User;
import io.jsonwebtoken.ExpiredJwtException;
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
                || path.equals("/reissue")
                // ✅ 공개 조회 API
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

        System.out.println("[JWTFilter] 요청 URI = " + request.getRequestURI() + ", Method = " + request.getMethod());

        // === 요청 헤더 전체 출력 ===
        System.out.println("=== Incoming Headers ===");
        java.util.Collections.list(request.getHeaderNames())
                .forEach(name -> System.out.println(name + " = " + request.getHeader(name)));
        System.out.println("========================");

        // 1) 헤더에서 access 토큰 추출
        String accessToken = request.getHeader("access");

        if (accessToken == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7);
            }
        }
        System.out.println("[JWTFilter] 추출된 accessToken = " + accessToken);

        // 2) access 토큰이 없으면 refresh 쿠키 확인 및 재발급 처리
        if (accessToken == null) {
            System.out.println("access token null → refresh 쿠키 확인");

            String refreshToken = null;
            if (request.getCookies() != null) {
                refreshToken = Arrays.stream(request.getCookies())
                        .filter(c -> "refresh".equals(c.getName()))
                        .map(Cookie::getValue)
                        .filter(v -> v != null && !v.trim().isEmpty()) // JDK8 호환
                        .reduce((first, second) -> second) // 마지막 값 선택
                        .orElse(null);
            }

            System.out.println("선택된 refresh 토큰 = " + refreshToken);

            if (refreshToken != null) {
                try {
                    // refresh 토큰 만료 여부 확인
                    jwtUtil.isExpired(refreshToken);

                    // category 확인
                    String category = jwtUtil.getCategory(refreshToken);
                    if (!"refresh".equals(category)) {
                        throw new RuntimeException("invalid refresh token");
                    }

                    // refresh 토큰에서 사용자 정보 추출
                    String username = jwtUtil.getUsername(refreshToken);
                    String role = jwtUtil.getRole(refreshToken);

                    // 새 access 토큰 발급
                    String newAccess = jwtUtil.createJwt("access", username, role, 600000L); // 10분
                    response.setHeader("access", newAccess);

                    // ✅ 로그 추가
                    System.out.println("[JWTFilter] refresh 토큰 유효 → access 토큰 재발급");
                    System.out.println("[JWTFilter] 새 access 토큰 = " + newAccess);

                    // 인증 객체 생성 및 SecurityContext 저장
                    Member member = new Member();
                    member.setUsername(username);
                    member.setPassword("password");
                    member.setTokenRole(role);

                    Authentication authToken = new UsernamePasswordAuthenticationToken(
                            new CustomUserDetails(member), null,
                            new CustomUserDetails(member).getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // ✅ 인증 세팅 완료 로그
                    System.out.println("[JWTFilter] 인증 객체 세팅 완료 → username = " + username);

                } catch (ExpiredJwtException e) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().print("refresh token expired");
                    return;
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().print("invalid refresh token");
                    return;
                }
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().print("no token");
                return;
            }

            filterChain.doFilter(request, response);
            return;
        }

        // 3) access 토큰 만료 여부 확인
        try {
            jwtUtil.isExpired(accessToken);
        } catch (ExpiredJwtException e) {
            PrintWriter writer = response.getWriter();
            writer.print("access token expired");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 4) access 토큰 카테고리 확인
        String category = jwtUtil.getCategory(accessToken);
        if (!"access".equals(category)) {
            PrintWriter writer = response.getWriter();
            writer.print("invalid access token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 5) 토큰에서 사용자 정보 추출
        String username = jwtUtil.getUsername(accessToken);
        String role = jwtUtil.getRole(accessToken);

        Member member = new Member();
        member.setUsername(username);
        member.setPassword("password");
        member.setTokenRole(role);

        OAuth2Member oAuth2Member = new OAuth2Member();
        oAuth2Member.setUsername(username);
        oAuth2Member.setRole(role);

        CustomUserDetails customUserDetails = new CustomUserDetails(member);
        CustomOAuth2User customOAuth2User = new CustomOAuth2User(oAuth2Member);

        // 6) 인증 객체 생성 및 SecurityContext 저장
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                customUserDetails, null, customUserDetails.getAuthorities());
        Authentication authToken2 = new UsernamePasswordAuthenticationToken(
                customOAuth2User, null, customOAuth2User.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authToken);
        SecurityContextHolder.getContext().setAuthentication(authToken2);

        // 7) 다음 필터로 진행
        filterChain.doFilter(request, response);
    }
}