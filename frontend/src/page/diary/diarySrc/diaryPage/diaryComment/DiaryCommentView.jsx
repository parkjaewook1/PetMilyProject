import { fullSurfaceStyle } from "../../../../../design/fullAuditStyles.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPen,
  faQuoteLeft,
  faQuoteRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

export function DiaryCommentView() {
  const { encodedId, id } = useParams();
  const [diaryComment, setDiaryComment] = useState(null);
  const { memberInfo } = useContext(LoginContext);
  const toast = useToast();
  const navigate = useNavigate();
  const memberId = memberInfo && memberInfo.id ? parseInt(memberInfo.id) : null;
  const params = memberId ? { memberId } : {};
  const { onOpen, onClose, isOpen } = useDisclosure();
  const cancelRef = useRef();

  // 🎨 스타일 변수
  const contentBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const titleColor = "blue.600";

  useEffect(() => {
    axios
      .get(`/api/diaryComment/${id}`)
      .then((res) => setDiaryComment(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            status: "info",
            description: "해당 댓글이 존재하지 않습니다.",
            position: "top",
          });
          navigate(`/diary/${encodedId}/comment`);
        }
      });
  }, [id, navigate, toast, encodedId]);

  function handleClickRemove() {
    axios
      .delete(`/api/diaryComment/${id}`, { params })
      .then(() => {
        toast({
          status: "success",
          description: "삭제되었습니다.",
          position: "top",
        });
        navigate(`/diary/${encodedId}/comment`);
      })
      .catch(() => {
        toast({
          status: "error",
          description: "오류가 발생했습니다.",
          position: "top",
        });
      })
      .finally(() => {
        onClose();
      });
  }

  function handleCommentEdit() {
    if (id !== null) {
      navigate(`/diary/${encodedId}/comment/edit/${id}`);
    }
  }

  if (diaryComment === null) {
    return (
      <Center
        h="300px"
        sx={fullSurfaceStyle}
        className="full-journal full-diary full-diarycommentview"
      >
        <Spinner size="xl" color="blue.400" />
      </Center>
    );
  }

  const isWriter = Number(diaryComment?.memberId) === Number(memberInfo?.id);
  const isDiaryOwner = Number(diaryComment?.ownerId) === Number(memberInfo?.id);

  return (
    <Box
      h="100%"
      p={4}
      display="flex"
      flexDirection="column"
      sx={fullSurfaceStyle}
      className="full-journal full-diary full-diarycommentview"
    >
      {/* 1. 헤더 영역 */}
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        pb={2}
        borderBottom="2px solid"
        borderColor={titleColor}
      >
        <HStack spacing={2}>
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteLeft}
            color={titleColor}
            size="sm"
            mb={2}
          />
          <Text
            fontSize="lg"
            fontWeight="bold"
            fontFamily="'Gulim', sans-serif"
            color="#333"
          >
            방명록 상세
          </Text>
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteRight}
            color={titleColor}
            size="sm"
            mb={2}
          />
        </HStack>
        <Button
          size="xs"
          variant="journalOutline"
          leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          onClick={() => navigate(-1)}
        >
          목록
        </Button>
      </Flex>

      {/* 2. 본문 내용 */}
      <Box fontFamily="'Gulim', sans-serif">
        {/* 작성자 & 날짜 info */}
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <Text fontWeight="bold" color="gray.700">
              {diaryComment.nickname}
            </Text>
            <Text fontSize="sm" color="gray.500">
              님의 방명록
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            {dayjs(diaryComment.inserted).format("YYYY.MM.DD HH:mm")}
          </Text>
        </Flex>

        {/* 내용 박스 */}
        <Box
          bg={contentBg}
          p={6}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          minH="150px"
          fontSize="md"
          lineHeight="1.8"
          color="gray.800"
          whiteSpace="pre-wrap"
          position="relative"
        >
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteLeft}
            color="gray.300"
            position="absolute"
            top={2}
            left={2}
            opacity={0.5}
          />
          {diaryComment.comment}
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteRight}
            color="gray.300"
            position="absolute"
            bottom={2}
            right={2}
            opacity={0.5}
          />
        </Box>

        {/* 3. 버튼 영역 (스타일 수정됨) */}
        <HStack justify="flex-end" mt={4} spacing={2}>
          {isWriter && (
            <Button
              size="xs" // ✅ 작게
              variant="journalOutline" // ✅ 깔끔하게
              colorScheme="blue"
              leftIcon={<FontAwesomeIcon icon={faPen} />}
              onClick={handleCommentEdit}
            >
              수정
            </Button>
          )}

          {(isWriter || isDiaryOwner) && (
            <Button
              size="xs" // ✅ 작게
              variant="outline" // ✅ 깔끔하게
              colorScheme="red"
              leftIcon={<FontAwesomeIcon icon={faTrash} />}
              onClick={onOpen}
              className="full-danger"
            >
              삭제
            </Button>
          )}
        </HStack>
      </Box>

      {/* 삭제 확인 모달 */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
        size="sm"
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            fontFamily="'Gulim', sans-serif"
            sx={fullSurfaceStyle}
            className="full-journal full-overlay"
          >
            <AlertDialogHeader fontSize="md" fontWeight="bold">
              댓글 삭제
            </AlertDialogHeader>

            <AlertDialogBody fontSize="sm">
              정말로 이 댓글을 삭제하시겠습니까?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onClose}
                size="sm"
                variant="journal"
              >
                취소
              </Button>
              <Button
                colorScheme="red"
                onClick={handleClickRemove}
                ml={3}
                size="sm"
                className="full-danger"
              >
                삭제
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
