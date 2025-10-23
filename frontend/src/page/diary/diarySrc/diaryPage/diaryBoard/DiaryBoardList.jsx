import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
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
import Pagination from "../../../../../component/Pagination.jsx";

export function DiaryBoardList() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryBoardList, setDiaryBoardList } = useContext(DiaryContext); // DiaryContext 사용
  const [pageInfo, setPageInfo] = useState({});
  const { numericDiaryId, ownerId } = useOutletContext(); // ✅ 부모에서 받은 값
  const [searchType, setSearchType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { encodedId } = useParams();
  const isOwner = Number(memberInfo?.id) === Number(ownerId);
  const location = useLocation();
  const newPostId = location.state?.newPostId;

  function getMoodIcon(mood) {
    if (!mood) return "❓";
    switch (mood.toUpperCase()) {
      case "HAPPY":
        return "😊";
      case "SAD":
        return "😢";
      case "ANGRY":
        return "😡";
      case "NEUTRAL":
        return "😐";
      default:
        return "❓";
    }
  }
  useEffect(() => {
    if (!numericDiaryId) return;
    const params = new URLSearchParams(searchParams);
    params.set("diaryId", numericDiaryId); // ✅ 이제 numericDiaryId 사용
    axios.get(`/api/diaryBoard/list?${params.toString()}`).then((res) => {
      setDiaryBoardList(res.data.diaryBoardList);
      setPageInfo(res.data.pageInfo);
    });

    setSearchType("all");
    setSearchKeyword("");

    const typeParam = searchParams.get("type");
    const keywordParam = searchParams.get("keyword");
    if (typeParam) {
      setSearchType(typeParam);
    }
    if (keywordParam) {
      setSearchKeyword(keywordParam);
    }
  }, [searchParams, encodedId, setDiaryBoardList]);

  const pageNumbers = [];
  for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) {
    pageNumbers.push(i);
  }

  function handleSearchClick() {
    // 현재 URL의 쿼리 파라미터를 가져옵니다.
    const params = new URLSearchParams(searchParams);

    // 새로운 파라미터를 설정합니다.
    params.set("type", searchType);
    params.set("keyword", searchKeyword);
    params.set("diaryId", numericDiaryId); // ✅ numericDiaryId 사용

    // 수정된 쿼리 파라미터로 페이지를 이동합니다.
    console.log(params.toString());
    navigate(`?${params.toString()}`);
  }

  function handlePageButtonClick(pageNumber) {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber);
    params.set("diaryId", numericDiaryId); // ✅ numericDiaryId 사용
    navigate(`?${params.toString()}`);
  }

  function handleSelectedDiaryBoard(id) {
    return () => navigate(`/diary/${encodedId}/board/view/${id}`);
  }

  function handleWriteClick() {
    navigate(`/diary/${encodedId}/board/write`);
  }

  const hoverBg = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    if (newPostId) {
      const el = document.getElementById(`post-${newPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [newPostId]);

  return (
    <>
      <Box mb={5}></Box>
      <Center mb={4}>
        <Heading size="lg" color="dark" _dark={{ color: "teal.300" }}>
          일기장
        </Heading>
      </Center>
      <Flex justify="flex-end" mb={4}>
        {isOwner && <Button onClick={handleWriteClick}>✍️</Button>}
      </Flex>
      <Box>
        {diaryBoardList.length === 0 && <Center>조회 결과가 없습니다.</Center>}
        {diaryBoardList.length > 0 && (
          <Table w="100%" sx={{ tableLayout: "fixed" }}>
            <Thead>
              <Tr>
                <Th w="15%" textAlign="center">
                  N번째 일기
                </Th>
                <Th w="45%" textAlign="center">
                  제목
                </Th>
                <Th w="10%" textAlign="center">
                  기분
                </Th>
                <Th w="30%" textAlign="center">
                  작성일자
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {diaryBoardList.map((diaryBoard, index) => (
                <Tr
                  key={diaryBoard.id}
                  id={`post-${diaryBoard.id}`}
                  bg={diaryBoard.id === newPostId ? "yellow.50" : "transparent"} // ✅ 하이라이트
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={handleSelectedDiaryBoard(diaryBoard.id)}
                >
                  <Td w="15%" textAlign="center">
                    {diaryBoardList.length - index}
                  </Td>
                  <Td w="55%" textAlign="center">
                    {diaryBoard.title}
                    {/*{diaryBoard.numberOfImages > 0 && (*/}
                    {/*  <Badge ml={2} colorScheme="teal">*/}
                    {/*    <FontAwesomeIcon icon={faImages} />*/}
                    {/*    {diaryBoard.numberOfImages}*/}
                    {/*  </Badge>*/}
                    {/*)}*/}
                  </Td>
                  {/*<Td w="50%" textAlign="center">*/}
                  {/*  {diaryBoard.content}*/}
                  {/*</Td>*/}
                  <Td textAlign="center">
                    {getMoodIcon(diaryBoard.mood)} {/* ✅ mood 표시 */}
                  </Td>
                  <Td w="30%" textAlign="center">
                    {format(new Date(diaryBoard.inserted), "yyyy.MM.dd")}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
      <Pagination
        pageInfo={pageInfo}
        pageNumbers={pageNumbers}
        handlePageButtonClick={handlePageButtonClick}
      />

      <Center mb={10}>
        <Flex gap={2}>
          <Box>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              boxShadow="md"
              _hover={{ boxShadow: "lg" }}
            >
              <option value="all">전체</option>
              <option value="text">제목</option>
              <option value="nickname">작성자</option>
            </Select>
          </Box>
          <InputGroup
            size="md"
            w="300px"
            boxShadow="md"
            _hover={{ boxShadow: "lg" }}
          >
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              borderRadius="full" // 둥근 검색창 느낌
              pr="3rem" // 버튼 공간 확보
            />
            <InputRightElement width="3rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={handleSearchClick}
                colorScheme="teal"
                borderRadius="full"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </Flex>
      </Center>
    </>
  );
}
