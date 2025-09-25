import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Center,
  Heading,
  Image,
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
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import { format } from "date-fns";
import { DiaryContext } from "../diaryComponent/DiaryContext.jsx";

export function DiaryHomeMain() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryBoardList, setDiaryBoardList } = useContext(DiaryContext);
  const [diaryCommentList, setDiaryCommentList] = useState([]);
  const [numericDiaryId, setNumericDiaryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const { diaryId } = useParams(); // encodedId 또는 숫자

  // encodedId 또는 memberId로 다이어리 PK 조회
  useEffect(() => {
    if (!diaryId || !memberInfo?.id) {
      console.warn("유효하지 않은 아이디:", diaryId);
      setIsLoading(false);
      return;
    }

    const resolveDiaryId = async () => {
      try {
        // 백엔드에서 변환 + 주인 검증 + PK 조회까지 처리
        const res = await axios.get(`/api/diary/byMember/${diaryId}`);
        setNumericDiaryId(res.data.id); // DB PK
      } catch (err) {
        if (err.response?.status === 404) {
          console.warn("다이어리를 찾을 수 없습니다.");
        } else if (err.response?.status === 403) {
          console.warn("접근 권한이 없습니다.");
        } else {
          console.error("다이어리 ID 확인 실패:", err.response || err);
        }
        setIsLoading(false);
      }
    };

    resolveDiaryId();
  }, [diaryId, memberInfo]);

  // numericDiaryId로 데이터 불러오기
  useEffect(() => {
    if (!numericDiaryId || !memberInfo?.id) return;

    const fetchData = async () => {
      try {
        const diaryBoardRes = await axios.get("/api/diaryBoard/list", {
          params: { diaryId: numericDiaryId, limit: 5 },
        });

        const diaryCommentRes = await axios.get("/api/diaryComment/list", {
          params: { diaryId: numericDiaryId, limit: 5 },
        });

        setDiaryBoardList(diaryBoardRes.data.diaryBoardList || []);
        setDiaryCommentList(
          Array.isArray(diaryCommentRes.data.comments)
            ? diaryCommentRes.data.comments
            : [],
        );
      } catch (err) {
        console.error("데이터를 가져오는 중 오류 발생:", err.response || err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [numericDiaryId, memberInfo?.id, setDiaryBoardList]);

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

  return (
    <Box>
      <Center>
        <Box mb={5}>
          <Image
            src="../../../../../public/img/diary_main_minimi.jpg"
            alt="Diary Banner"
            width="100%"
            h="auto"
            borderRadius="md"
            boxShadow="md"
          />
        </Box>
      </Center>

      <Box mb={10}>
        <Heading size="lg" mb={5}>
          최근 게시물
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
          {/* 일기장 */}
          <Box>
            <Heading size="md" mb={3}>
              일기장
            </Heading>
            {diaryBoardList.length === 0 ? (
              <Text>조회 결과가 없습니다.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th w="10%">No.</Th>
                    <Th>제목</Th>
                    <Th>내용</Th>
                    <Th w="20%">작성일</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {diaryBoardList.slice(0, 5).map((diaryBoard, index) => (
                    <Tr
                      key={diaryBoard.id}
                      onClick={() => handleBoardClick(diaryBoard.id)}
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                    >
                      <Td fontSize="sm">{diaryBoardList.length - index}</Td>
                      <Td
                        fontSize="sm"
                        maxW="100px"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {diaryBoard.title}
                      </Td>
                      <Td
                        fontSize="sm"
                        maxW="100px"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {diaryBoard.content}
                      </Td>
                      <Td fontSize="sm">
                        {format(new Date(diaryBoard.inserted), "yyyy.MM.dd")}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>

          {/* 방명록 */}
          <Box>
            <Heading size="md" mb={3}>
              방명록
            </Heading>
            {diaryCommentList.length === 0 ? (
              <Text>방명록이 없습니다.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th w="10%">No.</Th>
                    <Th>닉네임</Th>
                    <Th>내용</Th>
                    <Th w="20%">작성일</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {diaryCommentList.slice(0, 5).map((diaryComment, index) => (
                    <Tr
                      key={diaryComment.id}
                      onClick={() => handleCommentClick(diaryComment.id)}
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                    >
                      <Td fontSize="sm">{index + 1}</Td>
                      <Td
                        fontSize="sm"
                        maxW="100px"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {diaryComment.nickname}
                      </Td>
                      <Td
                        fontSize="sm"
                        maxW="200px"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {diaryComment.comment.substring(0, 20)}
                      </Td>
                      <Td fontSize="sm">
                        {format(new Date(diaryComment.inserted), "yyyy.MM.dd")}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
