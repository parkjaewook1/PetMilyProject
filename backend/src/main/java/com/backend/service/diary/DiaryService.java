package com.backend.service.diary;

import com.backend.domain.diary.Diary;
import com.backend.domain.diary.DiaryProfile;
import com.backend.domain.diary.MoodStat;
import com.backend.mapper.diary.DiaryBoardMapper;
import com.backend.mapper.diary.DiaryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryProfileService diaryProfileService;
    private final DiaryMapper diaryMapper;
    private final DiaryBoardMapper diaryBoardMapper; // 추가

    public List<MoodStat> getMonthlyMoodStats(Integer memberId, String yearMonth) {
        // diary_board 기준으로 통계 조회
        return diaryBoardMapper.getMonthlyMoodStats(memberId, yearMonth);
    }

    public DiaryProfile getProfile(Integer ownerId) {
        return diaryProfileService.getProfileByMemberId(ownerId);
    }

    @Transactional
    public void createProfile(Integer ownerId, String statusMessage, String introduction) {
        diaryProfileService.createProfile(ownerId, statusMessage, introduction);
    }

    @Transactional
    public void updateProfile(Integer ownerId, String statusMessage, String introduction) {
        diaryProfileService.updateProfile(ownerId, statusMessage, introduction);
    }

    public boolean profileExists(Integer ownerId) {
        return diaryProfileService.profileExists(ownerId);
    }

    public Diary getDiaryByMemberId(Integer memberId) {
        return diaryMapper.selectByMemberId(memberId);
    }

    public Diary getDiaryById(Integer id) {
        return diaryMapper.selectById(id);
    }


}