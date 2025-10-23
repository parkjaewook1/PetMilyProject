import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { DiaryCommentWrite } from "./DiaryCommentWrite.jsx";
import { DiaryCommentList } from "./DiaryCommentList.jsx";
import DiaryPagination from "./DiaryPagination.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export function DiaryComment() {
  const { encodedId } = useParams();
  const [parentComments, setParentComments] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { memberInfo } = useContext(LoginContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [numericDiaryId, setNumericDiaryId] = useState(0);

  // 검색 상태
  const [searchType, setSearchType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 다이어리 PK 조회
  useEffect(() => {
    if (!encodedId || !memberInfo?.id) return;
    const fetchDiaryId = async () => {
      try {
        const res = await axios.get(`/api/diary/byMember/${encodedId}`);
        setNumericDiaryId(res.data.id);
      } catch (err) {
        console.error("다이어리 ID 조회 실패:", err);
      }
    };
    fetchDiaryId();
  }, [encodedId, memberInfo]);

  // 부모 댓글 페이징
  const fetchParentComments = async (
    page,
    type = searchType,
    keyword = searchKeyword,
  ) => {
    if (!numericDiaryId) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/diaryComment/list`, {
        params: { diaryId: numericDiaryId, page, pageSize: 5, type, keyword },
      });
      setParentComments(res.data.comments || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching parent comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 전체 댓글 (대댓글 포함)
  const fetchAllComments = async () => {
    if (!numericDiaryId) return;
    try {
      const res = await axios.get(`/api/diaryComment/all`, {
        params: { diaryId: numericDiaryId },
      });
      setAllComments(res.data || []);
    } catch (err) {
      console.error("Error fetching all comments:", err);
    }
  };

  // numericDiaryId 세팅된 뒤에만 호출
  useEffect(() => {
    if (!numericDiaryId) return;
    fetchParentComments(currentPage);
    fetchAllComments();
  }, [numericDiaryId, currentPage]);

  const handleCommentAdded = (newComment) => {
    if (!newComment || !newComment.id) return;
    setAllComments((prev) => [...prev, newComment]);
    if (!newComment.replyCommentId) {
      setParentComments((prev) => [newComment, ...prev]);
    } else {
      setParentComments((prev) =>
        prev.map((c) =>
          c.id === newComment.replyCommentId
            ? { ...c, replyCount: (c.replyCount || 0) + 1 }
            : c,
        ),
      );
    }
  };

  // ✅ 검색 실행 핸들러
  const handleSearch = ({ type, keyword }) => {
    setSearchType(type);
    setSearchKeyword(keyword);
    setCurrentPage(1);
    fetchParentComments(1, type, keyword);
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
        diaryId={numericDiaryId}
        onCommentAdded={handleCommentAdded}
      />
      <DiaryCommentList
        parentComments={parentComments}
        allComments={allComments}
        diaryId={numericDiaryId}
        onCommentAdded={handleCommentAdded}
        onSearch={handleSearch} // ✅ 검색 연결
      />

      <Center my={6}>
        <VStack spacing={4} align="center">
          {/* ✅ 검색창 */}
          <Flex gap={2}>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              w="120px"
            >
              <option value="all">전체</option>
              <option value="writer">작성자</option>
              <option value="content">내용</option>
            </Select>
            <InputGroup w="250px">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="검색어 입력"
              />
              <InputRightElement>
                <Button
                  size="sm"
                  onClick={() =>
                    handleSearch({ type: searchType, keyword: searchKeyword })
                  }
                  colorScheme="teal"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
              </InputRightElement>
            </InputGroup>
          </Flex>

          {/* ✅ 목록으로 버튼 (검색창과 페이징 사이) */}
          <Button
            size="sm"
            variant="outline"
            colorScheme="gray"
            onClick={() => handleSearch({ type: "all", keyword: "" })}
          >
            목록
          </Button>

          {/* ✅ 페이지네이션 */}
          <DiaryPagination
            pageInfo={{
              currentPageNumber: currentPage,
              nextPageNumber: currentPage < totalPages ? currentPage + 1 : null,
              prevPageNumber: currentPage > 1 ? currentPage - 1 : null,
              lastPageNumber: totalPages,
            }}
            pageNumbers={Array.from({ length: totalPages }, (_, i) => i + 1)}
            handlePageButtonClick={setCurrentPage}
            maxPageButtons={5}
          />
        </VStack>
      </Center>
    </Box>
  );
}
