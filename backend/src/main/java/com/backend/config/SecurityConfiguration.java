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
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
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

        // 1. CORS 설정
        http.cors(corsCustomizer -> corsCustomizer.configurationSource(new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList(
                        "http://52.79.251.74:8080",
                        "http://localhost:5173",
                        "http://150.230.249.131:8080",
                        "https://pet-mily-project.vercel.app" // Vercel 도메인
                ));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowCredentials(true);
                configuration.setAllowedHeaders(Collections.singletonList("*"));
                configuration.setMaxAge(3600L);
                configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "access"));
                return configuration;
            }
        }));

        // 2. 에러 핸들링 (수정됨: 조건문 삭제, 리다이렉트 삭제)
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    System.out.println("⛔ 인증 실패 (401) - 요청 경로: " + request.getRequestURI());

                    // ⚡️ [핵심 수정] if-else 리다이렉트 로직을 전부 지웁니다.
                    // API 서버는 무조건 401 상태코드와 JSON만 내려주면 됩니다.
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"unauthorized\", \"message\":\"로그인이 필요합니다.\"}");
                })
        );

        // 3. 보안 필터 해제
        http.csrf(csrf -> csrf.disable());
        http.formLogin(form -> form.disable());
        http.httpBasic(basic -> basic.disable());
        http.logout(logout -> logout.disable());

        // 4. JWT 필터 등록
        http.addFilterBefore(new JWTFilter(jwtUtil), CustomLoginFilter.class);
        http.addFilterBefore(
                new CustomLogoutFilter(jwtUtil, refreshMapper, loginCheckMapper),
                LogoutFilter.class
        );

        CustomLoginFilter loginFilter =
                new CustomLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil, refreshMapper, loginCheckMapper);
        loginFilter.setRequiresAuthenticationRequestMatcher(
                new AntPathRequestMatcher("/api/member/login", "POST")
        );
        http.addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class);

        http.oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(customSuccessHandler));

        // 5. 권한 설정
        http.authorizeHttpRequests(auth -> auth
                // [Preflight]
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ✅ [수정 1] 에러 페이지 및 정적 리소스 허용
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/favicon.ico", "/assets/**").permitAll()

                // ✅ [수정 2] 중복 확인 (/check) 주소 명시적 허용 (이게 핵심!)
                .requestMatchers(HttpMethod.GET, "/api/member/check").permitAll()

                // [인증 관련]
                .requestMatchers(HttpMethod.POST, "/api/member/signup", "/api/member/login", "/api/member/reissue").permitAll()
                .requestMatchers("/api/member/logout").permitAll()
                .requestMatchers("/reissue", "/api/reissue").permitAll()

                // [조회 - GET 허용]
                .requestMatchers(HttpMethod.GET, "/api/board/**", "/api/boards/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/comment/**", "/api/diaryComment/**").permitAll()
                // 이미지 업로드 경로 허용
                .requestMatchers(HttpMethod.GET, "/api/image/**", "/api/images/**", "/uploads/**").permitAll()

                // [관리자]
                .requestMatchers("/admin").hasRole("ADMIN")

                // [나머지]
                .anyRequest().authenticated()
        );

        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}