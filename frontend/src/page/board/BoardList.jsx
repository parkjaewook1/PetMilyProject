import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"; // ✅ useLocation 추가
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faImage,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../../component/Pagination.jsx";
import axios from "@api/axiosConfig";

export function BoardList() {
  const [boardList, setBoardList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageAmount, setPageAmount] = useState(30);
  const [pageInfo, setPageInfo] = useState({});
  const [boardType, setBoardType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchType, setSearchType] = useState("전체");
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation(); // ✅ 전달받은 데이터 확인용
  const toast = useToast(); // ✅ 토스트 띄우기용

  // ✅ [삭제 토스트 로직] 빨간색(error) 스타일 적용
  useEffect(() => {
    if (location.state && location.state.message) {
      toast({
        status: "error", // 🔴 빨간색으로 나오게 설정 (원래는 success지만 색상을 위해 error 사용)
        description: location.state.message,
        position: "top",
        duration: 2000, // 조금 더 길게 (2초)
        isClosable: true,
      });
      // 토스트 띄운 후 state 초기화 (새로고침 시 또 뜨지 않게)
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  useEffect(() => {
    const boardTypeParam = searchParams.get("boardType") || "전체";
    const searchTypeParam = searchParams.get("searchType") || "전체";
    const keywordParam = searchParams.get("keyword") || "";

    setBoardType(boardTypeParam);
    setSearchType(searchTypeParam);
    setSearchKeyword(keywordParam);
    localStorage.setItem("currentBoardType", boardTypeParam);

    axios
      .get(`/api/board/list?${searchParams}`)
      .then((res) => {
        setBoardList(res.data.boardList);
        setPageInfo(res.data.pageInfo);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, [searchParams]);

  const handlePageSizeChange = (number) => {
    setPageAmount(number);
    searchParams.set("pageAmount", number);
    searchParams.set("offsetReset", true);
    navigate(`?${searchParams}`);
  };

  const pageNumbers = [];
  if (pageInfo.leftPageNumber && pageInfo.rightPageNumber) {
    for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) {
      pageNumbers.push(i);
    }
  }

  const handlePageButtonClick = (pageNumber) => {
    searchParams.set("page", pageNumber);
    searchParams.set("offsetReset", false);
    navigate(`?${searchParams}`);
  };

  const handleClickBoardTypeButton = (boardType) => {
    searchParams.set("offsetReset", true);
    setBoardType(boardType);
    searchParams.set("boardType", boardType);
    localStorage.setItem("currentBoardType", boardType);
    navigate(`?${searchParams}`);
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const handleSearchClick = () => {
    searchParams.set("searchType", searchType);
    searchParams.set("keyword", searchKeyword);
    searchParams.set("offsetReset", true);
    navigate(`?${searchParams}`);
  };

  const bg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  if (isLoading) {
    return (
      <Center mt={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Center mt={10}>
        <Flex p={4} borderRadius="md" alignItems="center">
          <FontAwesomeIcon icon={faBookOpen} size="2x" />
          <Heading as="h1" size="xl" ml={2}>
            {boardType} 게시판
          </Heading>
        </Flex>
      </Center>
      <Box textAlign="center" mt={5} mb={10}>
        <Text fontSize="lg" color="gray.600">
          여기에서 최신 게시물을 확인하세요.
        </Text>
      </Box>
      <Center mt={10}>
        <Box mb={10} w="100%" px={5}>
          {boardType === "반려동물 정보" ? (
            <SimpleGrid columns={[1, 2, 3]} spacing={10}>
              {boardList.map((board) => (
                <Box
                  key={board.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  p={4}
                  cursor="pointer"
                  onClick={() => handleBoardClick(board.id)}
                  _hover={{ bg: "gray.200" }}
                  bg={bg}
                >
                  {board.fileList && board.fileList.length > 0 && (
                    <Box mb={2} width="100%" height="200px" overflow="hidden">
                      {/* ✅ [원복] 원래 잘 되던 코드로 복구 */}
                      <Image
                        src={board.fileList[0].src}
                        alt="썸네일"
                        borderRadius="md"
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    </Box>
                  )}

                  <Box fontWeight="bold" as="h4" fontSize="xl" mb={2}>
                    {board.title}
                  </Box>
                  <Box fontSize="sm" color="gray.600" mb={2}>
                    {board.writer}
                  </Box>
                  <Box>
                    {board.numberOfImages > 0 && (
                      <Badge ml={2}>
                        {board.numberOfImages}
                        <FontAwesomeIcon icon={faImage} />
                      </Badge>
                    )}
                    {board.numberOfComments > 0 && (
                      <span> [{board.numberOfComments}]</span>
                    )}
                  </Box>
                  <Box mt={2} fontSize="sm" color="gray.500">
                    <span>추천수: {board.numberOfLikes}</span>
                    <span>조회수: {board.views}</span>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Table
              variant="simple"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
            >
              <Thead bg={useColorModeValue("gray.100", "gray.700")}>
                <Tr>
                  <Th textAlign="center" fontSize="lg" fontWeight="bold" py={4}>
                    게시판 종류
                  </Th>
                  <Th textAlign="center" fontSize="lg" fontWeight="bold" py={4}>
                    게시글ID
                  </Th>
                  <Th
                    w={500}
                    textAlign="center"
                    fontSize="lg"
                    fontWeight="bold"
                    py={4}
                  >
                    제목
                  </Th>
                  <Th textAlign="center" fontSize="lg" fontWeight="bold" py={4}>
                    작성자
                  </Th>
                  <Th textAlign="center" fontSize="lg" fontWeight="bold" py={4}>
                    추천수
                  </Th>
                  <Th textAlign="center" fontSize="lg" fontWeight="bold" py={4}>
                    조회수
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {boardList.map((board) => (
                  <Tr key={board.id} _hover={{ bg: hoverBg }}>
                    <Td textAlign="center" py={3}>
                      <span
                        onClick={() =>
                          handleClickBoardTypeButton(board.boardType)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {board.boardType}
                      </span>
                    </Td>
                    <Td textAlign="center" py={3}>
                      {board.id}
                    </Td>
                    <Td
                      onClick={() => handleBoardClick(board.id)}
                      cursor="pointer"
                      _hover={{ bg: "gray.200" }}
                      bg={board.id === selectedBoardId ? "gray.200" : ""}
                      textAlign="center"
                      py={3}
                    >
                      {board.title}
                      {board.numberOfImages > 0 && (
                        <Badge ml={2}>
                          {board.numberOfImages}
                          <FontAwesomeIcon icon={faImage} />
                        </Badge>
                      )}
                      {board.numberOfComments > 0 && (
                        <span> [{board.numberOfComments}]</span>
                      )}
                    </Td>
                    <Td textAlign="center" py={3}>
                      {board.writer}
                    </Td>
                    <Td textAlign="center" py={3}>
                      {board.numberOfLikes}
                    </Td>
                    <Td textAlign="center" py={3}>
                      {board.views}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Center>
      <Pagination
        pageInfo={pageInfo}
        pageNumbers={pageNumbers}
        handlePageButtonClick={handlePageButtonClick}
      />
      <Center mb={10}>
        <Flex gap={1} alignItems="center">
          <Box>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              bg={bg}
            >
              <option value="전체">전체</option>
              <option value="글">글</option>
              <option value="작성자">작성자</option>
            </Select>
          </Box>
          <Box>
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색어"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearchClick();
              }}
            />
          </Box>
          <Box>
            <Button onClick={handleSearchClick}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </Button>
          </Box>
        </Flex>
      </Center>

      <Center>
        <Flex
          maxW={"500px"}
          flexDirection={"column"}
          alignItems={"center"}
          gap={6}
        >
          <Box>
            <Menu textAlign={"center"} fontSize={"lg"}>
              {({ isOpen }) => (
                <>
                  <MenuButton
                    as={Button}
                    rightIcon={
                      isOpen ? <ChevronDownIcon /> : <ChevronDownIcon />
                    }
                    colorScheme={"blue"}
                    size={"md"}
                  >
                    {`게시글 (${pageAmount})개씩 보기`}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => handlePageSizeChange(10)}>
                      10개씩 보기
                    </MenuItem>
                    <MenuItem onClick={() => handlePageSizeChange(30)}>
                      30개씩 보기
                    </MenuItem>
                    <MenuItem onClick={() => handlePageSizeChange(50)}>
                      50개씩 보기
                    </MenuItem>
                    <MenuItem onClick={() => handlePageSizeChange(100)}>
                      100개씩 보기
                    </MenuItem>
                  </MenuList>
                </>
              )}
            </Menu>
          </Box>
        </Flex>
      </Center>
    </Container>
  );
}
