package com.backend.admin;

import com.backend.domain.member.Member;
import com.backend.domain.member.Role;
import com.backend.mapper.member.LoginCheckMapper;
import com.backend.mapper.member.RefreshMapper;
import com.backend.oauth2.CustomSuccessHandler;
import com.backend.security.JWTUtil;
import com.backend.service.member.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = AdminApiTestApplication.class, properties = {
        "spring.config.location=optional:classpath:/admin-api-test-only.properties",
        "spring.main.banner-mode=off"})
@AutoConfigureMockMvc
class AdminMemberApiTest {
    @Autowired MockMvc mvc;
    @Autowired JWTUtil jwt;
    @Autowired AdminMemberService admin;
    @Autowired DataSource dataSource;
    @Autowired ObjectMapper json;
    @MockBean MemberService profiles;
    @MockBean EmailSenderService emailSender;
    @MockBean RefreshMapper refreshMapper;
    @MockBean LoginCheckMapper loginCheckMapper;
    @MockBean CustomOAuth2UserService oauthUsers;
    @MockBean CustomSuccessHandler oauthSuccess;
    JdbcTemplate db;

    String bearer(String role) { return "Bearer " + jwt.createAccessToken("test@example.test", role, 99); }

    @BeforeEach void schema() {
        db = new JdbcTemplate(dataSource);
        db.execute("DROP ALL OBJECTS");
        db.execute("CREATE TABLE member(id INT PRIMARY KEY, username VARCHAR(100), nickname VARCHAR(100), role VARCHAR(20), gender VARCHAR(10), birth_date DATE, inserted_at TIMESTAMP, password VARCHAR(100), main_address VARCHAR(100))");
        db.execute("CREATE TABLE refresh_token(username VARCHAR(100), refresh VARCHAR(100))");
        db.execute("CREATE TABLE login_check(member_nickname VARCHAR(100))");
        for (String table : List.of("board", "board_comment", "board_like", "board_report", "diary", "diary_comment", "profile", "hospital_comment")) {
            db.execute("CREATE TABLE " + table + "(member_id INT REFERENCES member(id))");
        }
        db.execute("CREATE TABLE friends(member_id INT REFERENCES member(id), friend_id INT REFERENCES member(id))");
        db.execute("CREATE TABLE chat_message(sender_id INT REFERENCES member(id), recipient_id INT REFERENCES member(id))");
        db.update("INSERT INTO member VALUES (7,'member@example.test','ordinary','USER','male','1990-01-01',CURRENT_TIMESTAMP,'dummy-secret-hash','dummy-private-address')");
        db.update("INSERT INTO member VALUES (99,'admin@example.test','administrator','ADMIN','female','1990-01-01',CURRENT_TIMESTAMP,'dummy-admin-hash','dummy-admin-address')");
        SecurityContextHolder.clearContext();
    }
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test void anonymousListAndDeleteAre401() throws Exception {
        mvc.perform(get("/api/member/list")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/member/7")).andExpect(status().isUnauthorized());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member", Integer.class)).isEqualTo(2);
    }
    @Test void ordinaryMemberAndSpoofedHeaderAre403() throws Exception {
        mvc.perform(get("/api/member/list").header("Authorization", bearer("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_USER"))
                .header("memberInfoId", "99")).andExpect(status().isForbidden());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member", Integer.class)).isEqualTo(2);
    }
    @ParameterizedTest @ValueSource(strings = {"ROLE_ADMIN", "ADMIN"})
    void actualJwtRoleMatchesAdminAndJsonIsAllowlisted(String role) throws Exception {
        String body = mvc.perform(get("/api/member/list?page=1&pageSize=10").header("Authorization", bearer(role)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.members[0].id").value(7))
                .andExpect(jsonPath("$.members[0].username").value("member@example.test"))
                .andExpect(jsonPath("$.members[0].birthDate").value("1990-01-01"))
                .andExpect(jsonPath("$.members[0].role").value("USER"))
                .andReturn().getResponse().getContentAsString();
        var fields = json.readTree(body).get("members").get(0).properties().stream().map(java.util.Map.Entry::getKey).toList();
        assertThat(fields).containsExactlyInAnyOrder("id", "username", "nickname", "gender", "birthDate", "inserted", "role");
        assertThat(body).doesNotContain("password", "refresh", "tokenRole", "mainAddress", "dummy-secret", "dummy-private");
    }
    @ParameterizedTest @ValueSource(strings = {"nonsense", "Bearer broken", "Bearer "})
    void invalidCredentialsNeverCause500(String authorization) throws Exception {
        mvc.perform(get("/api/member/list").header("Authorization", authorization)).andExpect(status().isUnauthorized());
    }
    @Test void refreshAndWrongSignatureAre401() throws Exception {
        mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + jwt.createRefreshToken("x", "ROLE_ADMIN", 99)))
                .andExpect(status().isUnauthorized());
        JWTUtil other = new JWTUtil("only-a-dummy-key-for-signature-failure-test-123456");
        mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + other.createAccessToken("x", "ROLE_ADMIN", 99)))
                .andExpect(status().isUnauthorized());
    }
    @Test void missingAndInvalidCategoryClaimsAre401() throws Exception {
        javax.crypto.SecretKey key = (javax.crypto.SecretKey) org.springframework.test.util.ReflectionTestUtils.getField(jwt, "secretKey");
        String missingCategory = io.jsonwebtoken.Jwts.builder().claim("username", "x").claim("role", "ROLE_ADMIN")
                .claim("userId", 99).expiration(new java.util.Date(System.currentTimeMillis() + 60000)).signWith(key).compact();
        String missingExpiration = io.jsonwebtoken.Jwts.builder().claim("category", "access").claim("username", "x")
                .claim("role", "ROLE_ADMIN").claim("userId", 99).signWith(key).compact();
        for (String malformed : List.of(missingCategory, missingExpiration)) {
            mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + malformed)).andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + jwt.createJwt("other", "x", "ROLE_ADMIN", 99, 10000L)))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + jwt.createAccessToken("x", "ROLE_ADMIN", 0)))
                .andExpect(status().isUnauthorized());
    }
    @Test void paginationIsValidatedAndEmptyPageSafe() throws Exception {
        for (String query : List.of("page=0", "pageSize=0", "pageSize=101")) {
            mvc.perform(get("/api/member/list?" + query).header("Authorization", bearer("ROLE_ADMIN")))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/member/list?page=2147483647").header("Authorization", bearer("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.members").isEmpty());
    }
    @Test void deletionUsesPathIdNotCallerHeaderAndCleansAuthenticationRows() throws Exception {
        db.update("INSERT INTO refresh_token VALUES ('member@example.test','fake-refresh')");
        db.update("INSERT INTO login_check VALUES ('ordinary')");
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_ADMIN")).header("memberInfoId", "7"))
                .andExpect(status().isNoContent());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member WHERE id=7", Integer.class)).isZero();
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member WHERE id=99", Integer.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM refresh_token", Integer.class)).isZero();
        assertThat(db.queryForObject("SELECT COUNT(*) FROM login_check", Integer.class)).isZero();
        verify(profiles, never()).delete(anyInt());
    }
    @Test void missingMember404AndAdministrator409() throws Exception {
        mvc.perform(delete("/api/member/88").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isNotFound());
        mvc.perform(delete("/api/member/99").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isConflict());
    }
    @ParameterizedTest @ValueSource(strings = {"board", "board_comment", "board_like", "board_report", "diary", "diary_comment", "profile", "hospital_comment"})
    void relatedRecordsAreNotDeleted(String table) throws Exception {
        db.update("INSERT INTO " + table + " VALUES(7)");
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isConflict());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member", Integer.class)).isEqualTo(2);
    }
    @Test void incomingFriendAndChatReferencesAlsoBlockDeletion() throws Exception {
        db.update("INSERT INTO friends VALUES(99,7)");
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isConflict());
        db.update("DELETE FROM friends"); db.update("INSERT INTO chat_message VALUES(99,7)");
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isConflict());
    }
    @Test void unknownForeignKeyRollsBackTokenAndLoginCleanup() throws Exception {
        db.execute("CREATE TABLE future_dependency(member_id INT REFERENCES member(id))");
        db.update("INSERT INTO future_dependency VALUES(7)");
        db.update("INSERT INTO refresh_token VALUES('member@example.test','fake-refresh')");
        db.update("INSERT INTO login_check VALUES('ordinary')");
        mvc.perform(delete("/api/member/7").header("Authorization", bearer("ROLE_ADMIN"))).andExpect(status().isConflict());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM refresh_token", Integer.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM login_check", Integer.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM member", Integer.class)).isEqualTo(2);
    }
    @Test void serviceCannotBeCalledWithoutAdministrator() {
        assertThatThrownBy(() -> admin.list(1,10)).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("user", "", List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        assertThatThrownBy(() -> admin.delete(7)).isInstanceOf(AccessDeniedException.class);
    }
    @Test void ordinaryProfileReadAndOwnerUpdateStillUseExistingEndpoints() throws Exception {
        var profile = new com.backend.dto.member.PublicMemberProfile(); profile.setId(7); profile.setNickname("ordinary");
        when(profiles.getProfile(7)).thenReturn(profile);
        when(profiles.update(eq(99), any(Member.class))).thenReturn(true);
        mvc.perform(get("/api/member/7").header("Authorization", bearer("ROLE_USER"))).andExpect(status().isOk());
        mvc.perform(put("/api/member/edit/99").header("Authorization", bearer("ROLE_USER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"new\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/member/edit/7").header("Authorization", bearer("ROLE_USER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"other\"}"))
                .andExpect(status().isForbidden());
    }
    @Test void deleteQueryStringCannotBypassSecurityChain() throws Exception {
        mvc.perform(delete("/api/member/7?source=admin")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/member/7?source=admin").header("Authorization", bearer("ROLE_USER")))
                .andExpect(status().isForbidden());
    }
    @Test void cookieAloneCannotAuthenticateAdminApi() throws Exception {
        mvc.perform(get("/api/member/list").cookie(new jakarta.servlet.http.Cookie("access", jwt.createAccessToken("x", "ROLE_ADMIN", 99))))
                .andExpect(status().isUnauthorized());
    }
    @Test void expiredSignedTokenIs401() throws Exception {
        javax.crypto.SecretKey key = (javax.crypto.SecretKey) org.springframework.test.util.ReflectionTestUtils.getField(jwt, "secretKey");
        String token = io.jsonwebtoken.Jwts.builder().claim("category", "access").claim("username", "x")
                .claim("role", "ROLE_ADMIN").claim("userId", 99).expiration(new java.util.Date(1)).signWith(key).compact();
        mvc.perform(get("/api/member/list").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }
    @Test void corsPreflightUsesExistingFrontendOrigin() throws Exception {
        mvc.perform(options("/api/member/7").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "DELETE").header("Access-Control-Request-Headers", "authorization,memberInfoId"))
                .andExpect(status().isOk());
    }
}
