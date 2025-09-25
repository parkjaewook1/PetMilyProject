package com.backend.mapper.member;

import com.backend.domain.member.Member;
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

    // 회원 목록
    @Select("""
            SELECT *
            FROM member
            ORDER BY id ASC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Member> selectAll(@Param("limit") int limit, @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*)
            FROM member
            """)
    int countAllMembers();

    // 회원 단건 조회 (id 기반)
    @Select("""
            SELECT *
            FROM member
            WHERE id = #{id}
            """)
    Member selectByMemberId(Integer id);

    // 회원 수정
    @Update("""
            UPDATE member
            SET nickname = #{nickname},
                password = #{password},
                gender = #{gender},
                nationality = #{nationality},
                name = #{name},
                birth_date = #{birthDate},
                phone_number = #{phoneNumber},
                postcode = #{postcode},
                main_address = #{mainAddress},
                detailed_address = #{detailedAddress}
            WHERE id = #{id}
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
            INSERT INTO member(name, username, nickname, password, gender, nationality, birth_date, phone_number, postcode, main_address, detailed_address)
            VALUES (#{name}, #{username}, #{nickname}, #{password}, #{gender}, #{nationality}, #{birthDate}, #{phoneNumber}, #{postcode}, #{mainAddress}, #{detailedAddress})
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