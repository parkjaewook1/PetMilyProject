package com.backend.dto.member;

import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Owner/current-administrator edit projection. No credentials or recovery secrets. */
@Data
@ToString(callSuper = true, onlyExplicitlyIncluded = true)
@EqualsAndHashCode(callSuper = true)
public class PrivateMemberProfile extends PublicMemberProfile {
    private String username;
    private String name;
    private String gender;
    private String nationality;
    private LocalDate birthDate;
    private String phoneNumber;
    private Integer postcode;
    private String mainAddress;
    private String detailedAddress;
    private LocalDateTime inserted;
}
