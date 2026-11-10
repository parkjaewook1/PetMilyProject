package com.backend.mapper.member;

import com.backend.domain.member.Member;
import com.backend.dto.member.AdminMemberSummary;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AdminMemberMapper {
    @Select("""
        SELECT id, username, nickname, gender, birth_date AS birthDate, inserted_at AS inserted, role
        FROM member ORDER BY id ASC LIMIT #{limit} OFFSET #{offset}
        """)
    List<AdminMemberSummary> selectPage(@Param("limit") int limit, @Param("offset") long offset);

    @Select("SELECT COUNT(*) FROM member")
    int countMembers();

    @Select("SELECT id, role, username, nickname FROM member WHERE id = #{id} FOR UPDATE")
    Member lockForDeletion(Integer id);

    // Restrict, rather than guess a cascade policy for content, messages or local files.
    // These are the active tables referenced by the current application mappers.
    @Select("""
        SELECT EXISTS(SELECT 1 FROM board WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM board_comment WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM board_like WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM board_report WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM diary WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM diary_comment WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM profile WHERE member_id = #{id})
          OR EXISTS(SELECT 1 FROM friends WHERE member_id = #{id} OR friend_id = #{id})
          OR EXISTS(SELECT 1 FROM chat_message WHERE sender_id = #{id} OR recipient_id = #{id})
          OR EXISTS(SELECT 1 FROM hospital_comment WHERE member_id = #{id})
        """)
    boolean hasRelatedData(Integer id);

    @Delete("DELETE FROM login_check WHERE member_nickname = #{nickname}")
    int deleteLoginState(String nickname);

    @Delete("DELETE FROM refresh_token WHERE username = #{username}")
    int deleteRefreshTokens(String username);

    @Delete("DELETE FROM member WHERE id = #{id}")
    int deleteMember(Integer id);
}
