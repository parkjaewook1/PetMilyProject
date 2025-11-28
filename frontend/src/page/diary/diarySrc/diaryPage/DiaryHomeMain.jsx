import React, { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Fade,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import { format } from "date-fns";
import { DiaryContext } from "../diaryComponent/DiaryContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCamera,
  faChevronRight,
  faComments,
  faList,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { generateDiaryId } from "../../../../util/util.jsx";

export function DiaryHomeMain() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryBoardList, setDiaryBoardList } = useContext(DiaryContext);
  const [diaryCommentList, setDiaryCommentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [bannerImage, setBannerImage] = useState(null);

  // ✅ [중요] 본인의 오라클 클라우드 버킷 주소로 변경하세요!
  const IMG_BASE_URL =
    "https://objectstorage.ap-chuncheon-1.oraclecloud.com/n/본인계정네임스페이스/b/본인버킷이름/o/";

  // ✅ [추가] DiaryCommentItem과 동일한 이미지 주소 처리 로직
  const getProfileUrl = (imageName) => {
    if (!imageName) return null;
    // 1. 소셜 로그인 등 외부 링크(http)면 그대로 사용
    if (imageName.startsWith("http")) return imageName;
    // 2. 그 외에는 파일명 앞에 오라클 클라우드 주소 붙이기
    return `${IMG_BASE_URL}${imageName}`;
  };

  // 🎨 디자인 컬러
  const bgGradient = useColorModeValue(
    "linear(to-br, #fdfbfb, #ebedee)",
    "linear(to-br, gray.800, gray.900)",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const { numericDiaryId, ownerId, ownerNickname } = useOutletContext();
  const diaryId = generateDiaryId(ownerId);

  // 5줄 채우기 (빈칸 유지)
  const normalizeList = (list) => {
    const arr = Array.isArray(list) ? list.slice(0, 5) : [];
    while (arr.length < 5) {
      arr.push(null);
    }
    return arr;
  };

  // 데이터 로딩
  useEffect(() => {
    if (!numericDiaryId) return;
    const fetchData = async () => {
      try {
        const diaryBoardRes = await axios.get(
          `/api/diaryBoard/${numericDiaryId}/recent-boards`,
          { params: { limit: 5 } },
        );
        setDiaryBoardList(diaryBoardRes.data || []);

        const diaryCommentRes = await axios.get(
          `/api/diaryComment/${numericDiaryId}/recent-comments`,
          { params: { limit: 5 } },
        );
        setDiaryCommentList(
          Array.isArray(diaryCommentRes.data) ? diaryCommentRes.data : [],
        );
      } catch (err) {
        console.error("데이터 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [numericDiaryId, setDiaryBoardList]);

  useEffect(() => {
    const savedBanner = localStorage.getItem("bannerImage");
    if (savedBanner) {
      setBannerImage(savedBanner);
    }
  }, []);

  const handleBoardClick = (boardId) => {
    navigate(`/diary/${diaryId}/board/view/${boardId}`);
  };

  const handleCommentClick = (commentId) => {
    navigate(`/diary/${diaryId}/comment/view/${commentId}`);
  };

  const handleBannerChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("bannerImage", reader.result);
        setBannerImage(reader.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (isLoading) {
    return (
      <Center mt={20}>
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  const normalizedBoards = normalizeList(diaryBoardList);
  const normalizedComments = normalizeList(diaryCommentList);
  const itemHeight = "72px"; // 리스트 아이템 높이 통일

  return (
    <Box minH="100vh" bgGradient={bgGradient} pb={20}>
      {/* 🌟 1. 커버 화면 */}
      <Box
        position="relative"
        w="100%"
        h={{ base: "280px", md: "380px" }}
        overflow="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="gray.900"
      >
        <Image
          src={bannerImage || "/img/diary_main_minimi.jpg"}
          alt="Diary Banner"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          opacity={0.6}
          transition="transform 0.3s"
          _hover={{ transform: "scale(1.02)" }}
        />
        {Number(memberInfo?.id) === ownerId && (
          <Button
            position="absolute"
            top={4}
            right={4}
            size="sm"
            leftIcon={<FontAwesomeIcon icon={faCamera} />}
            bg="whiteAlpha.300"
            color="white"
            _hover={{ bg: "whiteAlpha.500" }}
            onClick={handleBannerChange}
            backdropFilter="blur(5px)"
          >
            배경 변경
          </Button>
        )}
      </Box>

      {/* 📜 2. 메인 콘텐츠 */}
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} mt={10}>
        <Fade in={true}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* 🟦 2-1. 일기장 (생략 - 기존 코드 유지) */}
            <Card
              bg={cardBg}
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
            >
              {/* ... (일기장 부분 코드는 기존과 동일하므로 생략) ... */}
              <CardHeader
                borderBottom="1px solid"
                borderColor={borderColor}
                py={5}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Center
                      w="40px"
                      h="40px"
                      bg="purple.50"
                      color="purple.500"
                      borderRadius="lg"
                    >
                      <Icon as={FontAwesomeIcon} icon={faBookOpen} />
                    </Center>
                    <VStack align="start" spacing={0}>
                      <Heading size="md" color="gray.700">
                        일기
                      </Heading>
                    </VStack>
                  </HStack>
                  {Number(memberInfo?.id) === ownerId ? (
                    <Button
                      size="sm"
                      colorScheme="purple"
                      borderRadius="full"
                      onClick={() => navigate(`/diary/${diaryId}/board/write`)}
                    >
                      <Icon as={FontAwesomeIcon} icon={faPen} mr={1} /> 글쓰기
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      color="gray.500"
                      onClick={() => navigate(`/diary/${diaryId}/board/list`)}
                    >
                      전체보기{" "}
                      <Icon
                        as={FontAwesomeIcon}
                        icon={faChevronRight}
                        ml={1}
                        size="xs"
                      />
                    </Button>
                  )}
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <VStack spacing={0} align="stretch">
                  {normalizedBoards.map((board, idx) => (
                    <Box
                      key={idx}
                      h={itemHeight}
                      borderBottom={idx < 4 ? "1px solid" : "none"}
                      borderColor={borderColor}
                    >
                      {board ? (
                        <Flex
                          h="100%"
                          align="center"
                          px={6}
                          cursor="pointer"
                          _hover={{ bg: "purple.50" }}
                          onClick={() => handleBoardClick(board.id)}
                        >
                          <VStack
                            spacing={0}
                            mr={5}
                            bg="gray.50"
                            minW="45px"
                            h="45px"
                            justify="center"
                            borderRadius="md"
                            color="gray.600"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              lineHeight="1"
                            >
                              {format(new Date(board.inserted), "MM")}
                            </Text>
                            <Text
                              fontSize="lg"
                              fontWeight="extrabold"
                              lineHeight="1"
                              color="purple.500"
                            >
                              {format(new Date(board.inserted), "dd")}
                            </Text>
                          </VStack>
                          <VStack
                            align="start"
                            spacing={0}
                            flex={1}
                            overflow="hidden"
                          >
                            <Text
                              fontWeight="bold"
                              color="gray.700"
                              fontSize="sm"
                              noOfLines={1}
                            >
                              {board.title}
                            </Text>
                            <Text fontSize="xs" color="gray.400" noOfLines={1}>
                              {board.content}
                            </Text>
                          </VStack>
                        </Flex>
                      ) : (
                        <Box w="100%" h="100%" />
                      )}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* 🟩 2-2. 방명록 (Guest Book) */}
            <Card
              bg={cardBg}
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
            >
              <CardHeader
                borderBottom="1px solid"
                borderColor={borderColor}
                py={5}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Center
                      w="40px"
                      h="40px"
                      bg="teal.50"
                      color="teal.500"
                      borderRadius="lg"
                    >
                      <Icon as={FontAwesomeIcon} icon={faComments} />
                    </Center>
                    <VStack align="start" spacing={0}>
                      <Heading size="md" color="gray.700">
                        방명록
                      </Heading>
                    </VStack>
                  </HStack>

                  <Button
                    size="sm"
                    colorScheme="teal"
                    borderRadius="full"
                    onClick={() => navigate(`/diary/${diaryId}/comment`)}
                  >
                    <Icon as={FontAwesomeIcon} icon={faList} mr={1} /> 전체보기
                  </Button>
                </Flex>
              </CardHeader>

              <CardBody p={0}>
                <VStack spacing={0} align="stretch">
                  {normalizedComments.map((comment, idx) => (
                    <Box
                      key={idx}
                      h={itemHeight}
                      borderBottom={idx < 4 ? "1px solid" : "none"}
                      borderColor={borderColor}
                    >
                      {comment ? (
                        <Flex
                          h="100%"
                          align="center"
                          px={6}
                          cursor="pointer"
                          _hover={{ bg: "teal.50" }}
                          onClick={() => handleCommentClick(comment.id)}
                          transition="background 0.2s"
                        >
                          {/* ✅ [수정] getProfileUrl 함수 적용! */}
                          <Avatar
                            size="sm"
                            src={getProfileUrl(comment.profileImage)}
                            name={comment.nickname}
                            mr={5}
                          />
                          <VStack
                            align="start"
                            spacing={0}
                            flex={1}
                            overflow="hidden"
                          >
                            <HStack w="100%" justify="space-between">
                              <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.700"
                              >
                                {comment.nickname}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {format(new Date(comment.inserted), "MM.dd")}
                              </Text>
                            </HStack>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              noOfLines={1}
                              mt={0.5}
                            >
                              {comment.comment}
                            </Text>
                          </VStack>
                        </Flex>
                      ) : (
                        <Box w="100%" h="100%" />
                      )}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Fade>
      </Box>
    </Box>
  );
}
