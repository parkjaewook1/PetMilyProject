import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
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
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";

// import { generateDiaryId } from "../../../../../util/util.jsx";

export function DiaryCommentEdit() {
  const { diaryId, id } = useParams();
  const [diaryComment, setDiaryComment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { memberInfo } = useContext(LoginContext);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/diaryComment/${id}`)
      .then((res) => setDiaryComment(res.data))
      .catch(() => {
        toast({
          status: "error",
          description: "댓글을 불러오는 중 오류가 발생했습니다.",
          position: "top",
        });
      });
  }, [id, toast, navigate]);

  function handleCommentSubmit() {
    if (!diaryComment) return;

    axios
      .put(`/api/diaryComment/edit`, {
        id: diaryComment.id,
        nickname: memberInfo.nickname,
        comment: diaryComment.comment,
        memberId: memberInfo.id,
      })
      .then(() => {
        toast({
          status: "success",
          description: "댓글이 수정되었습니다.",
          position: "top",
        });
        navigate(`/diary/${diaryId}/comment/view/${id}`);
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          toast({
            status: "error",
            description: "댓글이 수정되지 않았습니다.",
            position: "top",
          });
        }
      })
      .finally(onClose);
  }

  function handleDelete() {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    axios
      .delete(`/api/diaryComment/${diaryComment.id}`)
      .then(() => {
        toast({
          status: "success",
          description: "댓글이 삭제되었습니다.",
          position: "top",
        });
        // 삭제 후 목록 페이지로 이동
        navigate(`/diary/${diaryId}/comment/list`);
      })
      .catch((err) => {
        toast({
          status: "error",
          description: "댓글 삭제 중 오류가 발생했습니다.",
          position: "top",
        });
      });
  }

  if (diaryComment === null) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box
      maxW="600px"
      mx="auto"
      mt={10}
      p={5}
      boxShadow="md"
      borderRadius="md"
      bg="white"
    >
      <Box mb={10}>
        <Text fontSize="xl" fontWeight="bold">
          방명록 수정
        </Text>
      </Box>
      <Box>
        <Box mb={7}>
          <FormControl>
            <FormLabel>작성자</FormLabel>
            <Input value={memberInfo.nickname} readOnly />
          </FormControl>
        </Box>
        <Box mb={7}>
          <FormControl>
            <FormLabel>방명록 작성글</FormLabel>
            <Textarea
              value={diaryComment.comment}
              onChange={(e) =>
                setDiaryComment({ ...diaryComment, comment: e.target.value })
              }
            />
            <HStack mt={4} spacing={3}>
              <Button onClick={onOpen} colorScheme="blue">
                저장
              </Button>
              <Button onClick={handleDelete} colorScheme="red">
                삭제
              </Button>
            </HStack>
          </FormControl>
        </Box>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>확인</ModalHeader>
            <ModalBody>저장하시겠습니까?</ModalBody>
            <ModalFooter>
              <Button onClick={handleCommentSubmit} colorScheme="blue">
                확인
              </Button>
              <Button onClick={onClose}>취소</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
}
