package com.backend.oauth2;

import com.backend.domain.member.OAuth2Member;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final OAuth2Member oAuth2Member;

    public CustomOAuth2User(OAuth2Member oAuth2Member) {
        this.oAuth2Member = oAuth2Member;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return null; // 필요하면 attributes를 받아서 반환하도록 수정 가능
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> collection = new ArrayList<>();
        collection.add(() -> oAuth2Member.getRole());
        return collection;
    }

    @Override
    public String getName() {
        return oAuth2Member.getName();
    }

    public String getUsername() {
        return oAuth2Member.getUsername();
    }

    // ✅ 추가: id 반환
    public Integer getId() {
        return oAuth2Member.getId();
    }

    public String getRole() {
        return oAuth2Member.getRole();
    }
}