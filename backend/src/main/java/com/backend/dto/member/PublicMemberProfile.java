package com.backend.dto.member;

import lombok.Data;
import lombok.ToString;

/** Shared profile fields used by friends, avatars and mini-home navigation. */
@Data
@ToString(onlyExplicitlyIncluded = true)
public class PublicMemberProfile {
    @ToString.Include
    private Integer id;
    private String nickname;
    private String imageUrl;
}
