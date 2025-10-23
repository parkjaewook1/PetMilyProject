import { useNavigate, useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import { DiaryContext } from "../../diaryComponent/DiaryContext.jsx";
import dayjs from "dayjs";

export function DiaryBoardView() {
  const { id } = useParams();
  const { diaryBoardList } = useContext(DiaryContext);
  const [diaryBoard, setDiaryBoard] = useState(null);
  const { memberInfo } = useContext(LoginContext);
  const nickname = memberInfo?.nickname || null;
  const access = memberInfo?.access || null;
  const isLoggedIn = Boolean(access);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const memberId = memberInfo && memberInfo.id ? parseInt(memberInfo.id) : null;
  const params = memberId ? { memberId } : {};
  const diaryId = generateDiaryId(memberInfo.id);

  useEffect(() => {
    axios
      .get(`/api/diaryBoard/${id}`)
      .then((res) => {
        setDiaryBoard(res.data);
      })
      .catch((err) => {
        if (err.response.status === 404) {
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
          description: `${id} 게시물이 삭제되었습니다.`,
          position: "top",
        });
        navigate(`/diary/${diaryId}/board/list`);
      })
      .catch(() => {
        toast({
          status: "error",
          description: `게시물 삭제 중 오류가 발생하였습니다.`,
          position: "top",
        });
      })
      .finally(onClose);
  };

  const handleDiaryEdit = () => {
    navigate(`/diary/${diaryId}/board/edit/${id}`);
  };

  if (diaryBoard === null) {
    return <Spinner />;
  }

  const isOwner = diaryBoard.writer === nickname;
  const diaryIndex = diaryBoardList.findIndex((item) => item.id === Number(id));
  const diaryNumber = diaryBoardList.length - diaryIndex;

  // 기분 아이콘 함수
  const getMoodIcon = (mood) => {
    switch (mood) {
      case "HAPPY":
        return "😊 행복";
      case "SAD":
        return "😢 슬픔";
      case "ANGRY":
        return "😡 화남";
      case "NEUTRAL":
        return "😐 보통";
      default:
        return "❓";
    }
  };

  return (
    <Box
      maxW="800px"
      mx="auto"
      mt={10}
      p={5}
      boxShadow="md"
      borderRadius="md"
      bg="white"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="2xl" fontWeight="bold">
          {diaryNumber}번째 일기
        </Text>
        {isOwner && (
          <Flex gap={2}>
            <Button onClick={handleDiaryEdit} colorScheme="purple">
              수정
            </Button>
            <Button colorScheme="red" onClick={onOpen}>
              삭제
            </Button>
          </Flex>
        )}
      </Flex>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            제목
          </FormLabel>
          <Input value={diaryBoard.title} readOnly bg="gray.50" />
        </FormControl>
      </Box>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            본문
          </FormLabel>
          <Textarea value={diaryBoard.content} readOnly bg="gray.50" />
        </FormControl>
      </Box>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            오늘의 기분
          </FormLabel>
          <Input value={getMoodIcon(diaryBoard.mood)} readOnly bg="gray.50" />
        </FormControl>
      </Box>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            첨부 파일
          </FormLabel>
          {diaryBoard.fileList && diaryBoard.fileList.length > 0 ? (
            diaryBoard.fileList.map((file) => (
              <Box key={file.name} mb={2}>
                <Image src={file.src} alt={file.name} borderRadius="md" />
                <Text>{file.name}</Text>
              </Box>
            ))
          ) : (
            <Text>첨부된 파일이 없습니다.</Text>
          )}
        </FormControl>
      </Box>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            작성자
          </FormLabel>
          <Input value={diaryBoard.writer} readOnly bg="gray.50" />
        </FormControl>
      </Box>

      <Box mb={6}>
        <FormControl>
          <FormLabel fontSize="lg" fontWeight="bold">
            작성일시
          </FormLabel>
          <Input
            type="datetime-local"
            value={dayjs(diaryBoard.inserted).format("YYYY-MM-DDTHH:mm")}
            readOnly
            bg="gray.50"
          />
        </FormControl>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>게시물 삭제</ModalHeader>
          <ModalBody>삭제하시겠습니까?</ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>취소</Button>
            <Button colorScheme="red" onClick={handleClickRemove}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
