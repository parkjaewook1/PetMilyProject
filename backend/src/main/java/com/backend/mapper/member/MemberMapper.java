package com.backend.mapper.member;

import com.backend.domain.member.Member;
import com.backend.dto.member.PublicMemberProfile;
import com.backend.dto.member.PrivateMemberProfile;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface MemberMapper {

    // 회원가입
    @Insert("""
            INSERT INTO member(name, username, nickname, password, gender, nationality, birth_date, phone_number, postcode, main_address, detailed_address)
            VALUES (#{name}, #{username}, #{nickname}, #{password}, #{gender}, #{nationality}, #{birthDate}, #{phoneNumber}, #{postcode}, #{mainAddress}, #{detailedAddress})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int signup(Member member);

    // 로그인 전 중복 체크 등에 사용
    @Select("""
            SELECT *
            FROM member
            WHERE username = #{username}
            """)
    Member selectByUsername(String username);

    @Select("""
            SELECT *
            FROM member
            WHERE nickname = #{nickname}
            """)
    Member selectByNickname(String nickname);

    // 회원 단건 조회 (id 기반)
    @Select("""
            SELECT id, name, username, nickname, password, gender, nationality, birth_date,
                   phone_number, postcode, main_address, detailed_address, inserted_at, role
            FROM member
            WHERE id = #{id}
            """)
    Member selectByMemberId(Integer id);

    @Select("SELECT id, username, nickname, role FROM member WHERE id = #{id}")
    Member selectAuthorizationById(Integer id);

    @Select("SELECT id, nickname FROM member WHERE id = #{id}")
    PublicMemberProfile selectPublicProfileById(Integer id);

    @Select("""
        SELECT id, username, nickname, name, gender, nationality, birth_date AS birthDate,
               phone_number AS phoneNumber, postcode, main_address AS mainAddress,
               detailed_address AS detailedAddress, inserted_at AS inserted
        FROM member WHERE id = #{id}
        """)
    PrivateMemberProfile selectPrivateProfileById(Integer id);

    // 회원 수정
    @Update("""
            <script>
            UPDATE member
            SET nickname = #{nickname},
                <if test="password != null and password != ''">password = #{password},</if>
                gender = #{gender},
                nationality = #{nationality},
                name = #{name},
                birth_date = #{birthDate},
                phone_number = #{phoneNumber},
                postcode = #{postcode},
                main_address = #{mainAddress},
                detailed_address = #{detailedAddress}
            WHERE id = #{id}
            </script>
            """)
    int update(Member member);

    // 회원 삭제
    @Delete("""
            DELETE FROM member
            WHERE id = #{id}
            """)
    int deleteById(Integer id);

    // 비밀번호 찾기 (username 기반)
    @Update("""
            UPDATE member
            SET password = #{password}
            WHERE username = #{username}
            """)
    void updatePasswordByEmail(@Param("username") String username, @Param("password") String password);

    // OAuth2 신규 회원 등록
    @Insert("""
            INSERT INTO member(name, username, nickname, password, gender, nationality, birth_date, phone_number, postcode, main_address, detailed_address, role)
            VALUES (#{name}, #{username}, #{nickname}, #{password}, #{gender}, #{nationality}, #{birthDate}, #{phoneNumber}, #{postcode}, #{mainAddress}, #{detailedAddress}, #{role})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertMember(Member member);

    // OAuth2 회원 정보 수정 (id 기반으로 변경)
    @Update("""
            UPDATE member
            SET username = #{username},
                name = #{name}
            WHERE id = #{id}
            """)
    int updateMember(Member member);

    // DiaryBoard (닉네임 기반 조회는 그대로 유지)


    @Select("""
            SELECT id, nickname
            FROM member
            WHERE nickname = #{nickname}
            """)
    Member selectByDiaryCommentName(String nickname);
}