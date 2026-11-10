package com.backend.dto.member;

import com.backend.domain.member.Role;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Allowlist for administrator list responses; never map a full Member here. */
@Data
public class AdminMemberSummary {
    private Integer id;
    private String username;
    private String nickname;
    private String gender;
    private LocalDate birthDate;
    private LocalDateTime inserted;
    private Role role;
}
