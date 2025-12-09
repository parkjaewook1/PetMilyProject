package com.backend.security;

import com.backend.domain.member.LoginEntity;
import com.backend.domain.member.RefreshEntity;
import com.backend.mapper.member.LoginCheckMapper;
import com.backend.mapper.member.RefreshMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.sql.Timestamp;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class CustomLoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;
    private final LoginCheckMapper loginCheckMapper;

    public CustomLoginFilter(AuthenticationManager authenticationManager, JWTUtil jwtUtil, RefreshMapper refreshMapper, LoginCheckMapper loginCheckMapper) {

        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
        this.loginCheckMapper = loginCheckMapper;

        // 커스텀 로그인 경로 설정
        setFilterProcessesUrl("/api/member/login");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {

        String username = request.getParameter("username");
        String password = request.getParameter("password");

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password);

        return authenticationManager.authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authentication) {

        // 유저 정보
        String username = authentication.getName();
        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        Integer id = customUserDetails.getId();
        String nickname = customUserDetails.getNickname();

        // LoginCheck
        LoginEntity existingRecord = loginCheckMapper.findByMemberNickname(nickname);
        if (existingRecord == null) {
            existingRecord = new LoginEntity();
            existingRecord.setMemberNickname(nickname);
        }
        existingRecord.setLoginCheck(true);
        loginCheckMapper.upsertLoginCheck(existingRecord);

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();
        String role = auth.getAuthority();

        // 토큰 생성
        Integer userId = customUserDetails.getId();
        String access = jwtUtil.createJwt("access", username, role, userId, 600000L); // 10분
        String refresh = jwtUtil.createJwt("refresh", username, role, userId, 36000000L); // 10시간

        // 1. 쿠키 설정 (기존 방식 유지 - 로컬용)
        Cookie deleteCookie = new Cookie("refresh", null);
        deleteCookie.setMaxAge(0);
        deleteCookie.setPath("/");
        response.addCookie(deleteCookie);

        addRefreshEntity(username, refresh, 36000000L);
        response.addCookie(createCookie("refresh", refresh));

        try {
            // 2. JSON 응답 생성 (여기에 refresh 추가!)
            Map<String, String> data = new HashMap<>();
            data.put("id", id.toString());
            data.put("nickname", nickname);
            data.put("access", access);

            // ⚡️ [추가] 쿠키가 안 될 때를 대비해 body에도 넣어줍니다.
            data.put("refresh", refresh);

            String jsonData = new ObjectMapper().writeValueAsString(data);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(jsonData);
            response.getWriter().flush();

        } catch (Exception e) {
            e.printStackTrace();
        }

        response.setStatus(HttpStatus.OK.value());
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) {
        response.setStatus(401);
    }

    private void addRefreshEntity(String username, String refresh, Long expiredMs) {
        Timestamp expiration = new Timestamp(System.currentTimeMillis() + expiredMs);
        RefreshEntity refreshEntity = new RefreshEntity();
        refreshEntity.setUsername(username);
        refreshEntity.setRefresh(refresh);
        refreshEntity.setExpiration(expiration);
        refreshMapper.insertbyRefresh(refreshEntity);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setMaxAge(24 * 60 * 60);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setSecure(false); // ⚠️ HTTP 환경 필수
        return cookie;
    }
}