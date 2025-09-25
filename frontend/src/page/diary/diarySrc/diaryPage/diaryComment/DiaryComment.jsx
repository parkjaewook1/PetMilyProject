import { Box, Center, Spinner } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { DiaryCommentWrite } from "./DiaryCommentWrite.jsx";
import { DiaryCommentList } from "./DiaryCommentList.jsx";
import DiaryPagination from "./DiaryPagination.jsx";

export function DiaryComment() {
  const { diaryId } = useParams(); // URL 예: "DIARY-34-ID" 또는 숫자
  const [diaryCommentList, setDiaryCommentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { memberInfo } = useContext(LoginContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [numericDiaryId, setNumericDiaryId] = useState(0);

  // encodedId 또는 memberId로 다이어리 PK 조회
  useEffect(() => {
    if (!diaryId || !memberInfo?.id) return;

    const fetchDiaryId = async () => {
      try {
        const res = await axios.get(`/api/diary/byMember/${diaryId}`);
        setNumericDiaryId(res.data.id); // DB PK
      } catch (err) {
        console.error("다이어리 ID 조회 실패:", err);
      }
    };

    fetchDiaryId();
  }, [diaryId, memberInfo]);

  const fetchComments = async (page) => {
    if (!numericDiaryId) return;
    try {
      const res = await axios.get(`/api/diaryComment/list`, {
        params: { diaryId: numericDiaryId, page, pageSize: 5 },
      });
      setDiaryCommentList(res.data.comments || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(currentPage);
  }, [numericDiaryId, currentPage]);

  const handleCommentAdded = () => {
    fetchComments(currentPage);
  };

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Box>
      <DiaryCommentWrite
        diaryId={numericDiaryId} // PK 전달
        onCommentAdded={handleCommentAdded}
      />
      <DiaryCommentList diaryCommentList={diaryCommentList} />
      <DiaryPagination
        pageInfo={{
          currentPageNumber: currentPage,
          nextPageNumber: currentPage < totalPages ? currentPage + 1 : null,
          prevPageNumber: currentPage > 1 ? currentPage - 1 : null,
          lastPageNumber: totalPages,
        }}
        pageNumbers={Array.from({ length: totalPages }, (_, i) => i + 1)}
        handlePageButtonClick={setCurrentPage}
        maxPageButtons={10}
      />
    </Box>
  );
}
