package com.backend.service.member;

import com.backend.domain.member.Member;
import com.backend.domain.member.Role;
import com.backend.dto.member.AdminMemberPage;
import com.backend.mapper.member.AdminMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminMemberService {
    private final AdminMemberMapper mapper;

    private final MemberAccessService access;

    @Transactional(readOnly = true)
    public AdminMemberPage list(int page, int pageSize) {
        access.requireAdministrator();
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        }
        int count = mapper.countMembers();
        return new AdminMemberPage(mapper.selectPage(pageSize, ((long) page - 1) * pageSize),
                (int) Math.ceil((double) count / pageSize), page);
    }

    @Transactional
    public void delete(Integer id) {
        access.requireAdministrator();
        if (id == null || id < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid member ID");
        }
        Member target = mapper.lockForDeletion(id);
        if (target == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found");
        if (target.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Administrator accounts cannot be deleted");
        }
        if (mapper.hasRelatedData(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Member has related data");
        }
        // No filesystem operations. Any FK/DB error rolls back all three statements.
        mapper.deleteRefreshTokens(target.getUsername());
        mapper.deleteLoginState(target.getNickname());
        if (mapper.deleteMember(id) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found");
        }
    }
}
