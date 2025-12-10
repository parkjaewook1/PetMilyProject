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

    // ... (add, list, delete, edit, get, validate 메서드는 기존 유지) ...
    public DiaryComment add(DiaryComment diaryComment, Authentication authentication) {
        Member member = memberMapper.selectByUsername(authentication.getName());
        if (member == null) {
            throw new UsernameNotFoundException("로그인한 사용자를 찾을 수 없습니다.");
        }
        diaryComment.setMemberId(member.getId());
        if (diaryComment.getReplyCommentId() != null) {
            DiaryComment parent = mapper.selectById(diaryComment.getReplyCommentId());
            if (parent == null) {
                throw new IllegalArgumentException("부모 댓글이 존재하지 않습니다.");
            }
            if (!parent.getDiaryId().equals(diaryComment.getDiaryId())) {
                throw new IllegalArgumentException("부모 댓글과 다른 다이어리에 대댓글을 달 수 없습니다.");
            }
        }
        mapper.diaryCommentInsert(diaryComment);
        return mapper.selectById(diaryComment.getId());
    }

    public Map<String, Object> list(Integer diaryId, int page, int pageSize, String type, String keyword) {
        int totalComments = mapper.countParentCommentsByDiaryIdAndSearch(diaryId, type, keyword);
        int totalPages = (int) Math.ceil((double) totalComments / pageSize);
        int offset = (page - 1) * pageSize;
        List<DiaryComment> comments = mapper.selectParentCommentsBySearch(diaryId, type, keyword, pageSize, offset);
        for (DiaryComment comment : comments) {
            int replyCount = mapper.countReplies(comment.getId());
            comment.setReplyCount(replyCount);
            comment.setReplies(null);
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
    // ... (여기까지 기존 코드 유지) ...

    // ⚡️ [핵심 수정 1] 댓글 수정/삭제 권한 확인 (403 해결)
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

        // ⚡️ [수정 포인트] 모든 ID를 Long으로 변환하여 안전하게 비교
        // (DB가 Long이고 Java가 Integer일 때 equals가 false 뜨는 것 방지)
        Long currentUserId = Long.valueOf(currentUser.getId());
        Long commentOwnerId = Long.valueOf(diaryComment.getMemberId());

        // 다이어리 주인 ID도 Long으로 변환
        Integer diaryOwnerIdInt = mapper.findDiaryOwnerIdByDiaryId(diaryComment.getDiaryId());
        Long diaryOwnerId = (diaryOwnerIdInt != null) ? Long.valueOf(diaryOwnerIdInt) : null;

        // 작성자 본인 또는 다이어리 주인이면 true
        return currentUserId.equals(commentOwnerId) || currentUserId.equals(diaryOwnerId);
    }

    public List<DiaryComment> getRecentComments(Integer diaryId, int limit) {
        return mapper.selectRecentComments(diaryId, limit);
    }

    public List<DiaryComment> getAllReplies(Integer commentId) {
        return mapper.selectAllReplies(commentId);
    }

    public List<DiaryComment> selectAllByDiaryId(Integer diaryId) {
        return mapper.selectAllByDiaryId(diaryId);
    }

    // ⚡️ [핵심 수정 2] 다이어리 접근 권한 (비공개/친구공개 로직)
    public boolean canAccessDiary(Integer diaryId, Authentication authentication) {
        var diary = diaryService.getDiaryById(diaryId);
        if (diary == null) return false;

        Integer userId = null;
        Long currentUserId = null; // Long 타입 변수 추가

        if (authentication != null) {
            Member currentUser = memberMapper.selectByUsername(authentication.getName());
            if (currentUser != null) {
                userId = currentUser.getId();
                currentUserId = Long.valueOf(userId); // Long으로 변환
            }
        }

        // ⚡️ [수정 포인트] 여기서도 Long 타입으로 변환해서 비교해야 안전함
        // diary.getMemberId()가 Long일 가능성이 큼
        Long diaryOwnerId = Long.valueOf(diary.getMemberId());

        boolean isOwner = (currentUserId != null && currentUserId.equals(diaryOwnerId));

        // 친구 체크 로직도 안전하게 (userId는 Integer 그대로 쓰는게 맞는지, Long인지 friendsService 확인 필요하지만, 보통 Integer로 넘김)
        boolean isFriend = (!isOwner && userId != null)
                && friendsService.checkFriendship(userId, diary.getMemberId());

        String visibility = diary.getVisibility();

        return isOwner
                || "PUBLIC".equalsIgnoreCase(visibility)
                || ("FRIENDS".equalsIgnoreCase(visibility) && isFriend);
    }
}