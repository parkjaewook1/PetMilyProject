import {
  Badge,
  Box,
  Flex,
  Icon,
  Spacer,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { DiaryCommentItem } from "./DiaryCommentItem.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuoteLeft, faQuoteRight } from "@fortawesome/free-solid-svg-icons";

export function DiaryCommentList({
  allComments,
  parentComments,
  onCommentAdded,
}) {
  const titleBarBg = useColorModeValue("#f1f3f5", "gray.700");
  const titleColor = "blue.600";
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const scrollThumbColor = useColorModeValue("gray.400", "gray.600");

  const scrollbarStyle = {
    "&::-webkit-scrollbar": { width: "6px" },
    "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: scrollThumbColor,
      borderRadius: "3px",
    },
  };

  const rootComments = Array.isArray(parentComments)
    ? parentComments.filter((c) => c.replyCommentId == null)
    : [];

  return (
    <Box h="100%" display="flex" flexDirection="column" p={0}>
      {" "}
      {/* 패딩 제거 */}
      {/* ✂️ 헤더 높이 축소 (p={1}, mb={2}) */}
      <Flex
        bg={titleBarBg}
        p={1}
        px={3}
        borderRadius="md"
        align="center"
        border="1px solid"
        borderColor={borderColor}
        mb={2}
        flexShrink={0}
        h="32px" // 높이 강제 고정
      >
        <Text
          fontFamily="'Gulim', sans-serif"
          fontWeight="bold"
          color={titleColor}
          fontSize="xs"
        >
          방명록 {rootComments.length}개
        </Text>
        <Spacer />
        <Badge
          colorScheme="blue"
          variant="solid"
          borderRadius="full"
          fontSize="0.6em"
          px={1}
        >
          Total {allComments?.length || 0}
        </Badge>
      </Flex>
      {/* 리스트 영역 */}
      {rootComments.length === 0 ? (
        <Flex
          direction="column"
          justify="center"
          align="center"
          flex={1}
          color="gray.400"
          border="1px dashed"
          borderColor="gray.300"
          borderRadius="md"
          bg="gray.50"
        >
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteLeft}
            boxSize={3}
            mb={1}
            opacity={0.5}
          />
          <Text fontFamily="'Gulim', sans-serif" fontSize="xs">
            방명록이 비어있습니다.
          </Text>
          <Icon
            as={FontAwesomeIcon}
            icon={faQuoteRight}
            boxSize={3}
            mt={1}
            opacity={0.5}
          />
        </Flex>
      ) : (
        <Box flex={1} overflowY="auto" sx={scrollbarStyle} pr={1}>
          {/* ✂️ spacing을 줄여서 더 많이 보이게 함 */}
          <VStack spacing={2} align="stretch" pb={2}>
            {rootComments.map((comment, index) => (
              <DiaryCommentItem
                key={comment.id}
                comment={comment}
                commentNo={index + 1}
                allComments={allComments}
                onCommentAdded={onCommentAdded}
              />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
