import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  useColorModeValue,
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
import { faList, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export function DiaryComment() {
  const { encodedId } = useParams();
  const [parentComments, setParentComments] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { memberInfo } = useContext(LoginContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [numericDiaryId, setNumericDiaryId] = useState(0);
  const [searchType, setSearchType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const searchBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const bottomAreaBg = useColorModeValue("gray.50", "gray.800");

  // ... (useEffect 및 fetch 함수들 기존 동일) ...
  useEffect(() => {
    if (!encodedId || !memberInfo?.id) return;
    const fetchDiaryId = async () => {
      try {
        const res = await axios.get(`/api/diary/byMember/${encodedId}`);
        setNumericDiaryId(res.data.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDiaryId();
  }, [encodedId, memberInfo]);

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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllComments = async () => {
    if (!numericDiaryId) return;
    try {
      const res = await axios.get(`/api/diaryComment/all`, {
        params: { diaryId: numericDiaryId },
      });
      setAllComments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!numericDiaryId) return;
    fetchParentComments(currentPage);
    fetchAllComments();
  }, [numericDiaryId, currentPage]);

  const handleCommentAdded = (newComment) => {
    if (!newComment || !newComment.id) return;
    setAllComments((prev) => [...prev, newComment]);
    if (!newComment.replyCommentId)
      setParentComments((prev) => [newComment, ...prev]);
  };

  const handleSearch = ({ type, keyword }) => {
    setSearchType(type);
    setSearchKeyword(keyword);
    setCurrentPage(1);
    fetchParentComments(1, type, keyword);
  };

  if (isLoading)
    return (
      <Center h="200px">
        <Spinner color="blue.400" thickness="4px" />
      </Center>
    );

  return (
    <Box h="100%" display="flex" flexDirection="column" p={1}>
      {" "}
      {/* 전체 패딩 축소 */}
      {/* 1. 작성창 (여백 mb=1로 축소) */}
      <Box mb={1} flexShrink={0}>
        <DiaryCommentWrite
          diaryId={numericDiaryId}
          onCommentAdded={handleCommentAdded}
        />
      </Box>
      {/* 2. 리스트 (남은 공간 100% 활용) */}
      <Box flex={1} overflowY="hidden" mb={1}>
        <DiaryCommentList
          parentComments={parentComments}
          allComments={allComments}
          onCommentAdded={handleCommentAdded}
        />
      </Box>
      {/* 3. 하단 페이징/검색 (납작하게) */}
      <VStack
        spacing={0} // 간격 0
        py={1} // 상하 패딩 최소화
        borderTop="1px dashed"
        borderColor={borderColor}
        bg={bottomAreaBg}
        borderRadius="md"
        flexShrink={0}
      >
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
          size="xs"
        />

        <HStack gap={1} justify="center" w="100%" px={2} mt={1}>
          <Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="xs"
            w="70px"
            bg={searchBg}
            fontSize="xs"
          >
            <option value="all">전체</option>
            <option value="writer">이름</option>
            <option value="content">내용</option>
          </Select>
          <InputGroup size="xs" w="140px">
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색"
              bg={searchBg}
              fontSize="xs"
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleSearch({ type: searchType, keyword: searchKeyword });
              }}
            />
            <InputRightElement width="1.5rem">
              <Button
                h="100%"
                size="xs"
                onClick={() =>
                  handleSearch({ type: searchType, keyword: searchKeyword })
                }
                variant="ghost"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {(searchKeyword || searchType !== "all") && (
            <Button
              size="xs"
              fontSize="xs"
              leftIcon={<FontAwesomeIcon icon={faList} />}
              onClick={() => {
                setSearchKeyword("");
                handleSearch({ type: "all", keyword: "" });
              }}
            >
              목록
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}
