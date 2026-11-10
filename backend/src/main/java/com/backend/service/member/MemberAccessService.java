package com.backend.service.member;

import com.backend.domain.member.Member;
import com.backend.domain.member.Role;
import com.backend.mapper.member.MemberMapper;
import com.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberAccessService {
    private final MemberMapper mapper;

    public Member authenticatedMemberIfPresent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth instanceof AnonymousAuthenticationToken || !auth.isAuthenticated()) return null;
        if (!(auth.getPrincipal() instanceof CustomUserDetails principal)) throw unauthenticated();
        Member current = mapper.selectAuthorizationById(principal.getId());
        if (current == null) throw unauthenticated();
        return current;
    }

    public boolean isCurrentAdministrator(Member member) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return member != null && member.getRole() == Role.ADMIN && auth != null &&
                auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    public void requireAdministrator() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth instanceof AnonymousAuthenticationToken || !auth.isAuthenticated()) throw unauthenticated();
        if (auth.getAuthorities().stream().noneMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            throw new AccessDeniedException("Administrator required");
        }
        if (!isCurrentAdministrator(authenticatedMemberIfPresent())) throw new AccessDeniedException("Administrator required");
    }

    public void requireOwnerOrAdministrator(Integer id) {
        Member current = authenticatedMemberIfPresent();
        if (current == null) throw unauthenticated();
        if (!current.getId().equals(id) && !isCurrentAdministrator(current)) throw new AccessDeniedException("Access denied");
    }

    private AuthenticationCredentialsNotFoundException unauthenticated() {
        return new AuthenticationCredentialsNotFoundException("Authentication required");
    }
}
