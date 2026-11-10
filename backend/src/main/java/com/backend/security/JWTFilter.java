package com.backend.security;

import com.backend.domain.member.Member;
import com.backend.domain.member.Role;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // An expired access header must not block independently authenticated refresh rotation.
        return "POST".equals(request.getMethod()) &&
                (request.getContextPath() + "/api/member/reissue").equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 1. 헤더에서 Authorization 키를 찾음 (표준 방식 복구)
        String authorization = request.getHeader("Authorization");

        // Authorization 헤더가 없거나 Bearer 로 시작하지 않으면 다음 필터로 넘김 (비회원 등)
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String accessToken = authorization.substring(7).trim();
            if (jwtUtil.isExpired(accessToken) || !"access".equals(jwtUtil.getCategory(accessToken))) {
                unauthorized(response);
                return;
            }
            String username = jwtUtil.getUsername(accessToken);
            String role = jwtUtil.getRole(accessToken);
            Integer userId = jwtUtil.getUserId(accessToken);
            if (username == null || username.isBlank() || userId == null || userId < 1) {
                unauthorized(response);
                return;
            }
            Member member = new Member();
            member.setUsername(username);
            // Both existing token spellings resolve to exactly ROLE_ADMIN / ROLE_USER.
            try {
                String roleName = role != null && role.startsWith("ROLE_") ? role.substring(5) : role;
                member.setRole(Role.valueOf(roleName));
            } catch (IllegalArgumentException | NullPointerException error) {
                member.setRole(Role.USER);
            }
            member.setId(userId);
            CustomUserDetails principal = new CustomUserDetails(member);
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        } catch (JwtException | IllegalArgumentException | NullPointerException error) {
            // Parse/signature/claim failures are authentication failures, never HTTP 500.
            unauthorized(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"unauthorized\"}");
    }
}