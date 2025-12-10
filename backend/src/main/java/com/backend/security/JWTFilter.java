package com.backend.security;

import com.backend.domain.member.Member;
import com.backend.domain.member.Role;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.PrintWriter;

@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 1. 헤더에서 Authorization 키를 찾음 (표준 방식 복구)
        String authorization = request.getHeader("Authorization");

        // Authorization 헤더가 없거나 Bearer 로 시작하지 않으면 다음 필터로 넘김 (비회원 등)
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // "Bearer " (7글자)를 제거하고 순수 토큰만 추출
        String accessToken = authorization.split(" ")[1];

        // 2. 만료 여부 확인 (500 에러 방지용 예외 처리)
        try {
            jwtUtil.isExpired(accessToken);
        } catch (ExpiredJwtException e) {
            // 만료 시 401 응답 + 메시지 전송 (프론트 재발급 트리거)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            PrintWriter writer = response.getWriter();
            writer.print("access token expired");
            return;
        }

        // 3. 토큰 카테고리 확인 (access 토큰인지)
        String category = jwtUtil.getCategory(accessToken);
        if (!category.equals("access")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            PrintWriter writer = response.getWriter();
            writer.print("invalid access token");
            return;
        }

        // 4. 사용자 정보 추출
        String username = jwtUtil.getUsername(accessToken);
        String role = jwtUtil.getRole(accessToken);
        Integer userId = jwtUtil.getUserId(accessToken); // Integer 타입 유지

        // 5. 인증 객체 생성
        Member member = new Member();
        member.setUsername(username);

        // ⚡️ [수정됨] Role 변환 로직 (500 에러 해결)
        // 토큰의 "ROLE_USER"를 Enum의 "USER"로 변환합니다.
        try {
            String roleName = role;
            if (role.startsWith("ROLE_")) {
                roleName = role.replace("ROLE_", ""); // "ROLE_" 제거
            }
            member.setRole(Role.valueOf(roleName));
        } catch (IllegalArgumentException | NullPointerException e) {
            // 매칭되는 Role이 없거나 null일 경우 안전하게 기본값 설정
            member.setRole(Role.USER);
        }

        member.setId(userId);

        CustomUserDetails customUserDetails = new CustomUserDetails(member);
        Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());

        // 6. 세션에 등록
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}