import { useNavigate, useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import { DiaryContext } from "../../diaryComponent/DiaryContext.jsx";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faPaperclip,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryBoardView() {
  const { id } = useParams();
  const { diaryBoardList } = useContext(DiaryContext);
  const [diaryBoard, setDiaryBoard] = useState(null);
  const { memberInfo } = useContext(LoginContext);
  const nickname = memberInfo?.nickname || null;

  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const memberId = memberInfo && memberInfo.id ? parseInt(memberInfo.id) : null;
  const params = memberId ? { memberId } : {};
  const diaryId = generateDiaryId(memberInfo?.id); // memberInfo가 없을 수도 있으므로 ?. 처리

  // 🎨 스타일 변수
  const titleColor = "blue.600";
  const labelColor = "gray.500";
  const contentBg = useColorModeValue("gray.50", "gray.700"); // 본문 배경
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    axios
      .get(`/api/diaryBoard/${id}`)
      .then((res) => {
        setDiaryBoard(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            status: "info",
            description: "해당 게시물이 존재하지 않습니다.",
            position: "top",
          });
          navigate(`/diary/${diaryId}/board/list`);
        }
      });
  }, [id, navigate, toast, diaryId]);

  const handleClickRemove = () => {
    axios
      .delete(`/api/diaryBoard/${diaryBoard.id}`, { params })
      .then(() => {
        toast({
          status: "success",
          description: "게시물이 삭제되었습니다.",
          position: "top",
        });
        navigate(`/diary/${diaryId}/board/list`);
      })
      .catch(() => {
        toast({
          status: "error",
          description: "게시물 삭제 중 오류가 발생하였습니다.",
          position: "top",
        });
      })
      .finally(onClose);
  };

  const handleDiaryEdit = () => {
    navigate(`/diary/${diaryId}/board/edit/${id}`);
  };

  if (diaryBoard === null) {
    return (
      <Flex h="300px" justify="center" align="center">
        <Spinner color="blue.400" thickness="4px" />
      </Flex>
    );
  }

  const isOwner = diaryBoard.writer === nickname;
  // diaryBoardList가 로딩 안 된 상태일 수 있으므로 방어 코드 추가
  const diaryIndex = diaryBoardList
    ? diaryBoardList.findIndex((item) => item.id === Number(id))
    : -1;
  const diaryNumber = diaryBoardList ? diaryBoardList.length - diaryIndex : "?";

  // 기분 아이콘 함수
  const getMoodIcon = (mood) => {
    switch (mood) {
      case "HAPPY":
        return "🥰 행복";
      case "SAD":
        return "😭 슬픔";
      case "ANGRY":
        return "😡 화남";
      case "NEUTRAL":
        return "😐 보통";
      default:
        return "❓";
    }
  };

  return (
    <Box h="100%" p={4} display="flex" flexDirection="column" overflowY="auto">
      {/* 1. 헤더 영역 */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        pb={2}
        borderBottom="1px dashed"
        borderColor="gray.300"
      >
        <HStack>
          <Icon as={FontAwesomeIcon} icon={faBookOpen} color={titleColor} />
          <Text
            fontSize="lg"
            fontWeight="bold"
            fontFamily="'Gulim', sans-serif"
            color="#333"
          >
            {diaryNumber}번째 일기
          </Text>
        </HStack>
        <HStack spacing={2}>
          {isOwner && (
            <>
              <Button
                size="xs"
                colorScheme="blue"
                variant="ghost"
                leftIcon={<FontAwesomeIcon icon={faPen} />}
                onClick={handleDiaryEdit}
              >
                수정
              </Button>
              <Button
                size="xs"
                colorScheme="red"
                variant="ghost"
                leftIcon={<FontAwesomeIcon icon={faTrash} />}
                onClick={onOpen}
              >
                삭제
              </Button>
            </>
          )}
          <Button
            size="xs"
            variant="outline"
            leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            onClick={() => navigate(-1)}
          >
            목록
          </Button>
        </HStack>
      </Flex>

      {/* 2. 본문 내용 영역 */}
      <Box fontFamily="'Gulim', sans-serif">
        {/* 제목 & 기분 & 날짜 */}
        <Box mb={6}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="xl" fontWeight="bold" color="gray.700">
              {diaryBoard.title}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {dayjs(diaryBoard.inserted).format("YYYY.MM.DD HH:mm")}
            </Text>
          </Flex>
          <HStack spacing={4} fontSize="sm" color="gray.600">
            <Text>
              작성자:{" "}
              <Text as="span" fontWeight="bold">
                {diaryBoard.writer}
              </Text>
            </Text>
            <Text>기분: {getMoodIcon(diaryBoard.mood)}</Text>
          </HStack>
        </Box>

        <Divider mb={6} />

        {/* 본문 텍스트 */}
        <Box
          bg={contentBg}
          p={6}
          borderRadius="md"
          minH="200px"
          whiteSpace="pre-wrap" // 줄바꿈 보존
          lineHeight="1.8"
          fontSize="md"
          color="gray.800"
          border="1px solid"
          borderColor={borderColor}
        >
          {diaryBoard.content}
        </Box>

        {/* 첨부 파일 */}
        {diaryBoard.fileList && diaryBoard.fileList.length > 0 && (
          <Box mt={6}>
            <HStack mb={2} color={labelColor}>
              <Icon as={FontAwesomeIcon} icon={faPaperclip} />
              <Text fontSize="sm" fontWeight="bold">
                첨부 파일
              </Text>
            </HStack>
            <Flex wrap="wrap" gap={4}>
              {diaryBoard.fileList.map((file) => (
                <Box
                  key={file.name}
                  border="1px solid"
                  borderColor="gray.200"
                  p={2}
                  borderRadius="md"
                >
                  <Image
                    src={file.src}
                    alt={file.name}
                    maxH="200px"
                    objectFit="contain"
                    borderRadius="sm"
                    mb={1}
                  />
                  <Text fontSize="xs" color="gray.500" isTruncated maxW="200px">
                    {file.name}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Box>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent fontFamily="'Gulim', sans-serif">
          <ModalHeader fontSize="md">게시물 삭제</ModalHeader>
          <ModalBody fontSize="sm">정말 삭제하시겠습니까? 😢</ModalBody>
          <ModalFooter>
            <Button size="sm" onClick={onClose} mr={2}>
              취소
            </Button>
            <Button size="sm" colorScheme="red" onClick={handleClickRemove}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
