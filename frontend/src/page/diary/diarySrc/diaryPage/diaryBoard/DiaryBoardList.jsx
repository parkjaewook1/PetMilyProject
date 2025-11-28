import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faMagnifyingGlass,
  faPenNib,
} from "@fortawesome/free-solid-svg-icons";
import axios from "@api/axiosConfig";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { DiaryContext } from "../../diaryComponent/DiaryContext.jsx";
import { format } from "date-fns";

// ✅ 경로 확인 필수! (방명록 폴더에 있는 페이지네이션을 가져옵니다)
import DiaryPagination from "../diaryComment/DiaryPagination.jsx";

export function DiaryBoardList() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryBoardList, setDiaryBoardList } = useContext(DiaryContext);
  const [pageInfo, setPageInfo] = useState({});
  const { numericDiaryId, ownerId } = useOutletContext();
  const [searchType, setSearchType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { encodedId } = useParams();
  const isOwner = Number(memberInfo?.id) === Number(ownerId);
  const location = useLocation();
  const newPostId = location.state?.newPostId;

  // ✅ 로딩 상태 (데이터 가져오기 전까지 true)
  const [isLoading, setIsLoading] = useState(true);

  // 🎨 스타일 변수 (Hook은 항상 최상단에!)
  const titleColor = "blue.600";
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const dateColor = useColorModeValue("gray.500", "gray.400");

  function getMoodIcon(mood) {
    if (!mood) return "-";
    switch (mood.toUpperCase()) {
      case "HAPPY":
        return "🥰";
      case "SAD":
        return "😭";
      case "ANGRY":
        return "😡";
      case "NEUTRAL":
        return "😐";
      default:
        return "🤔";
    }
  }

  // 데이터 조회
  useEffect(() => {
    if (!numericDiaryId) return;

    setIsLoading(true); // 로딩 시작

    const params = new URLSearchParams(searchParams);
    params.set("diaryId", numericDiaryId);

    axios
      .get(`/api/diaryBoard/list?${params.toString()}`)
      .then((res) => {
        setDiaryBoardList(res.data.diaryBoardList || []);
        setPageInfo(res.data.pageInfo || {});
      })
      .catch((err) => {
        console.error("일기장 불러오기 실패:", err);
      })
      .finally(() => {
        setIsLoading(false); // 로딩 종료
      });

    setSearchType("all");
    setSearchKeyword("");

    const typeParam = searchParams.get("type");
    const keywordParam = searchParams.get("keyword");
    if (typeParam) setSearchType(typeParam);
    if (keywordParam) setSearchKeyword(keywordParam);
  }, [searchParams, encodedId, setDiaryBoardList, numericDiaryId]);

  // 페이지 번호 계산
  const pageNumbers = [];
  if (pageInfo && pageInfo.leftPageNumber) {
    for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) {
      pageNumbers.push(i);
    }
  }

  function handleSearchClick() {
    const params = new URLSearchParams(searchParams);
    params.set("type", searchType);
    params.set("keyword", searchKeyword);
    params.set("diaryId", numericDiaryId);
    params.set("page", 1);
    navigate(`?${params.toString()}`);
  }

  function handlePageButtonClick(pageNumber) {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber);
    params.set("diaryId", numericDiaryId);
    navigate(`?${params.toString()}`);
  }

  function handleSelectedDiaryBoard(id) {
    return () => navigate(`/diary/${encodedId}/board/view/${id}`);
  }

  function handleWriteClick() {
    navigate(`/diary/${encodedId}/board/write`);
  }

  // 새 글 하이라이트 스크롤
  useEffect(() => {
    if (newPostId && !isLoading) {
      const el = document.getElementById(`post-${newPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [newPostId, isLoading]);

  // -------------------------------------------------------
  // 🚫 조건부 리턴 (반드시 Hook 선언들보다 아래에 있어야 함)
  // -------------------------------------------------------
  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner color="blue.400" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box h="100%" display="flex" flexDirection="column" p={2}>
      {/* 1. 헤더 영역 */}
      <Flex
        justify="space-between"
        align="flex-end"
        mb={2}
        pb={2}
        borderBottom="1px dashed"
        borderColor="gray.300"
      >
        <HStack>
          <FontAwesomeIcon icon={faBookOpen} color="#3182ce" />
          <Heading
            size="md"
            color={titleColor}
            fontFamily="'Gulim', sans-serif"
          >
            How was my day?
          </Heading>
        </HStack>
        {isOwner && (
          <Button
            size="xs"
            leftIcon={<FontAwesomeIcon icon={faPenNib} />}
            colorScheme="blue"
            variant="outline"
            onClick={handleWriteClick}
          >
            일기쓰기
          </Button>
        )}
      </Flex>

      {/* 2. 게시판 리스트 (스크롤 영역) */}
      <Box flex={1} overflowY="auto">
        {!diaryBoardList || diaryBoardList.length === 0 ? (
          <Center h="200px" color="gray.500" fontSize="sm">
            작성된 일기가 없습니다.
          </Center>
        ) : (
          <Table size="sm" variant="simple">
            <Thead bg={tableHeadBg}>
              <Tr>
                <Th w="10%" textAlign="center" fontFamily="'Gulim', sans-serif">
                  No
                </Th>
                <Th w="50%" textAlign="center" fontFamily="'Gulim', sans-serif">
                  제목
                </Th>
                <Th w="15%" textAlign="center" fontFamily="'Gulim', sans-serif">
                  기분
                </Th>
                <Th w="25%" textAlign="center" fontFamily="'Gulim', sans-serif">
                  날짜
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {diaryBoardList.map((diaryBoard, index) => (
                <Tr
                  key={diaryBoard.id}
                  id={`post-${diaryBoard.id}`}
                  bg={diaryBoard.id === newPostId ? "yellow.50" : "transparent"}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={handleSelectedDiaryBoard(diaryBoard.id)}
                  transition="all 0.2s"
                >
                  <Td textAlign="center" fontSize="xs" color="gray.500">
                    {diaryBoard.id}
                  </Td>
                  <Td>
                    <Text fontSize="sm" noOfLines={1} fontWeight="medium">
                      {diaryBoard.title}
                    </Text>
                  </Td>
                  <Td textAlign="center" fontSize="lg">
                    {getMoodIcon(diaryBoard.mood)}
                  </Td>
                  <Td
                    textAlign="center"
                    fontSize="xs"
                    color={dateColor}
                    fontFamily="'Gulim', sans-serif"
                  >
                    {format(new Date(diaryBoard.inserted), "yyyy.MM.dd")}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* 3. 하단 검색 및 페이징 */}
      <Box mt={4}>
        {/* ✅ 방명록용 작은 페이지네이션 사용 */}
        <DiaryPagination
          pageInfo={{
            currentPageNumber: pageInfo.currentPageNumber || 1,
            nextPageNumber: pageInfo.nextPageNumber,
            prevPageNumber: pageInfo.prevPageNumber,
            lastPageNumber: pageInfo.lastPageNumber || 1,
          }}
          pageNumbers={pageNumbers}
          handlePageButtonClick={handlePageButtonClick}
          maxPageButtons={5}
          size="xs" // 버튼 사이즈 작게
        />

        {/* 검색창 */}
        <Center mt={2}>
          <HStack spacing={1}>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              size="xs"
              w="80px"
              bg="white"
            >
              <option value="all">전체</option>
              <option value="text">제목</option>
            </Select>
            <InputGroup size="xs" w="150px">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="검색어"
                bg="white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchClick();
                }}
              />
              <InputRightElement>
                <Button size="xs" variant="ghost" onClick={handleSearchClick}>
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
              </InputRightElement>
            </InputGroup>
          </HStack>
        </Center>
      </Box>
    </Box>
  );
}
