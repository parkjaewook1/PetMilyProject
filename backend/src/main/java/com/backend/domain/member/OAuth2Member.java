package com.backend.domain.member;

import lombok.Data;


@Data

public class OAuth2Member {
    private Integer id;
    private String username;
    private String role;
    private String name;
}