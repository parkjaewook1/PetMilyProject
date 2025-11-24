package com.backend.service.board;

import com.backend.domain.board.Board;
import com.backend.domain.board.BoardFile;
import com.backend.domain.board.BoardReport;
import com.backend.mapper.board.BoardCommentMapper;
import com.backend.mapper.board.BoardMapper;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class BoardService {

    private final BoardMapper mapper;
    private final BoardCommentMapper boardCommentMapper;

    private static String PAGE_INFO_SESSION_KEY = "pageInfo";

    // ✅ [수정] 로컬 저장소 경로 (application.properties)
    @Value("${file.upload-dir}")
    private String uploadDir; // 예: /home/ubuntu/uploads/

    // ✅ [수정] 이미지 URL 접두사 (예: http://150...:8080/uploads/)
    @Value("${image.src.prefix}")
    private String srcPrefix;

    public void add(Board board, MultipartFile[] files) throws IOException {
        mapper.insert(board);

        if (files != null && files.length > 0) {
            // 1. 게시판별 폴더 생성 (예: uploads/board/1/)
            String boardPath = uploadDir + "board/" + board.getId() + "/";
            File folder = new File(boardPath);
            if (!folder.exists()) {
                folder.mkdirs(); // 폴더가 없으면 생성
            }

            for (MultipartFile file : files) {
                mapper.insertFileName(board.getId(), file.getOriginalFilename());

                // 2. 파일 저장 (로컬)
                File dest = new File(boardPath + file.getOriginalFilename());
                file.transferTo(dest);
            }
        }
    }

    public boolean validate(Board board) {
        return board.getTitle() != null && !board.getTitle().isBlank() &&
                board.getContent() != null && !board.getContent().isBlank();
    }

    public Map<String, Object> list(Integer page, Integer pageAmount, Boolean offsetReset, HttpSession session, String boardType,
                                    String searchType, String keyword) {
        if (page <= 0) {
            throw new IllegalArgumentException("page must be greater than 0");
        }

        Object sessionValue = session.getAttribute(PAGE_INFO_SESSION_KEY);
        Integer offset;

        if (sessionValue == null) {
            offset = 1;
            session.setAttribute(PAGE_INFO_SESSION_KEY, offset);
        } else if (sessionValue instanceof Integer) {
            offset = (Integer) sessionValue;
        } else if (sessionValue instanceof String) {
            try {
                offset = Integer.valueOf((String) sessionValue);
            } catch (NumberFormatException e) {
                throw new IllegalStateException("Invalid type for session attribute", e);
            }
        } else {
            throw new IllegalStateException("Invalid type for session attribute");
        }

        session.setAttribute(PAGE_INFO_SESSION_KEY, offset);

        Map<String, Object> pageInfo = new HashMap<>();
        if (offsetReset) {
            offset = 0;
            page = 1;
            pageInfo.put("currentPageNumber", 1);
        } else {
            offset = (page - 1) * pageAmount;
            pageInfo.put("currentPageNumber", page);
        }

        Integer countByBoardType;
        if (boardType.equals("전체") && searchType.equals("전체") && keyword.equals("")) {
            countByBoardType = mapper.selectAllCount();
        } else {
            countByBoardType = mapper.selectByBoardType(boardType, searchType, keyword);
        }

        Integer lastPageNumber = (countByBoardType - 1) / pageAmount + 1;
        Integer leftPageNumber = (page - 1) / 10 * 10 + 1;
        Integer rightPageNumber = Math.min(leftPageNumber + 9, lastPageNumber);
        Integer prevPageNumber = (leftPageNumber > 1) ? leftPageNumber - 1 : null;
        Integer nextPageNumber = (rightPageNumber < lastPageNumber) ? rightPageNumber + 1 : null;

        if (prevPageNumber != null) {
            pageInfo.put("prevPageNumber", prevPageNumber);
        }
        if (nextPageNumber != null) {
            pageInfo.put("nextPageNumber", nextPageNumber);
        }

        pageInfo.put("lastPageNumber", lastPageNumber);
        pageInfo.put("leftPageNumber", leftPageNumber);
        pageInfo.put("rightPageNumber", rightPageNumber);
        pageInfo.put("offset", offset);

        List<Board> boardList = mapper.selectAllPaging(offset, pageAmount, boardType, searchType, keyword);

        for (Board board : boardList) {
            String firstImageName = mapper.getFileImageByboardId(board.getId().toString());
            if (firstImageName != null) {
                // ✅ [수정] 로컬 이미지 URL 생성 (board/게시판ID/파일명)
                String thumbnailUrl = srcPrefix + "board/" + board.getId() + "/" + firstImageName;
                List<BoardFile> fileList = Collections.singletonList(new BoardFile(firstImageName, thumbnailUrl));
                board.setFileList(fileList);
            }
        }

        return Map.of("pageInfo", pageInfo, "boardList", boardList);
    }

    public Map<String, Object> getByBoardIdAndMemberId(Integer id, Integer memberId) {
        int views = mapper.selectCountById(id);
        mapper.incrementViewsById(id, views);

        Map<String, Object> result = new HashMap<>();
        Board board = mapper.selectById(id);
        List<String> fileNames = mapper.selectFileNameByBoardId(id);

        // ✅ [수정] 로컬 이미지 URL 생성
        List<BoardFile> files = fileNames.stream()
                .map(name -> new BoardFile(name, srcPrefix + "board/" + id + "/" + name))
                .collect(Collectors.toList());

        board.setFileList(files);
        Map<String, Object> like = new HashMap<>();

        if (memberId == null) {
            like.put("like", false);
        } else {
            int c = mapper.selectLikeByBoardIdAndMemberId(id, memberId);
            like.put("like", c == 1);
        }
        like.put("count", mapper.selectCountLikeByBoardId(id));
        result.put("board", board);
        result.put("like", like);

        return result;
    }

    public void delete(Integer id) {
        List<String> fileNames = mapper.selectFileNameByBoardId(id);

        // ✅ [수정] 로컬 파일 삭제
        for (String fileName : fileNames) {
            String filePath = uploadDir + "board/" + id + "/" + fileName;
            File file = new File(filePath);
            if (file.exists()) {
                file.delete();
            }
        }
        // 빈 폴더도 삭제 (선택사항)
        File folder = new File(uploadDir + "board/" + id + "/");
        if (folder.exists()) {
            folder.delete();
        }

        mapper.deleteFileByBoardId(id);
        mapper.deleteLikeByBoardId(id);
        boardCommentMapper.deleteByBoardId(id);
        mapper.deleteById(id);
    }

    public void edit(Board board, List<String> removeFileList, MultipartFile[] addFileList) throws IOException {
        // 파일 삭제
        if (removeFileList != null && removeFileList.size() > 0) {
            for (String fileName : removeFileList) {
                // ✅ [수정] 로컬 파일 삭제
                String filePath = uploadDir + "board/" + board.getId() + "/" + fileName;
                File file = new File(filePath);
                if (file.exists()) {
                    file.delete();
                }
                mapper.deleteFileByBoardIdAndName(board.getId(), fileName);
            }
        }
        // 파일 추가
        if (addFileList != null && addFileList.length > 0) {
            // 폴더 확인 및 생성
            String boardPath = uploadDir + "board/" + board.getId() + "/";
            File folder = new File(boardPath);
            if (!folder.exists()) folder.mkdirs();

            List<String> fileNameList = mapper.selectFileNameByBoardId(board.getId());
            for (MultipartFile file : addFileList) {
                String fileName = file.getOriginalFilename();
                if (!fileNameList.contains(fileName)) {
                    mapper.insertFileName(board.getId(), fileName);
                }

                // ✅ [수정] 로컬 파일 업로드
                File dest = new File(boardPath + fileName);
                file.transferTo(dest);
            }
        }
        mapper.update(board);
    }

    public boolean hasAccess(Integer id, Integer memberId) {
        Board board = mapper.selectById(id);
        return board.getMemberId().equals(memberId) || memberId == 1;
    }

    public Map<String, Object> like(Map<String, Object> req) {
        Map<String, Object> result = new HashMap<>();
        result.put("like", false);

        Integer boardId;
        Integer memberId;

        try {
            boardId = req.get("boardId") instanceof String
                    ? Integer.parseInt((String) req.get("boardId"))
                    : (Integer) req.get("boardId");
            memberId = req.get("memberId") instanceof String
                    ? Integer.parseInt((String) req.get("memberId"))
                    : (Integer) req.get("memberId");
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid boardId or memberId format");
        }

        int count = mapper.deleteLikeByBoardIdAndMemberId(boardId, memberId);
        if (count == 0) {
            mapper.insertLikeByBoardIdAndMemberId(boardId, memberId);
            result.put("like", true);
        }
        result.put("count", mapper.selectCountLikeByBoardId(boardId));

        return result;
    }


    public boolean isLoggedIn(Integer memberId) {
        return memberId != null && memberId > 0;
    }


    public boolean addReport(Map<String, Object> req) {
        BoardReport boardReport = new BoardReport();
        boardReport.setBoardId((Integer) req.get("boardId"));
        boardReport.setMemberId((Integer) req.get("memberId"));
        boardReport.setContent((String) req.get("reason"));
        boardReport.setReportType((String) req.get("reportType"));

        int count = mapper.selectCountReportWithPrimaryKey(boardReport);
        if (count == 0) {
            mapper.insertReport(boardReport);
            return true;
        } else {
            return false;
        }
    }

    public Map<String, Object> reportList(Integer page, Integer pageAmount, Boolean offsetReset, HttpSession session, String boardType, String searchType, String keyword) {
        if (page <= 0) {
            throw new IllegalArgumentException("page must be greater than 0");
        }

        Object sessionValue = session.getAttribute(PAGE_INFO_SESSION_KEY);
        Integer offset;

        if (sessionValue == null) {
            offset = 1;
            session.setAttribute(PAGE_INFO_SESSION_KEY, offset);
        } else if (sessionValue instanceof Integer) {
            offset = (Integer) sessionValue;
        } else if (sessionValue instanceof String) {
            try {
                offset = Integer.valueOf((String) sessionValue);
            } catch (NumberFormatException e) {
                throw new IllegalStateException("Invalid type for session attribute", e);
            }
        } else {
            throw new IllegalStateException("Invalid type for session attribute");
        }

        session.setAttribute(PAGE_INFO_SESSION_KEY, offset);

        Map<String, Object> pageInfo = new HashMap<>();
        if (offsetReset) {
            offset = 0;
            page = 1;
            pageInfo.put("currentPageNumber", 1);
        } else {
            offset = (page - 1) * pageAmount;
            pageInfo.put("currentPageNumber", page);
        }

        Integer countByBoardType;
        if (boardType.equals("전체") && searchType.equals("전체") && keyword.equals("")) {
            countByBoardType = mapper.selectAllCountWithReportBoard();
        } else {
            countByBoardType = mapper.selectByBoardTypeWithReportBoard(boardType, searchType, keyword);
        }

        Integer lastPageNumber = (countByBoardType - 1) / pageAmount + 1;
        Integer leftPageNumber = (page - 1) / 10 * 10 + 1;
        Integer rightPageNumber = Math.min(leftPageNumber + 9, lastPageNumber);
        Integer prevPageNumber = (leftPageNumber > 1) ? leftPageNumber - 1 : null;
        Integer nextPageNumber = (rightPageNumber < lastPageNumber) ? rightPageNumber + 1 : null;

        if (prevPageNumber != null) {
            pageInfo.put("prevPageNumber", prevPageNumber);
        }
        if (nextPageNumber != null) {
            pageInfo.put("nextPageNumber", nextPageNumber);
        }

        pageInfo.put("lastPageNumber", lastPageNumber);
        pageInfo.put("leftPageNumber", leftPageNumber);
        pageInfo.put("rightPageNumber", rightPageNumber);
        pageInfo.put("offset", offset);

        return Map.of("pageInfo", pageInfo, "boardList", mapper.selectAllPagingWithReportBoard(offset, pageAmount, boardType, searchType, keyword));
    }

    public Map<String, Object> reportContent(Integer boardId) {
        Map<String, Object> response = new HashMap<>();
        Board board = mapper.selectBoardById(boardId);
        List<BoardReport> reports = mapper.selectReportsByBoardId(boardId);

        response.put("board", board);
        response.put("reports", reports);
        return response;
    }

    public List<Board> getLatestBoards() {
        return mapper.selectLatestBoards();
    }

    public List<Board> getPopularBoards() {
        return mapper.selectPopularBoards();
    }

    public List<Map<String, Object>> getTopLikedImages() {
        List<Map<String, Object>> topLikedImages = mapper.selectTopLikedImages();
        return topLikedImages.stream()
                .peek(image -> {
                    String imageUrl = (String) image.get("imageUrl");
                    Integer id = (Integer) image.get("id");
                    // ✅ [수정] 로컬 이미지 URL 생성
                    image.put("imageUrl", srcPrefix + "board/" + id + "/" + imageUrl);
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getGuideBoards() {
        List<Map<String, Object>> GuideBoards = mapper.selectGuideBoards();
        return GuideBoards.stream()
                .peek(image -> {
                    String imageUrl = (String) image.get("imageUrl");
                    Integer id = (Integer) image.get("id");
                    // ✅ [수정] 로컬 이미지 URL 생성
                    image.put("imageUrl", srcPrefix + "board/" + id + "/" + imageUrl);
                })
                .collect(Collectors.toList());
    }
}