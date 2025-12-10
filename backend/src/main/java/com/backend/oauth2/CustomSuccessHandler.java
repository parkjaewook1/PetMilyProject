package com.backend.oauth2;

import com.backend.domain.member.RefreshEntity;
import com.backend.mapper.member.RefreshMapper;
import com.backend.security.JWTUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.Collection;

@Component
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;

    // Refresh 토큰 만료 시간 (10시간)
    private static final long REFRESH_EXPIRE_MS = 36000000L;
    // Access 토큰 만료 시간 (10분)
    private static final long ACCESS_EXPIRE_MS = 600000L;

    public CustomSuccessHandler(JWTUtil jwtUtil, RefreshMapper refreshMapper) {
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
    }

    private void addRefreshEntity(String username, String refresh, long expiredMs) {
        Timestamp expiration = new Timestamp(System.currentTimeMillis() + expiredMs);
        RefreshEntity refreshEntity = new RefreshEntity();
        refreshEntity.setUsername(username);
        refreshEntity.setRefresh(refresh);
        refreshEntity.setExpiration(expiration);
        refreshMapper.insertbyRefresh(refreshEntity);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        // OAuth2User → CustomOAuth2User
        CustomOAuth2User customUserDetails = (CustomOAuth2User) authentication.getPrincipal();

        String username = customUserDetails.getUsername();
        Integer userId = null;

        if (customUserDetails.getId() != null) {
            // getId()가 Long을 반환한다면 .intValue()로, Integer라면 그대로 사용
            // 여기서는 안전하게 Number 타입으로 받아서 intValue() 호출
            userId = ((Number) customUserDetails.getId()).intValue();
        }
        // 필요 시 DB 조회로 보완 가능
        // else {
        //     userId = memberMapper.selectIdByUsername(username).longValue();
        // }

        // 권한 추출 (없으면 ROLE_USER)
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        String role = authorities.stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");

        // Access / Refresh 토큰 생성 (userId 포함)
        String access = jwtUtil.createJwt("access", username, role, userId, ACCESS_EXPIRE_MS);
        String refresh = jwtUtil.createJwt("refresh", username, role, userId, REFRESH_EXPIRE_MS);

        // Refresh 토큰 저장 (DB)
        addRefreshEntity(username, refresh, REFRESH_EXPIRE_MS);

        // Refresh 토큰 쿠키로 전달
        response.addCookie(createCookie("refresh", refresh));

        // 리다이렉트 (프론트로 Access 토큰 전달)
        String redirectUrl = "https://pet-mily-project.vercel.app/member/oauth/login"
                + "?username=" + username
                + "&token=" + access;
        response.sendRedirect(redirectUrl);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setMaxAge((int) (REFRESH_EXPIRE_MS / 1000)); // 초 단위
        // cookie.setSecure(true); // HTTPS 환경에서만 사용 시 활성화
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        return cookie;
    }
}