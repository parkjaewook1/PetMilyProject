package com.backend.domain.member;

import jakarta.persistence.Column;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Member {
    private Integer id;
    private String name;
    private String username;
    private String nickname;
    private String password;
    private String gender;
    private String nationality;
    private LocalDate birthDate;
    private String phoneNumber;
    private Integer postcode;
    private String mainAddress;
    private String detailedAddress;
    @Column(name = "inserted_at")
    private LocalDateTime inserted;
    private Role role;
    private String tokenRole;
    private String imageUrl;

    public String getTokenRole() {
        // DB role 필드 기반으로 반환
        return this.role != null ? "ROLE_" + this.role.name() : "ROLE_USER";
    }
}
