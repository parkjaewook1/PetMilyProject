package com.backend.service.member;

import com.backend.domain.board.Board;
import com.backend.domain.diary.Diary;
import com.backend.domain.member.Member;
import com.backend.domain.member.Profile;
import com.backend.domain.member.Role;
import com.backend.mapper.board.BoardCommentMapper;
import com.backend.mapper.board.BoardMapper;
import com.backend.mapper.diary.DiaryBoardMapper;
import com.backend.mapper.diary.DiaryMapper;
import com.backend.mapper.member.MemberMapper;
import com.backend.mapper.member.ProfileMapper;
import com.backend.mapper.member.RefreshMapper;
import com.backend.service.board.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberMapper memberMapper;
    private final RefreshMapper refreshMapper;
    private final ProfileMapper profileMapper;
    private final DiaryBoardMapper diaryBoardMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    private final BoardService boardService;
    private final BoardMapper boardMapper;
    private final BoardCommentMapper boardCommentMapper;
    private final DiaryMapper diaryMapper;

    // ❌ Azure 클라이언트 제거됨

    // ✅ [수정] 오라클 로컬 저장소 경로 (application.properties에서 가져옴)
    @Value("${file.upload-dir}")
    private String uploadDir; // 예: /home/ubuntu/uploads/

    // ✅ [수정] 이미지 URL 접두사 (예: /uploads/)
    @Value("${image.src.prefix}")
    String srcPrefix;

    // 회원가입
    public void signup(Member member) {
        member.setPassword(passwordEncoder.encode(member.getPassword()));
        member.setRole(Role.USER);
        memberMapper.signup(member);

        // 2. 다이어리 자동 생성
        Diary diary = new Diary();
        diary.setMemberId(member.getId());
        diary.setTitle(member.getNickname() + "님의 다이어리");
        diary.setContent("");
        diary.setMood("HAPPY");
        diary.setVisibility("PUBLIC");
        diaryMapper.insertDiary(diary);
    }

    public Member getByUsername(String username) {
        return memberMapper.selectByUsername(username);
    }

    public Member getByNickname(String nickname) {
        return memberMapper.selectByNickname(nickname);
    }

    // 회원 단건 조회
    public Member getById(Integer id) {
        Member member = memberMapper.selectByMemberId(id);
        if (member == null) {
            return null;
        }
        Profile profile = profileMapper.selectProfileByMemberId(id);
        if (profile != null) {
            // ✅ [수정] Azure 경로 제거하고 로컬 경로로 매핑
            // 예: /uploads/1732432...jpg
            String imageUrl = srcPrefix + profile.getFileName();
            member.setImageUrl(imageUrl);
        }
        return member;
    }

    // 회원 수정
    public boolean update(Integer id, Member member) {
        member.setId(id);
        if (member.getPassword() != null && !member.getPassword().isEmpty()) {
            member.setPassword(passwordEncoder.encode(member.getPassword()));
        }
        return memberMapper.update(member) > 0;
    }

    // ✅ [수정] 프로필 이미지 저장 (로컬 폴더 사용)
    @Transactional
    public void saveProfileImage(Integer memberId, MultipartFile file) throws IOException {
        // 1. 파일명 생성 (충돌 방지용 시간값 추가)
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

        // 2. 로컬 저장소에 파일 저장 객체 생성
        File dest = new File(uploadDir + fileName);

        // 폴더가 없으면 생성 (안전장치)
        if (!dest.getParentFile().exists()) {
            dest.getParentFile().mkdirs();
        }

        // 실제 파일 저장
        file.transferTo(dest);

        // 3. DB 저장 정보 생성
        Profile profile = new Profile();
        profile.setMemberId(memberId);
        profile.setFileName(fileName);
        // 로컬 저장 시엔 uploadPath도 fileName과 같게 하거나, 상대경로로 저장
        profile.setUploadPath(fileName);

        // 4. 기존 프로필이 있다면? -> 파일 삭제 후 DB 갱신
        Profile existing = profileMapper.selectProfileByMemberId(memberId);
        if (existing != null) {
            deleteLocalImage(existing.getFileName()); // 기존 파일 삭제
            profileMapper.deleteProfileByMemberId(memberId);
        }

        profileMapper.insertProfile(profile);
    }

    public Profile getProfileByMemberId(Integer memberId) {
        return profileMapper.selectProfileByMemberId(memberId);
    }

    // 프로필 삭제
    public void deleteProfileByMemberId(Integer memberId) {
        Profile profile = profileMapper.selectProfileByMemberId(memberId);
        if (profile != null) {
            // ✅ [수정] Azure 삭제 함수 대신 로컬 삭제 함수 호출
            deleteLocalImage(profile.getFileName());
            profileMapper.deleteProfileByMemberId(memberId);
        }
    }

    // ✅ [추가] 로컬 파일 삭제 헬퍼 함수
    private void deleteLocalImage(String fileName) {
        if (fileName == null) return;
        try {
            File file = new File(uploadDir + fileName);
            if (file.exists()) {
                file.delete(); // 파일 삭제
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public String getSrcPrefix() {
        return srcPrefix;
    }

    // 회원 삭제
    public void delete(Integer id) {
        // 회원이 쓴 게시물 삭제
        List<Board> boardList = boardMapper.selectByMemberId(id);
        boardList.forEach(board -> boardService.delete(board.getId()));

        // 좋아요 삭제
        boardMapper.deleteLikeByMemberId(id);

        // 댓글 삭제
        boardCommentMapper.deleteByMemberId(id);

        // 다이어리 삭제
        diaryBoardMapper.selectByMemberId(id).forEach(diary -> {
            // 다이어리 삭제 로직
        });

        // Refresh 토큰 삭제
        Member member = memberMapper.selectByMemberId(id);
        if (member != null) {
            refreshMapper.deleteByUsername(member.getUsername());
        }

        // 프로필 사진 삭제 (추가: 회원 탈퇴 시 사진도 지워야 함)
        deleteProfileByMemberId(id);

        // 회원 삭제
        memberMapper.deleteById(id);
    }

    public boolean validatePassword(Integer id, String password) {
        Member dbMember = memberMapper.selectByMemberId(id);
        return dbMember != null && passwordEncoder.matches(password, dbMember.getPassword());
    }

    // 회원 목록
    public Map<String, Object> list(int page, int pageSize) {
        int totalMembers = memberMapper.countAllMembers();
        int totalPages = (int) Math.ceil((double) totalMembers / pageSize);
        int offset = (page - 1) * pageSize;

        List<Member> members = memberMapper.selectAll(pageSize, offset);

        Map<String, Object> result = new HashMap<>();
        result.put("members", members);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);

        return result;
    }

    public Map<String, Object> getMemberInfoById(Integer id) {
        Member member = memberMapper.selectByMemberId(id);
        Map<String, Object> map = new HashMap<>();
        if (member != null) {
            map.put("id", member.getId());
            map.put("username", member.getUsername());
            map.put("nickname", member.getNickname());
            map.put("role", member.getRole().name());
        }
        return map;
    }

    public Member getMemberByDiaryId(String diaryId) {
        try {
            int userId = Integer.parseInt(diaryId.split("-")[1]) / 17;
            Member member = memberMapper.selectByMemberId(userId);
            return member;
        } catch (Exception e) {
            return null;
        }
    }
}