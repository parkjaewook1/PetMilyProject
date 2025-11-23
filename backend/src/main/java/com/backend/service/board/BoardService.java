package com.backend.service.board;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
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
    // AWS S3Client 대신 Azure BlobContainerClient 주입
    private final BlobContainerClient blobContainerClient;
    private final BoardCommentMapper boardCommentMapper;

    private static String PAGE_INFO_SESSION_KEY = "pageInfo";

    // bucketName은 이제 필요 없습니다. (BlobContainerClient가 이미 알고 있음)

    // 중요: application.properties에서 이 경로가 Azure 주소로 변경되어야 합니다.
    @Value("${image.src.prefix}")
    private String srcPrefix;

    public void add(Board board, MultipartFile[] files) throws IOException {
        mapper.insert(board);

        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                mapper.insertFileName(board.getId(), file.getOriginalFilename());

                // 파일 경로 생성 (예: prj3/board/1/image.jpg)
                String fileName = String.format("prj3/board/%d/%s", board.getId(), file.getOriginalFilename());

                // Azure에 업로드
                BlobClient blobClient = blobContainerClient.getBlobClient(fileName);
                blobClient.upload(file.getInputStream(), file.getSize(), true); // true = 덮어쓰기 허용
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

        // 세션에서 값 가져오기
        Object sessionValue = session.getAttribute(PAGE_INFO_SESSION_KEY);
        Integer offset;

        // 세션 값이 없을 때 초기화
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
                // Azure URL 형식에 맞춰짐 (srcPrefix가 정확해야 함)
                String thumbnailUrl = srcPrefix + "prj3/board/" + board.getId() + "/" + firstImageName;
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

        // Azure 경로로 매핑 (중간에 prj3 경로가 빠져있었던 것 같아 추가함, 확인 필요)
        List<BoardFile> files = fileNames.stream()
                .map(name -> new BoardFile(name, srcPrefix + "prj3/board/" + id + "/" + name))
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

        // Azure Blob 삭제
        for (String fileName : fileNames) {
            // Java 21 Template String 사용 (기존 코드 유지)
            String key = STR."prj3/board/\{id}/\{fileName}";
            BlobClient blobClient = blobContainerClient.getBlobClient(key);
            blobClient.deleteIfExists();
        }

        mapper.deleteFileByBoardId(id);
        mapper.deleteLikeByBoardId(id);
        boardCommentMapper.deleteByBoardId(id);
        mapper.deleteById(id);
    }

    public void edit(Board board, List<String> removeFileList, MultipartFile[] addFileList) throws IOException {
        if (removeFileList != null && removeFileList.size() > 0) {
            for (String fileName : removeFileList) {
                // Azure 파일 삭제
                String key = STR."prj3/board/\{board.getId()}/\{fileName}";
                BlobClient blobClient = blobContainerClient.getBlobClient(key);
                blobClient.deleteIfExists();

                mapper.deleteFileByBoardIdAndName(board.getId(), fileName);
            }
        }
        if (addFileList != null && addFileList.length > 0) {
            List<String> fileNameList = mapper.selectFileNameByBoardId(board.getId());
            for (MultipartFile file : addFileList) {
                String fileName = file.getOriginalFilename();
                if (!fileNameList.contains(fileName)) {
                    mapper.insertFileName(board.getId(), fileName);
                }

                // Azure 파일 업로드
                String key = STR."prj3/board/\{board.getId()}/\{fileName}";
                BlobClient blobClient = blobContainerClient.getBlobClient(key);
                blobClient.upload(file.getInputStream(), file.getSize(), true);
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
                    // Azure 경로 반영
                    image.put("imageUrl", srcPrefix + "prj3/board/" + id + "/" + imageUrl);
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getGuideBoards() {
        List<Map<String, Object>> GuideBoards = mapper.selectGuideBoards();
        return GuideBoards.stream()
                .peek(image -> {
                    String imageUrl = (String) image.get("imageUrl");
                    Integer id = (Integer) image.get("id");
                    // Azure 경로 반영
                    image.put("imageUrl", srcPrefix + "prj3/board/" + id + "/" + imageUrl);
                })
                .collect(Collectors.toList());
    }
}