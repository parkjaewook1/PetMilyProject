import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Fade,
  Heading,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import { format } from "date-fns";
import { DiaryContext } from "../diaryComponent/DiaryContext.jsx";

export function DiaryHomeMain() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryBoardList, setDiaryBoardList } = useContext(DiaryContext);
  const [diaryCommentList, setDiaryCommentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { diaryId } = useParams();
  const [bannerImage, setBannerImage] = useState(null);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.600");
  const sectionBg = useColorModeValue("gray.100", "gray.800");

  const { numericDiaryId, ownerId, ownerNickname } = useOutletContext();
  // 항상 5줄 맞추기 위한 헬퍼
  const normalizeList = (list, type) => {
    const arr = Array.isArray(list) ? list.slice(0, 5) : [];
    while (arr.length < 5) {
      arr.push({
        id: `placeholder-${type}-${arr.length}`,
        __placeholder: true,
      });
    }
    return arr;
  };

  // ✅ numericDiaryId로 데이터 불러오기
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
        console.error("데이터를 가져오는 중 오류 발생:", err.response || err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [numericDiaryId, setDiaryBoardList]);
  // ✅ 새로고침 시 localStorage에서 불러오기
  useEffect(() => {
    const savedBanner = localStorage.getItem("bannerImage");
    if (savedBanner) {
      setBannerImage(savedBanner);
    }
  }, []);

  const handleBoardClick = (id) => {
    navigate(`/diary/${diaryId}/board/view/${id}`);
  };

  const handleCommentClick = (id) => {
    navigate(`/diary/${diaryId}/comment/view/${id}`);
  };

  if (isLoading) {
    return (
      <Center mt={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  const normalizedBoards = normalizeList(diaryBoardList, "board");
  const normalizedComments = normalizeList(diaryCommentList, "comment");

  return (
    <Box minH="100vh" bg={bg} p={7}>
      <Center>
        <Box mb={7} w="60%" maxW="800px" position="relative">
          <Image
            src={bannerImage || "/img/diary_main_minimi.jpg"}
            alt="Diary Banner"
            width="100%"
            h="auto"
            borderRadius="lg"
            boxShadow="lg"
          />

          {/* ✅ 주인만 보이는 업로드 버튼 */}
          {Number(memberInfo.id) === ownerId && (
            <Button
              size="sm"
              colorScheme="teal"
              position="absolute"
              bottom="10px"
              right="10px"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    // ✅ 개발 테스트용: localStorage 저장
                    localStorage.setItem("bannerImage", reader.result);
                    setBannerImage(reader.result);

                    // ✅ 배포용: S3 업로드 + DB 저장 로직으로 교체 예정
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              }}
            >
              배너 이미지 변경
            </Button>
          )}
        </Box>
      </Center>

      {/* 최근 게시물 */}
      <Fade in={true}>
        <Box bg={sectionBg} borderRadius="xl" p={5} mt={8}>
          <Heading size="md" mb={4} textAlign="center">
            최근 게시물
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} align="stretch">
            {/* 일기장 카드 */}
            <Card bg={cardBg} shadow="none" borderRadius="xl" h="full">
              <CardHeader p={1}>
                <Heading
                  fontSize="xs"
                  color="gray.800"
                  _dark={{ color: "gray.100" }}
                >
                  일기장
                </Heading>
              </CardHeader>
              <CardBody
                p={1}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
              >
                <Box w="100%">
                  {normalizedBoards.every((b) => b.__placeholder) ? (
                    <Fade in={true}>
                      <Box h="100%" textAlign="center" pt={20}>
                        <Text fontSize="2xl" mb={2}>
                          📝
                        </Text>
                        <Text fontWeight="bold" color="gray.600">
                          아직 작성된 게시물이 없습니다
                        </Text>
                        {Number(memberInfo.id) === ownerId && (
                          <Button
                            mt={2}
                            size="sm"
                            colorScheme="blue"
                            onClick={() =>
                              navigate(`/diary/${diaryId}/board/write`)
                            }
                          >
                            ✍️ 첫 글 작성하기
                          </Button>
                        )}
                      </Box>
                    </Fade>
                  ) : (
                    normalizedBoards.map((board, idx) => (
                      <Box
                        key={`board-${idx}`}
                        h="64px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                        p={1}
                        borderBottom={idx === 4 ? "none" : "1px solid"}
                        borderColor={borderColor}
                        _hover={
                          !board.__placeholder
                            ? {
                                bg: hoverBg,
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                              }
                            : {}
                        }
                        onClick={() =>
                          !board.__placeholder && handleBoardClick(board.id)
                        }
                      >
                        {!board.__placeholder && (
                          <>
                            <Text fontWeight="bold" fontSize="xs" noOfLines={1}>
                              제목: {board.title}
                            </Text>
                            <Text fontSize="2xs" noOfLines={1}>
                              {board.content}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="gray.500"
                              textAlign="right"
                            >
                              작성일:{" "}
                              {format(new Date(board.inserted), "yyyy.MM.dd")}
                            </Text>
                          </>
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* 방명록 카드 */}
            <Card bg={cardBg} shadow="none" borderRadius="xl" h="full">
              <CardHeader p={1}>
                <Heading
                  fontSize="xs"
                  color="gray.800"
                  _dark={{ color: "gray.100" }}
                >
                  방명록
                </Heading>
              </CardHeader>
              <CardBody
                p={1}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
              >
                <Box w="100%">
                  {normalizedComments.every((c) => c.__placeholder) ? (
                    <Fade in={true}>
                      <Box h="100%" textAlign="center" pt={20}>
                        <Text fontSize="2xl" mb={2}>
                          💬
                        </Text>
                        <Text fontWeight="bold" color="gray.600">
                          아직 방명록이 없습니다
                        </Text>
                        {Number(memberInfo.id) === ownerId && (
                          <Button
                            mt={2}
                            size="sm"
                            colorScheme="blue"
                            onClick={() =>
                              navigate(`/diary/${diaryId}/comment`)
                            }
                          >
                            ✍️ 첫 방명록 남기기
                          </Button>
                        )}
                      </Box>
                    </Fade>
                  ) : (
                    normalizedComments.map((comment, idx) => (
                      <Box
                        key={`comment-${idx}`}
                        h="64px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                        p={1}
                        borderBottom={idx === 4 ? "none" : "1px solid"}
                        borderColor={borderColor}
                        _hover={
                          !comment.__placeholder
                            ? {
                                bg: hoverBg,
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                              }
                            : {}
                        }
                        onClick={() =>
                          !comment.__placeholder &&
                          handleCommentClick(comment.id)
                        }
                      >
                        {!comment.__placeholder && (
                          <>
                            <Text fontWeight="bold" fontSize="xs" noOfLines={1}>
                              작성자: {comment.nickname}
                            </Text>
                            <Text fontSize="2xs" noOfLines={1}>
                              {comment.comment}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="gray.500"
                              textAlign="right"
                            >
                              작성일:{" "}
                              {format(new Date(comment.inserted), "yyyy.MM.dd")}
                            </Text>
                          </>
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </Fade>
    </Box>
  );
}
