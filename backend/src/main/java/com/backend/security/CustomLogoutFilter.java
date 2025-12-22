package com.backend.security;

import com.backend.mapper.member.LoginCheckMapper;
import com.backend.mapper.member.RefreshMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.GenericFilterBean;

import java.io.IOException;

public class CustomLogoutFilter extends GenericFilterBean {

    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;
    private final LoginCheckMapper loginCheckMapper;

    public CustomLogoutFilter(JWTUtil jwtUtil, RefreshMapper refreshMapper, LoginCheckMapper loginCheckMapper) {
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
        this.loginCheckMapper = loginCheckMapper;
        System.out.println("=== CustomLogoutFilter Bean 생성됨 ===");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String uri = req.getRequestURI();
        String method = req.getMethod();

        // 로그아웃 요청이 아니면 통과
        if (!"/api/member/logout".equals(uri) || !"POST".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        System.out.println("=== CustomLogoutFilter 실행됨 ===");
        System.out.println("URI: " + uri + ", Method: " + method);

        processLogout(req, res);
    }

    private void processLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {

        // 1) refresh 쿠키 추출
        String refresh = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            System.out.println("[DEBUG] 요청에 포함된 쿠키 목록:");
            for (Cookie c : cookies) {
                System.out.println(" - " + c.getName() + "=" + c.getValue());
                if ("refresh".equals(c.getName())) {
                    refresh = c.getValue();
                }
            }
        } else {
            System.out.println("[DEBUG] 요청에 쿠키가 전혀 없음");
        }

        // 2) refresh 토큰 존재 여부 확인
        if (refresh == null || refresh.isBlank()) {
            System.out.println("[DEBUG] refresh 쿠키 없음 → 400 반환");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 3) refresh 토큰 만료 여부 확인 (✅ boolean 기반)
        if (jwtUtil.isExpired(refresh)) {
            System.out.println("[DEBUG] refresh 토큰 만료됨 → 400 반환");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 4) refresh 토큰 카테고리 확인
        String category = jwtUtil.getCategory(refresh);
        System.out.println("[DEBUG] refresh 토큰 category=" + category);

        if (!"refresh".equals(category)) {
            System.out.println("[DEBUG] category 불일치 → 400 반환");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 5) DB에 refresh 토큰 존재 여부 확인
        boolean exists = refreshMapper.existsByRefresh(refresh);
        System.out.println("[DEBUG] DB에 refresh 존재 여부=" + exists);

        if (!exists) {
            System.out.println("[DEBUG] DB에 refresh 없음 → 400 반환");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 6) refresh 토큰 DB에서 삭제
        int result = refreshMapper.deleteByRefresh(refresh);
        System.out.println("[DEBUG] refresh 토큰 삭제 결과=" + result);

        // 7) 로그인 상태 업데이트
        String nickname = request.getParameter("nickname");
        System.out.println("[DEBUG] nickname=" + nickname + " → 로그인 상태 false로 업데이트");
        loginCheckMapper.updatedLoginCheck(nickname);

        // 8) refresh 쿠키 제거 (✅ 로그인과 secure 통일)
        Cookie cookie = new Cookie("refresh", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);

        // ✅ 로그인에서 secure=false로 발급했으면 삭제도 false로 맞춰야 잘 지워짐
        cookie.setSecure(false);

        response.addCookie(cookie);
        System.out.println("[DEBUG] refresh 쿠키 제거 완료");

        // 9) 최종 응답
        response.setStatus(HttpServletResponse.SC_OK);
        System.out.println("[DEBUG] 로그아웃 처리 완료 → 200 반환");
    }
}
