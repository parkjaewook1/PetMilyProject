package com.backend.service.diary;

import com.backend.domain.diary.DiaryComment;
import com.backend.domain.member.Member;
import com.backend.mapper.diary.DiaryCommentMapper;
import com.backend.mapper.member.MemberMapper;
import com.backend.service.friends.FriendsService;
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
    private final DiaryService diaryService;
    private final FriendsService friendsService;


    public DiaryComment add(DiaryComment diaryComment, Authentication authentication) {
        // 1. 로그인된 사용자 정보 가져오기
        Member member = memberMapper.selectByUsername(authentication.getName());
        if (member == null) {
            throw new UsernameNotFoundException("로그인한 사용자를 찾을 수 없습니다.");
        }

        // 2. 작성자 ID 세팅
        diaryComment.setMemberId(member.getId());

        // 3. ✅ 대댓글(replyCommentId) 유효성 검증
        if (diaryComment.getReplyCommentId() != null) {
            DiaryComment parent = mapper.selectById(diaryComment.getReplyCommentId());
            if (parent == null) {
                throw new IllegalArgumentException("부모 댓글이 존재하지 않습니다.");
            }
            if (!parent.getDiaryId().equals(diaryComment.getDiaryId())) {
                throw new IllegalArgumentException("부모 댓글과 다른 다이어리에 대댓글을 달 수 없습니다.");
            }
        }

        // 4. 저장 (이 시점에는 profileImage 정보가 없음)
        mapper.diaryCommentInsert(diaryComment);

        // 5. ✅ [핵심] 저장된 ID로 다시 조회해서 리턴!
        // (Mapper의 selectById가 실행되면서 LEFT JOIN profile을 통해 사진 정보를 가져옵니다)
        return mapper.selectById(diaryComment.getId());
    }


    // ✅ 부모 댓글 페이징 목록 (대댓글은 미리보기 제외, replyCount만 내려줌)
    public Map<String, Object> list(Integer diaryId, int page, int pageSize, String type, String keyword) {
        // 부모 댓글 총 개수 (검색 조건 포함)
        int totalComments = mapper.countParentCommentsByDiaryIdAndSearch(diaryId, type, keyword);
        int totalPages = (int) Math.ceil((double) totalComments / pageSize);
        int offset = (page - 1) * pageSize;

        // 부모 댓글만 페이징 조회 (검색 조건 포함)
        List<DiaryComment> comments = mapper.selectParentCommentsBySearch(diaryId, type, keyword, pageSize, offset);

        // 각 부모 댓글에 replyCount만 세팅 (필요하다면 여기서 미리보기 replies 채울 수도 있음)
        for (DiaryComment comment : comments) {
            int replyCount = mapper.countReplies(comment.getId());
            comment.setReplyCount(replyCount);
            comment.setReplies(null); // 목록 조회 시에는 무거운 대댓글 리스트를 굳이 안 가져가도 됨 (더보기 버튼으로 해결)
        }

        Map<String, Object> result = new HashMap<>();
        result.put("comments", comments);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);

        return result;
    }

    public void diaryDelete(Integer commentId) {
        mapper.deleteById(commentId);
    }

    public void edit(DiaryComment diaryComment) {
        mapper.diaryUpdate(diaryComment);
    }

    public DiaryComment get(Integer commentId) {
        return mapper.selectById(commentId);
    }

    public boolean validate(DiaryComment diaryComment) {
        return diaryComment.getComment() != null && !diaryComment.getComment().isBlank();
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

        // 다이어리 주인 ID 조회
        Integer diaryOwnerId = mapper.findDiaryOwnerIdByDiaryId(diaryComment.getDiaryId());

        // 작성자 본인 또는 다이어리 주인이면 true
        return currentUser.getId().equals(commentOwnerId) || currentUser.getId().equals(diaryOwnerId);
    }

    public List<DiaryComment> getRecentComments(Integer diaryId, int limit) {
        return mapper.selectRecentComments(diaryId, limit);
    }

    // ✅ 특정 댓글의 전체 대댓글 조회 (더보기 API)
    public List<DiaryComment> getAllReplies(Integer commentId) {
        return mapper.selectAllReplies(commentId);
    }

    public List<DiaryComment> selectAllByDiaryId(Integer diaryId) {
        return mapper.selectAllByDiaryId(diaryId);
    }

    public boolean canAccessDiary(Integer diaryId, Authentication authentication) {
        var diary = diaryService.getDiaryById(diaryId);
        if (diary == null) return false;

        Integer userId = null;
        if (authentication != null) {
            Member currentUser = memberMapper.selectByUsername(authentication.getName());
            if (currentUser != null) {
                userId = currentUser.getId();
            }
        }

        boolean isOwner = (userId != null && userId.equals(diary.getMemberId()));
        boolean isFriend = (!isOwner && userId != null)
                && friendsService.checkFriendship(userId, diary.getMemberId());

        String visibility = diary.getVisibility();

        return isOwner
                || "PUBLIC".equalsIgnoreCase(visibility)
                || ("FRIENDS".equalsIgnoreCase(visibility) && isFriend);
    }
}