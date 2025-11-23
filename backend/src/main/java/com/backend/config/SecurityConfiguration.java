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
                        "http://localhost:5173"
                ));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowCredentials(true);
                configuration.setAllowedHeaders(Collections.singletonList("*"));
                configuration.setMaxAge(3600L);
                configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "access"));
                return configuration;
            }
        }));

        // 2. 에러 핸들링 (리다이렉트 방지 수정)
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    System.out.println("⛔ 인증 실패 (401) - 요청 경로: " + request.getRequestURI());

                    // [수정] /api/ 로 시작하는 모든 요청은 절대 리다이렉트 하지 않고 401 에러만 보냄
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"unauthorized\"}");
                    } else {
                        // API가 아닌 경우에만 로그인 페이지로 보냄 (test 프로바이더가 없다면 이 줄도 지우는 게 좋습니다)
                        response.sendRedirect("/member/login");
                    }
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

        // =========================================================
        // 👇👇 [핵심 수정] API 경로 권한 설정 (여기가 제일 중요!) 👇👇
        // =========================================================
        http.authorizeHttpRequests(auth -> auth
                // [OPTIONS 요청 허용] 프리플라이트 요청(CORS)이 막히지 않도록 허용
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // [인증 관련]
                .requestMatchers(HttpMethod.POST, "/api/member/signup", "/api/member/login", "/api/member/reissue").permitAll()
                .requestMatchers("/api/member/logout").permitAll()
                .requestMatchers("/reissue", "/api/reissue").permitAll()

                // [게시판 조회 - GET 요청은 모두 허용]
                // ** 나중에 컨트롤러 경로가 바뀌어도 문제 없도록 패턴으로 허용합니다 **
                .requestMatchers(HttpMethod.GET, "/api/board/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/boards/**").permitAll() // 혹시 s가 붙을 경우 대비

                // [댓글 조회 - GET 요청 허용] (방명록이 안 보인다면 이 줄이 필요합니다)
                .requestMatchers(HttpMethod.GET, "/api/comment/**", "/api/diaryComment/**").permitAll()

                // [이미지 리소스]
                .requestMatchers(HttpMethod.GET, "/api/image/**", "/api/images/**").permitAll()

                // [관리자]
                .requestMatchers("/admin").hasRole("ADMIN")

                // [그 외] 나머지는 로그인 필요
                .anyRequest().authenticated()
        );

        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}