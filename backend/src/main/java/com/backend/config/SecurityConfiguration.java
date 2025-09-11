package com.backend.config;

import com.backend.mapper.member.LoginCheckMapper;
import com.backend.mapper.member.RefreshMapper;
import com.backend.oauth2.CustomSuccessHandler;
import com.backend.security.CustomLoginFilter;
import com.backend.security.CustomLogoutFilter;
import com.backend.security.JWTFilter;
import com.backend.security.JWTUtil;
import com.backend.service.member.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JWTUtil jwtUtil;
    private final RefreshMapper refreshMapper;
    private final LoginCheckMapper loginCheckMapper;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomSuccessHandler customSuccessHandler;

    public SecurityConfiguration(AuthenticationConfiguration authenticationConfiguration,
                                 JWTUtil jwtUtil,
                                 RefreshMapper refreshMapper,
                                 LoginCheckMapper loginCheckMapper,
                                 CustomOAuth2UserService customOAuth2UserService,
                                 CustomSuccessHandler customSuccessHandler) {
        System.out.println("=== SecurityConfiguration 생성됨 ===");
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
        this.refreshMapper = refreshMapper;
        this.loginCheckMapper = loginCheckMapper;
        this.customOAuth2UserService = customOAuth2UserService;
        this.customSuccessHandler = customSuccessHandler;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        System.out.println("=== SecurityFilterChain Bean 실행됨 ===");
        // ✅ CORS 설정
        http.cors(corsCustomizer -> corsCustomizer.configurationSource(new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Collections.singletonList("http://52.79.251.74:8080"));
                configuration.setAllowedMethods(Collections.singletonList("*"));
                configuration.setAllowCredentials(true);
                configuration.setAllowedHeaders(Collections.singletonList("*"));
                configuration.setMaxAge(3600L);
                configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "access"));
                return configuration;
            }
        }));

        // ✅ CSRF, 폼 로그인, HTTP Basic 비활성화
        http.csrf(csrf -> csrf.disable());
        http.formLogin(form -> form.disable());
        http.httpBasic(basic -> basic.disable());

        // ✅ 기본 로그아웃 기능 비활성화 → CustomLogoutFilter만 사용
        http.logout(logout -> logout.disable());

        // ✅ 필터 등록 순서
        http.addFilterBefore(new JWTFilter(jwtUtil), CustomLoginFilter.class);
        http.addFilterBefore(
                new CustomLogoutFilter(jwtUtil, refreshMapper, loginCheckMapper),
                LogoutFilter.class
        );
        http.addFilterAt(new CustomLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil, refreshMapper, loginCheckMapper),
                UsernamePasswordAuthenticationFilter.class);

        // ✅ OAuth2 로그인 설정
        http.oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(customSuccessHandler));

        // ✅ 경로별 권한 설정
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/member/logout").permitAll() // 로그아웃 경로 허용
                .requestMatchers("/reissue").permitAll()
                .requestMatchers("/admin").hasRole("ADMIN")
                .requestMatchers("/**").permitAll()
                .anyRequest().authenticated()
        );

        // ✅ 세션 정책: STATELESS
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}