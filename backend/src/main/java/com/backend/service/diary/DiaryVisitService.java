package com.backend.service.diary;

import com.backend.mapper.diary.DiaryVisitMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiaryVisitService {

    private final DiaryVisitMapper mapper;

    public void recordVisit(Integer diaryId, Integer memberId) {
        mapper.insertVisit(diaryId, memberId);
    }

    public int getTodayCount(Integer diaryId) {
        return mapper.countToday(diaryId);
    }

    public int getTotalCount(Integer diaryId) {
        return mapper.countTotal(diaryId);
    }
}
