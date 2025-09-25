package com.backend.service.diary;

import com.backend.domain.diary.DiaryBoard;
import com.backend.domain.diary.MoodStat;
import com.backend.mapper.diary.DiaryBoardMapper;
import com.backend.mapper.member.MemberMapper;
import com.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
// import java.util.List;
// import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class DiaryBoardService {

    private final DiaryBoardMapper mapper;
    private final MemberMapper memberMapper;

    public void add(DiaryBoard diaryBoard, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UsernameNotFoundException("인증 정보가 없습니다.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            diaryBoard.setMemberId(cud.getId());
            mapper.insert(diaryBoard);
        } else {
            throw new UsernameNotFoundException("인증된 사용자 정보를 찾을 수 없습니다.");
        }
    }

    public void add(DiaryBoard diaryBoard,
                    MultipartFile[] files,
                    Authentication authentication) throws IOException {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UsernameNotFoundException("인증 정보가 없습니다.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            diaryBoard.setMemberId(cud.getId());
            mapper.insert(diaryBoard);
            // 파일 저장 로직 필요 시 추가
        } else {
            throw new UsernameNotFoundException("인증된 사용자 정보를 찾을 수 없습니다.");
        }
    }

    public boolean validate(DiaryBoard diaryBoard) {
        return diaryBoard.getTitle() != null && !diaryBoard.getTitle().isBlank()
                && diaryBoard.getContent() != null && !diaryBoard.getContent().isBlank();
    }

    public Map<String, Object> list(Integer page, String searchType, String keyword, Integer memberId, Integer diaryId) {
        Map<String, Object> pageInfo = new HashMap<>();
        Integer countAll = mapper.countAllWithSearch(searchType, keyword, memberId, diaryId);
        Integer offset = (page - 1) * 10;
        Integer lastPageNumber = (countAll - 1) / 10 + 1;
        Integer leftPageNumber = (page - 1) / 10 * 10 + 1;
        Integer rightPageNumber = Math.min(leftPageNumber + 9, lastPageNumber);
        leftPageNumber = Math.max(rightPageNumber - 9, 1);
        Integer prevPageNumber = leftPageNumber - 1;
        Integer nextPageNumber = rightPageNumber + 1;
        if (prevPageNumber > 0) pageInfo.put("prevPageNumber", prevPageNumber);
        if (nextPageNumber <= lastPageNumber) pageInfo.put("nextPageNumber", nextPageNumber);
        pageInfo.put("currentPageNumber", page);
        pageInfo.put("lastPageNumber", lastPageNumber);
        pageInfo.put("leftPageNumber", leftPageNumber);
        pageInfo.put("rightPageNumber", rightPageNumber);
        return Map.of("pageInfo", pageInfo,
                "diaryBoardList", mapper.selectAllPaging(offset, searchType, keyword, memberId, diaryId));
    }

    public void remove(Integer id) {
        mapper.deleteById(id);
    }

    public void edit(DiaryBoard diaryBoard) throws IOException {
        mapper.update(diaryBoard);
    }

    public boolean hasAccess(Integer id, Authentication authentication, Integer memberId) {
        if (authentication == null || authentication.getPrincipal() == null) return false;
        Object principal = authentication.getPrincipal();
        Integer currentUserId = null;
        if (principal instanceof CustomUserDetails cud) {
            currentUserId = cud.getId();
        }
        Integer ownerId = (memberId != null) ? memberId : mapper.selectMemberIdByDiaryBoardId(id);
        return currentUserId != null && currentUserId.equals(ownerId);
    }

    public boolean hasAccess(Integer id, CustomUserDetails user, Integer memberId) {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities()
        );
        return hasAccess(id, auth, memberId);
    }

    public DiaryBoard get(Integer id) {
        return mapper.selectById(id);
    }

    public List<MoodStat> getMonthlyMoodStats(Integer memberId, String yearMonth) {
        return mapper.getMonthlyMoodStats(memberId, yearMonth);
    }
}