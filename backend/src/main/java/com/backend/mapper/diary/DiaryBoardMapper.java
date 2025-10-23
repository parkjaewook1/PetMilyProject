package com.backend.mapper.diary;

import com.backend.domain.diary.DiaryBoard;
import com.backend.domain.diary.MoodStat;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DiaryBoardMapper {

    //글 작성
    @Insert("""
                INSERT INTO diary_board(diary_id, title, content, mood, inserted, inserted_date)
                VALUES (#{diaryId}, #{title}, #{content}, #{mood}, #{inserted}, #{insertedDate})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DiaryBoard diaryBoard);

    // 전체 글 목록
    @Select("""
                SELECT db.id, db.diary_id,db.title, db.mood, db.inserted, m.nickname writer
                FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                JOIN member m ON d.member_id = m.id
                ORDER BY db.id DESC
            """)
    List<DiaryBoard> selectAll();

    // 글 상세 조회
    @Select("""
                SELECT db.id,db.diary_id, db.title, db.mood, db.content, db.inserted,
                       m.nickname writer, d.member_id
                FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                JOIN member m ON d.member_id = m.id
                WHERE db.id = #{id}
            """)
    DiaryBoard selectById(Integer id);

    // 글 삭제
    @Delete("""
                DELETE FROM diary_board
                WHERE id = #{id}
            """)
    int deleteById(Integer id);

    // 글 수정
    @Update("""
                UPDATE diary_board
                SET title = #{title},
                    content = #{content},
                    mood = #{mood}
                WHERE id = #{id}
            """)
    int update(DiaryBoard diaryBoard);

    // 페이징 + 검색
    @Select("""
                <script>
                SELECT db.id,db.diary_id, db.title, db.mood, m.nickname writer, db.inserted, db.content
                FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                JOIN member m ON d.member_id = m.id
                <where>
                    <if test="memberId != null">
                        d.member_id = #{memberId}
                    </if>
                    <if test="diaryId != null">
                       AND db.diary_id = #{diaryId}
                    </if>
                    <if test="searchType != null and keyword != null">
                        <bind name="pattern" value="'%' + keyword + '%'"/>
                        <choose>
                            <when test="searchType == 'text'">
                                AND (db.title LIKE #{pattern} OR db.content LIKE #{pattern})
                            </when>
                            <when test="searchType == 'nickname'">
                                AND m.nickname LIKE #{pattern}
                            </when>
                            <otherwise>
                                AND (db.title LIKE #{pattern} OR db.content LIKE #{pattern} OR m.nickname LIKE #{pattern})
                            </otherwise>
                        </choose>
                    </if>
                </where>
                GROUP BY db.id
                ORDER BY db.id DESC
                LIMIT #{offset}, 10
                </script>
            """)
    List<DiaryBoard> selectAllPaging(Integer offset, String searchType, String keyword, Integer memberId, Integer diaryId);

    // 페이징 카운트
    @Select("""
                <script>
                SELECT COUNT(db.id)
                FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                JOIN member m ON d.member_id = m.id
                <where>
                    <if test="memberId != null">
                        d.member_id = #{memberId}
                    </if>
                    <if test="diaryId != null">
                    AND db.diary_id = #{diaryId}
                    </if>
                    <if test="searchType != null and keyword != null">
                        <bind name="pattern" value="'%' + keyword + '%'"/>
                        <choose>
                            <when test="searchType == 'text'">
                                AND (db.title LIKE #{pattern} OR db.content LIKE #{pattern})
                            </when>
                            <when test="searchType == 'nickname'">
                                AND m.nickname LIKE #{pattern}
                            </when>
                            <otherwise>
                                AND (db.title LIKE #{pattern} OR db.content LIKE #{pattern} OR m.nickname LIKE #{pattern})
                            </otherwise>
                        </choose>
                    </if>
                </where>
                </script>
            """)
    Integer countAllWithSearch(String searchType, String keyword, Integer memberId, Integer diaryId);

    // 파일명 저장
    @Insert("""
                INSERT INTO diary_file(diary_id, name)
                VALUES (#{diaryId}, #{name})
            """)
    int insertFileName(Integer diaryId, String name);

    // 파일명 조회
    @Select("""
                SELECT name
                FROM diary_file
                WHERE diary_id = #{diaryId}
            """)
    List<String> selectFileNameByDiaryId(Integer diaryId);

    // 회원 탈퇴 시 글 삭제
    @Delete("""
                DELETE db FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                WHERE d.member_id = #{memberId}
            """)
    int deleteByMemberId(Integer memberId);

    // 전체 글 수
    @Select("""
                SELECT COUNT(*)
                FROM diary_board
            """)
    int countAll();

    // 파일 삭제
    @Delete("""
                DELETE FROM diary_file
                WHERE diary_id = #{diaryId}
            """)
    int deleteFileByDiaryId(Integer diaryId);

    // 회원의 다이어리 ID 조회
    @Select("""
                SELECT id
                FROM diary
                WHERE member_id = #{memberId}
            """)
    List<DiaryBoard> selectByMemberId(Integer memberId);

    // 특정 파일 삭제
    @Delete("""
                DELETE FROM diary_file
                WHERE diary_id = #{diaryId}
                  AND name = #{fileName}
            """)
    int deleteFileByDiaryIdAndName(Integer diaryId, String fileName);

    // 월별 mood 통계
    @Select("""
                SELECT mood, COUNT(*) AS count
                             FROM diary_board
                             WHERE diary_id = (
                                 SELECT id FROM diary WHERE member_id = #{memberId}
                             )
                             AND DATE_FORMAT(inserted, '%Y-%m') = #{yearMonth}
                             AND mood IS NOT NULL
                             GROUP BY mood
            """)
    List<MoodStat> getMonthlyMoodStats(@Param("memberId") Integer memberId,
                                       @Param("yearMonth") String yearMonth);

    // 글 ID로 작성자 member_id 조회
    @Select("""
                SELECT d.member_id
                FROM diary_board db
                JOIN diary d ON db.diary_id = d.id
                WHERE db.id = #{id}
            """)
    Integer selectMemberIdByDiaryBoardId(Integer id);


    @Select("""
                SELECT
                    b.id AS id,
                    b.diary_id,
                    b.title,
                    b.content,
                    b.inserted,
                    b.updated,
                    b.view_count,
                    b.mood
                FROM diary_board b
                WHERE b.diary_id = #{diaryId}
                ORDER BY b.inserted DESC
                LIMIT #{limit}
            """)
    List<DiaryBoard> selectRecentBoards(@Param("diaryId") Long diaryId,
                                        @Param("limit") int limit);

    @Select("""
                SELECT COUNT(*)
                FROM diary_board
                WHERE diary_id = #{diaryId}
                  AND inserted_date = #{today}
            """)
    int countByDiaryIdAndDate(@Param("diaryId") Integer diaryId,
                              @Param("today") LocalDate today);
}