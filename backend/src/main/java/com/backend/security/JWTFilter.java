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

        // 1. 헤더에서 access 토큰 꺼내기
        String accessToken = request.getHeader("access");

        // 토큰이 없으면? -> 그냥 통과시킵니다. (권한이 필요 없는 요청일 수도 있으니까요. SecurityConfig가 알아서 막아줍니다.)
        if (accessToken == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 만료 여부 확인 (⚡️ 여기가 핵심! 500 에러 방지)
        try {
            jwtUtil.isExpired(accessToken);
        } catch (ExpiredJwtException e) {
            // 만료되면 500 에러 대신 "access token expired" 메시지와 401 상태코드 반환
            // 프론트엔드가 이걸 보고 "아, 재발급 받아야겠구나" 하고 알 수 있음
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8"); // 단순 텍스트로 응답
            PrintWriter writer = response.getWriter();
            writer.print("access token expired");
            return; // 필터 종료 (더 이상 진행 안 함)
        }

        // 3. access 토큰인지 확인 (카테고리 검사)
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

        // ⚡️ [수정] Long -> Integer로 변경 (아까 수정한 JWTUtil에 맞춤)
        Integer userId = jwtUtil.getUserId(accessToken);

        // 5. 인증 객체 생성
        Member member = new Member();
        member.setUsername(username);
        member.setRole(Role.valueOf(role));
        // Member 엔티티의 ID 타입이 Integer라면 그대로 넣으면 됩니다.
        member.setId(userId);

        CustomUserDetails customUserDetails = new CustomUserDetails(member);
        Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());

        // 6. 세션에 등록 (일시적)
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}