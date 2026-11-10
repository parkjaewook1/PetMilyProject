package com.backend.domain.member;

import lombok.Data;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

@Data
public class RefreshEntity {
    private Integer id;
    private String username;
    @ToString.Exclude
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String refresh;
    private Timestamp expiration;
}
