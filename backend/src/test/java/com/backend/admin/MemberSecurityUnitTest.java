package com.backend.admin;

import com.backend.domain.member.*;
import com.backend.dto.member.*;
import com.backend.mapper.board.*;
import com.backend.mapper.diary.*;
import com.backend.mapper.member.*;
import com.backend.security.CustomUserDetails;
import com.backend.service.board.BoardService;
import com.backend.service.member.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberSecurityUnitTest {
    @Mock MemberMapper mapper;
    @Mock MemberAccessService access;
    @Mock RefreshMapper refresh;
    @Mock ProfileMapper images;
    @Mock DiaryBoardMapper diaryBoards;
    @Mock BCryptPasswordEncoder encoder;
    @Mock BoardService boards;
    @Mock BoardMapper boardMapper;
    @Mock BoardCommentMapper comments;
    @Mock DiaryMapper diaries;
    @InjectMocks MemberService service;
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    Member member(int id, Role role) {
        Member m=new Member();m.setId(id);m.setRole(role);m.setUsername("fixture@example.test");return m;
    }
    void authenticate(Member m) {
        CustomUserDetails principal=new CustomUserDetails(m);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,principal.getAuthorities()));
    }
    @ParameterizedTest @NullAndEmptySource
    void missingAndEmptyPasswordDoNotCallEncoder(String raw) {
        Member request=new Member();request.setPassword(raw);when(mapper.update(request)).thenReturn(1);
        assertThat(service.update(7,request)).isTrue();assertThat(request.getPassword()).isNull();
        verify(access).requireOwnerOrAdministrator(7);verifyNoInteractions(encoder);
    }
    @Test void explicitPasswordIsEncodedOnce() {
        Member request=new Member();request.setPassword("ChangedPass1!");
        when(encoder.encode("ChangedPass1!")).thenReturn("encoded-fixture");when(mapper.update(request)).thenReturn(1);
        assertThat(service.update(7,request)).isTrue();assertThat(request.getPassword()).isEqualTo("encoded-fixture");
        verify(encoder,times(1)).encode("ChangedPass1!");verifyNoMoreInteractions(encoder);
    }
    @ParameterizedTest @ValueSource(strings={"weak","   ","$2a$10$fixturehashmustnotberehashed012345678901234567890123456789"})
    void invalidPasswordAndHashEchoAreRejectedBeforeEncoder(String raw) {
        Member request=new Member();request.setPassword(raw);
        assertThatThrownBy(()->service.update(7,request)).isInstanceOf(ResponseStatusException.class)
            .satisfies(e->assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(400));
        verify(access).requireOwnerOrAdministrator(7);verifyNoInteractions(encoder);verify(mapper,never()).update(any());
    }
    @Test void publicProfileNeverUsesPrivateOrCredentialQuery() {
        when(access.authenticatedMemberIfPresent()).thenReturn(member(7,Role.USER));
        PublicMemberProfile profile=new PublicMemberProfile();profile.setId(9);profile.setNickname("friend");
        when(mapper.selectPublicProfileById(9)).thenReturn(profile);
        Profile image=new Profile();image.setFileName("fixture.png");when(images.selectProfileByMemberId(9)).thenReturn(image);
        ReflectionTestUtils.setField(service,"srcPrefix","/uploads/");
        assertThat(service.getProfile(9).getImageUrl()).isEqualTo("/uploads/fixture.png");
        verify(mapper,never()).selectPrivateProfileById(any());verify(mapper,never()).selectByMemberId(any());
    }
    @Test void ownerReceivesOnlyPrivateProjection() {
        when(access.authenticatedMemberIfPresent()).thenReturn(member(7,Role.USER));
        PrivateMemberProfile profile=new PrivateMemberProfile();profile.setId(7);
        when(mapper.selectPrivateProfileById(7)).thenReturn(profile);
        assertThat(service.getProfile(7)).isSameAs(profile);verify(mapper,never()).selectByMemberId(any());
    }
    @Test void currentAdministratorReceivesPrivateProjection() {
        Member administrator=member(99,Role.ADMIN);when(access.authenticatedMemberIfPresent()).thenReturn(administrator);
        when(access.isCurrentAdministrator(administrator)).thenReturn(true);
        PrivateMemberProfile profile=new PrivateMemberProfile();when(mapper.selectPrivateProfileById(7)).thenReturn(profile);
        assertThat(service.getProfile(7)).isSameAs(profile);
    }
    @Test void demotionDeniesOldAdministratorPrincipal() {
        authenticate(member(99,Role.ADMIN));when(mapper.selectAuthorizationById(99)).thenReturn(member(99,Role.USER));
        assertThatThrownBy(()->new MemberAccessService(mapper).requireAdministrator()).isInstanceOf(AccessDeniedException.class);
    }
    @Test void promotionDoesNotElevateAnOldUserToken() {
        authenticate(member(7,Role.USER));
        assertThatThrownBy(()->new MemberAccessService(mapper).requireAdministrator()).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(mapper);
    }
    @Test void deletedAccountIsUnauthenticated() {
        authenticate(member(99,Role.ADMIN));
        assertThatThrownBy(()->new MemberAccessService(mapper).requireAdministrator()).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }
    @Test void credentialsAreWriteOnlyAndNotInToString() throws Exception {
        ObjectMapper json=new ObjectMapper();Member input=json.readValue("{\"password\":\"request-secret\"}",Member.class);
        input.setMainAddress("private-address");
        assertThat(input.getPassword()).isEqualTo("request-secret");assertThat(json.writeValueAsString(input)).doesNotContain("password","request-secret");
        assertThat(input.toString()).doesNotContain("request-secret","private-address");
        RefreshEntity token=new RefreshEntity();token.setRefresh("refresh-secret");assertThat(token.toString()).doesNotContain("refresh-secret");
    }
}
