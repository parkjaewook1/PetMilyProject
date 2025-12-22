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

    public CustomLoginFilter(AuthenticationManager authenticationManager,
                             JWTUtil jwtUtil,
                             RefreshMapper refreshMapper,
                             LoginCheckMapper loginCheckMapper) {

        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
        this.loginCheckMapper = loginCheckMapper;

        // 커스텀 로그인 경로 설정
        setFilterProcessesUrl("/api/member/login");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        String username = request.getParameter("username");
        String password = request.getParameter("password");

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(username, password);

        return authenticationManager.authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authentication) {

        // 유저 정보
        String username = authentication.getName();
        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        Integer id = customUserDetails.getId();
        String nickname = customUserDetails.getNickname();
        Integer userId = customUserDetails.getId();

        // LoginCheck
        LoginEntity existingRecord = loginCheckMapper.findByMemberNickname(nickname);
        if (existingRecord == null) {
            existingRecord = new LoginEntity();
            existingRecord.setMemberNickname(nickname);
        }
        existingRecord.setLoginCheck(true);
        loginCheckMapper.upsertLoginCheck(existingRecord);

        // 권한(role)
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();
        String role = auth.getAuthority();

        // ✅ 토큰 생성: 표준 API 사용 (2시간 / 14일)
        String access = jwtUtil.createAccessToken(username, role, userId);
        String refresh = jwtUtil.createRefreshToken(username, role, userId);

        // 1) 기존 refresh 쿠키 제거(덮어쓰기 안정)
        Cookie deleteCookie = new Cookie("refresh", null);
        deleteCookie.setMaxAge(0);
        deleteCookie.setPath("/");
        response.addCookie(deleteCookie);

        // 2) Refresh DB 저장도 ✅ 14일로 통일
        addRefreshEntity(username, refresh, JWTUtil.REFRESH_TOKEN_EXP_MS);

        // 3) refresh 쿠키 재설정
        response.addCookie(createCookie("refresh", refresh));

        try {
            // 4) JSON 응답
            Map<String, String> data = new HashMap<>();
            data.put("id", id.toString());
            data.put("nickname", nickname);
            data.put("access", access);

            // 쿠키가 막히는 배포 환경 대비: body에도 refresh 포함
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
    protected void unsuccessfulAuthentication(HttpServletRequest request,
                                              HttpServletResponse response,
                                              AuthenticationException failed) {
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

        // ✅ JWTUtil.REFRESH_TOKEN_EXP_MS(14일) 기준으로 쿠키 만료도 통일
        cookie.setMaxAge((int) (JWTUtil.REFRESH_TOKEN_EXP_MS / 1000));

        cookie.setHttpOnly(true);
        cookie.setPath("/");

        // 배포가 https면 true 권장
        cookie.setSecure(false);

        return cookie;
    }
}
