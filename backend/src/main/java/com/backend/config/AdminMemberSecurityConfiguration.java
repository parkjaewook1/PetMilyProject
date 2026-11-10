package com.backend.config;

import com.backend.security.JWTFilter;
import com.backend.security.JWTUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
public class AdminMemberSecurityConfiguration {
    @Bean
    @Order(0)
    SecurityFilterChain adminMemberFilterChain(HttpSecurity http, JWTUtil jwtUtil) throws Exception {
        // Match only administration endpoints, before every profile-specific fallback chain.
        http.securityMatcher(new OrRequestMatcher(
                new AntPathRequestMatcher("/api/member/list"),
                new AntPathRequestMatcher("/api/member/reissue"),
                new RegexRequestMatcher("^/api/member/[0-9]+/?$", "DELETE"),
                new RegexRequestMatcher("^/api/member/[0-9]+/?$", "OPTIONS")))
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .requestCache(cache -> cache.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of("http://52.79.251.74:8080", "http://localhost:5173",
                        "http://150.230.249.131:8080", "https://pet-mily-project.vercel.app"));
                config.setAllowedMethods(List.of("GET", "DELETE", "POST", "OPTIONS"));
                config.setAllowedHeaders(List.of("Authorization", "Content-Type", "memberInfoId", "Refresh-Token"));
                config.setAllowCredentials(true);
                config.setExposedHeaders(List.of("access", "Refresh-Token"));
                return config;
            }))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, error) -> response.setStatus(401))
                .accessDeniedHandler((request, response, error) -> response.setStatus(403)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/member/reissue").permitAll()
                .anyRequest().hasRole("ADMIN"))
            .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
