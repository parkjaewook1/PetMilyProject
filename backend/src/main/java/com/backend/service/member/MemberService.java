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
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

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
    private final S3Client s3Client;
    private final BoardService boardService;
    private final BoardMapper boardMapper;
    private final BoardCommentMapper boardCommentMapper;
    private final DiaryMapper diaryMapper;

    // s3 설정
    @Value("${aws.s3.bucket.name}")
    private String bucketName;

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
        diary.setMood("HAPPY"); // 기본값
        diary.setVisibility("PUBLIC");
        diaryMapper.insertDiary(diary);
    }

    // 로그인 전 중복 체크 등에 사용
    public Member getByUsername(String username) {
        return memberMapper.selectByUsername(username);
    }

    public Member getByNickname(String nickname) {
        return memberMapper.selectByNickname(nickname);
    }

    // 회원 단건 조회 (userId 기반)
    public Member getById(Integer id) {
        Member member = memberMapper.selectByMemberId(id);
        if (member == null) {
            return null;
        }
        Profile profile = profileMapper.selectProfileByMemberId(id);
        if (profile != null) {
            String imageUrl = srcPrefix + profile.getUploadPath();
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

    // 프로필 이미지 저장
    @Transactional
    public void saveProfileImage(Integer memberId, MultipartFile file) throws IOException {
        String fileName = memberId + "_" + file.getOriginalFilename();
        String key = "profile/" + memberId + "/" + fileName;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key("prj3/" + key)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();

        s3Client.putObject(objectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        Profile profile = new Profile();
        profile.setMemberId(memberId);
        profile.setFileName(fileName);
        profile.setUploadPath(key);

        Profile existing = profileMapper.selectProfileByMemberId(memberId);
        if (existing != null) {
            profileMapper.deleteProfileByMemberId(memberId);
        }

        profileMapper.insertProfile(profile);
    }

    public Profile getProfileByMemberId(Integer memberId) {
        return profileMapper.selectProfileByMemberId(memberId);
    }

    public void deleteProfileByMemberId(Integer memberId) {
        Profile profile = profileMapper.selectProfileByMemberId(memberId);
        if (profile != null) {
            deleteImageFromS3(profile.getUploadPath());
            profileMapper.deleteProfileByMemberId(memberId);
        }
    }

    private void deleteImageFromS3(String uploadPath) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key("prj3/" + uploadPath)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
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
            // 필요 시 다이어리 관련 삭제 로직 추가
        });

        // Refresh 토큰 삭제 (username 대신 id 기반 조회 후 username 추출)
        Member member = memberMapper.selectByMemberId(id);
        if (member != null) {
            refreshMapper.deleteByUsername(member.getUsername());
        }

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
            map.put("role", member.getRole().name()); // ✅ role 추가
        }
        return map;
    }

    // diary ID 유효성 검증
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