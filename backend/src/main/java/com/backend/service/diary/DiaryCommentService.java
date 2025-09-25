// DiaryCommentService.java
package com.backend.service.diary;

import com.backend.domain.diary.DiaryComment;
import com.backend.domain.member.Member;
import com.backend.mapper.diary.DiaryCommentMapper;
import com.backend.mapper.member.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class DiaryCommentService {
    final DiaryCommentMapper mapper;
    private final MemberMapper memberMapper;

    public void add(DiaryComment diaryComment, Authentication authentication) {
        // 로그인한 사용자 정보 가져오기
        Member member = memberMapper.selectByUsername(authentication.getName());
        if (member == null) {
            throw new UsernameNotFoundException("로그인한 사용자를 찾을 수 없습니다.");
        }

        diaryComment.setMemberId(member.getId());
        mapper.diaryCommentInsert(diaryComment);
    }

    public Map<String, Object> list(Integer diaryId, int page, int pageSize) {
        int totalComments = mapper.countByDiaryId(diaryId);
        int totalPages = (int) Math.ceil((double) totalComments / pageSize);
        int offset = (page - 1) * pageSize;

        List<DiaryComment> comments = mapper.selectByDiaryId(diaryId, pageSize, offset);

        Map<String, Object> result = new HashMap<>();
        result.put("comments", comments);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);

        return result;
    }

    public void diaryDelete(Integer id) {
        mapper.deleteById(id);
    }

    public void edit(DiaryComment diaryComment) {
        mapper.diaryUpdate(diaryComment);
    }

    public DiaryComment get(Integer commentId) {
        return mapper.selectById(commentId);
    }

    public boolean validate(DiaryComment diaryComment) {
        if (diaryComment.getComment() == null || diaryComment.getComment().isBlank()) {
            return false;
        }
        return true;
    }

    public boolean hasAccess(Integer commentId, Authentication authentication) {
        // 현재 로그인한 사용자 정보
        Member currentUser = memberMapper.selectByUsername(authentication.getName());
        if (currentUser == null) {
            throw new UsernameNotFoundException("로그인한 사용자를 찾을 수 없습니다.");
        }

        // 댓글 정보
        DiaryComment diaryComment = mapper.selectById(commentId);
        if (diaryComment == null) {
            return false;
        }

        // 댓글 작성자 ID
        Integer commentOwnerId = diaryComment.getMemberId();

        // 다이어리 주인 ID 조회 (DiaryComment에 diaryId가 있다고 가정)
        Integer diaryOwnerId = mapper.findDiaryOwnerIdByDiaryId(diaryComment.getDiaryId());

        // 작성자 본인 또는 다이어리 주인이면 true
        return currentUser.getId().equals(commentOwnerId) || currentUser.getId().equals(diaryOwnerId);
    }
}
