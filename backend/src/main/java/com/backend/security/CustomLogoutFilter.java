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


        processLogout(req, res);
    }

    private void processLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {

        // 1) refresh 쿠키 추출
        String refresh = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("refresh".equals(c.getName())) {
                    refresh = c.getValue();
                }
            }
        } else {
        }

        // 2) refresh 토큰 존재 여부 확인
        if (refresh == null || refresh.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 3) refresh 토큰 만료 여부 확인 (✅ boolean 기반)
        if (jwtUtil.isExpired(refresh)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 4) refresh 토큰 카테고리 확인
        String category = jwtUtil.getCategory(refresh);

        if (!"refresh".equals(category)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 5) DB에 refresh 토큰 존재 여부 확인
        boolean exists = refreshMapper.existsByRefresh(refresh);

        if (!exists) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 6) refresh 토큰 DB에서 삭제
        int result = refreshMapper.deleteByRefresh(refresh);

        // 7) 로그인 상태 업데이트
        String nickname = request.getParameter("nickname");
        loginCheckMapper.updatedLoginCheck(nickname);

        // 8) refresh 쿠키 제거 (✅ 로그인과 secure 통일)
        Cookie cookie = new Cookie("refresh", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);

        // ✅ 로그인에서 secure=false로 발급했으면 삭제도 false로 맞춰야 잘 지워짐
        cookie.setSecure(false);

        response.addCookie(cookie);

        // 9) 최종 응답
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
