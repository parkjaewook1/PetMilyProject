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

    // ✅ [수정 1] shouldNotFilter는 굳이 필요 없습니다.
    // 모든 요청을 검사하되, 토큰 없으면 넘기면 되기 때문입니다.
    // 헷갈리지 않게 그대로 두거나 지워도 되지만, 로직이 수정되면 없어도 무방합니다.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        return false; // 모든 요청이 doFilterInternal을 거치도록 변경 (내부에서 처리함)
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

        // 1. Access 토큰이 없는 경우 (비회원 혹은 만료 후 재접속)
        if (accessToken == null) {
            System.out.println("[JWTFilter] access token 없음 → refresh 쿠키 확인 시도");

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

            // 2. Refresh 토큰이 있다면? (자동 로그인 시도)
            if (refreshToken != null) {
                System.out.println("[JWTFilter] refresh 토큰 발견됨");
                try {
                    jwtUtil.isExpired(refreshToken);
                    String category = jwtUtil.getCategory(refreshToken);

                    if (!"refresh".equals(category)) {
                        // 리프레시 토큰이 이상하면 -> 그냥 비회원 취급하고 넘김 (401 아님)
                        System.out.println("[JWTFilter] refresh 카테고리 불일치 -> 비회원으로 진행");
                        filterChain.doFilter(request, response);
                        return;
                    }

                    String username = jwtUtil.getUsername(refreshToken);
                    String role = jwtUtil.getRole(refreshToken);
                    Long userId = jwtUtil.getUserId(refreshToken);

                    if (role == null || role.isBlank()) role = "ROLE_USER";
                    if (username == null) username = "";

                    // 새 access 토큰 발급
                    String newAccess = jwtUtil.createAccessToken(username, role, userId);
                    response.setHeader("access", newAccess);

                    // 인증 객체 생성
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

                    System.out.println("[JWTFilter] Refresh 토큰으로 자동 인증 성공");

                } catch (io.jsonwebtoken.ExpiredJwtException e) {
                    // 리프레시마저 만료됐다면? -> 비회원으로 진행 (로그인 페이지로 튕기는 건 프론트 몫)
                    System.out.println("[JWTFilter] Refresh 토큰 만료 -> 비회원으로 진행");
                } catch (Exception e) {
                    System.out.println("[JWTFilter] Refresh 검증 오류 -> 비회원으로 진행");
                }
            } else {
                // 3. ⛔ [핵심 수정] Access도 없고 Refresh도 없다면? (완전한 비회원/게스트)
                // 기존: 401 에러 리턴 (unauthorized)
                // 수정: 그냥 다음 필터로 진행 (SecurityConfig가 알아서 판단)
                System.out.println("[JWTFilter] 토큰 없음 -> 비회원(Guest) 상태로 진행");
            }

            // 토큰 없거나 실패했으면 그냥 다음 단계로 (비회원 접근 허용 URL이면 통과됨)
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Access 토큰이 있는 경우 검증
        try {
            jwtUtil.isExpired(accessToken);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            // Access 만료 시 -> 401을 줘서 프론트가 reissue를 요청하게 유도
            // (단, 비회원 페이지 조회 중이라면 그냥 넘겨도 되지만,
            // 보통 토큰을 달고 왔다는 건 로그인을 의도한 것이므로 401이 맞음)
            System.out.println("[JWTFilter] 401: access 만료");
            unauthorized(response, "access token expired");
            return;
        } catch (Exception e) {
            System.out.println("[JWTFilter] 401: access 검증 실패");
            unauthorized(response, "invalid access token");
            return;
        }

        String category = jwtUtil.getCategory(accessToken);
        if (!"access".equals(category)) {
            unauthorized(response, "invalid access token");
            return;
        }

        // 토큰 정상 -> 인증 객체 저장
        String username = jwtUtil.getUsername(accessToken);
        String role = jwtUtil.getRole(accessToken);
        Long userId = null;
        try {
            userId = jwtUtil.getUserId(accessToken);
        } catch (Exception ignore) {
        }

        if (role == null || role.isBlank()) role = "ROLE_USER";
        if (username == null) username = "";

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