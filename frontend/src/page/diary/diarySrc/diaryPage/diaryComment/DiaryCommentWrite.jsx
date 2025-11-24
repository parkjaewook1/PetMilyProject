import React, { useContext, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  Image,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faPenNib } from "@fortawesome/free-solid-svg-icons";

export function DiaryCommentWrite({ diaryId, onCommentAdded }) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { memberInfo } = useContext(LoginContext);
  const nickname = memberInfo?.nickname || "";

  // 🎨 스타일 변수
  const containerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");
  const titleColor = "blue.600";

  // ✅ [수정] localStorage 대신 memberInfo 사용 + URL 처리
  const getProfileSrc = () => {
    const img = memberInfo?.profileImage;
    if (!img) return null;
    // http로 시작하면 그대로, 아니면 서버 경로 붙이기
    return img.startsWith("http") ? img : `/api/uploads/${img}`;
  };

  const profileSrc = getProfileSrc();

  const handleDiaryCommentSubmitClick = () => {
    if (!comment.trim()) return;

    setLoading(true);
    const payload = {
      diaryId,
      nickname,
      memberId: memberInfo.id,
      comment,
    };

    axios
      .post("/api/diaryComment/add", payload, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        const newComment = res.data;
        toast({
          status: "success",
          position: "top",
          description: "방명록이 등록되었습니다.",
          duration: 1000,
        });
        setComment("");
        onCommentAdded(newComment);
      })
      .catch(() => {
        toast({
          status: "error",
          position: "top",
          description: "등록 중 오류가 발생했습니다.",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box
      p={3}
      bg={containerBg}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      fontFamily="'Gulim', sans-serif"
    >
      {/* 1. 상단 문구 */}
      <HStack mb={2} spacing={2}>
        <Icon
          as={FontAwesomeIcon}
          icon={faPenNib}
          color={titleColor}
          size="xs"
        />
        <Text fontSize="sm" fontWeight="bold" color="gray.600">
          <Text as="span" color={titleColor}>
            {nickname}
          </Text>
          님, 한마디 남겨주세요!
        </Text>
      </HStack>

      {/* 2. 입력 영역 */}
      <Flex
        align="center"
        bg={inputBg}
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        p={2}
        gap={3}
        boxShadow="sm"
        transition="all 0.2s"
        _focusWithin={{
          borderColor: "blue.400",
          boxShadow: "0 0 0 1px #4299e1",
        }}
      >
        {/* 프로필 사진 */}
        {profileSrc ? (
          <Image
            src={profileSrc}
            alt={nickname}
            boxSize="32px"
            borderRadius="full"
            border="1px solid"
            borderColor="gray.200"
            objectFit="cover" // ✅ 이미지 찌그러짐 방지
          />
        ) : (
          <Avatar name={nickname} size="xs" />
        )}

        <Divider orientation="vertical" h="20px" borderColor="gray.300" />

        {/* 입력창 + 버튼 */}
        <Flex flex="1" align="center" gap={2}>
          <Textarea
            placeholder="방명록을 입력하세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            resize="none"
            rows={1}
            minH="32px"
            flex="1"
            border="none"
            bg="transparent"
            fontSize="sm"
            p={1}
            _focus={{ boxShadow: "none" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleDiaryCommentSubmitClick();
              }
            }}
          />

          <Button
            type="button"
            size="xs"
            colorScheme="blue"
            variant="solid"
            isLoading={loading}
            isDisabled={!comment.trim()}
            onClick={handleDiaryCommentSubmitClick}
            borderRadius="sm"
            px={3}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
