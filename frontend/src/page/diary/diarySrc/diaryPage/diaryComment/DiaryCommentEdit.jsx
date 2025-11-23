import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
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
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPen,
  faQuoteLeft,
  faQuoteRight,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryCommentEdit() {
  const { encodedId, id } = useParams();
  const [diaryComment, setDiaryComment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { memberInfo } = useContext(LoginContext);
  const navigate = useNavigate();

  // 🎨 스타일 변수
  const titleColor = "blue.600";
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");

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
          description: "방명록이 수정되었습니다.",
          position: "top",
        });
        navigate(`/diary/${encodedId}/comment/view/${id}`);
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          toast({
            status: "error",
            description: "수정되지 않았습니다.",
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
          description: "삭제되었습니다.",
          position: "top",
        });
        navigate(`/diary/${encodedId}/comment`);
      })
      .catch((err) => {
        toast({
          status: "error",
          description: "삭제 중 오류가 발생했습니다.",
          position: "top",
        });
      });
  }

  if (diaryComment === null) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="blue.400" />
      </Center>
    );
  }

  return (
    <Box h="100%" p={4} display="flex" flexDirection="column">
      {/* 1. 헤더 영역 */}
      <Flex
        align="center"
        mb={6}
        pb={2}
        borderBottom="2px solid"
        borderColor={titleColor}
      >
        <Icon as={FontAwesomeIcon} icon={faPen} color={titleColor} mr={2} />
        <Text
          fontSize="lg"
          fontWeight="bold"
          fontFamily="'Gulim', sans-serif"
          color="#333"
        >
          방명록 수정
        </Text>
      </Flex>

      {/* 2. 입력 폼 영역 */}
      <VStack
        spacing={5}
        align="stretch"
        flex={1}
        fontFamily="'Gulim', sans-serif"
      >
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
            작성자
          </FormLabel>
          <Input
            value={memberInfo.nickname}
            readOnly
            bg="gray.100"
            border="none"
            size="sm"
            fontWeight="bold"
            color="gray.700"
          />
        </FormControl>

        <FormControl flex={1} display="flex" flexDirection="column">
          <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
            내용
          </FormLabel>
          <Box position="relative" flex={1}>
            {/* 장식용 따옴표 */}
            <Icon
              as={FontAwesomeIcon}
              icon={faQuoteLeft}
              color="gray.300"
              position="absolute"
              top={3}
              left={3}
              zIndex={1}
            />

            <Textarea
              value={diaryComment.comment}
              onChange={(e) =>
                setDiaryComment({ ...diaryComment, comment: e.target.value })
              }
              h="100%"
              resize="none"
              bg={inputBg}
              pl={8} // 아이콘 공간 확보
              pt={8}
              lineHeight="1.8"
              borderColor={borderColor}
              focusBorderColor={titleColor}
            />

            <Icon
              as={FontAwesomeIcon}
              icon={faQuoteRight}
              color="gray.300"
              position="absolute"
              bottom={3}
              right={3}
              zIndex={1}
            />
          </Box>
        </FormControl>
      </VStack>

      {/* 3. 하단 버튼 영역 */}
      <Flex justify="space-between" mt={6}>
        {/* 삭제 버튼 (왼쪽 배치) */}
        <Button
          leftIcon={<FontAwesomeIcon icon={faTrashCan} />}
          colorScheme="red"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
        >
          삭제
        </Button>

        <HStack spacing={2}>
          <Button
            leftIcon={<FontAwesomeIcon icon={faXmark} />}
            onClick={() => navigate(-1)}
            variant="ghost"
            colorScheme="gray"
            size="sm"
          >
            취소
          </Button>
          <Button
            leftIcon={<FontAwesomeIcon icon={faCheck} />}
            onClick={onOpen}
            colorScheme="blue"
            size="sm"
            boxShadow="md"
          >
            저장
          </Button>
        </HStack>
      </Flex>

      {/* 저장 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent fontFamily="'Gulim', sans-serif">
          <ModalHeader fontSize="md">수정 확인</ModalHeader>
          <ModalBody fontSize="sm">정말 수정하시겠습니까?</ModalBody>
          <ModalFooter>
            <Button size="sm" onClick={onClose} mr={2}>
              취소
            </Button>
            <Button size="sm" onClick={handleCommentSubmit} colorScheme="blue">
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
