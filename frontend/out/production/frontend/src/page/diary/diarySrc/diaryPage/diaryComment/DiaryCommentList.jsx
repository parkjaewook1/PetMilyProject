import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { DiaryCommentItem } from "./DiaryCommentItem.jsx";

export function DiaryCommentList({
  allComments,
  parentComments,
  onCommentAdded,
}) {
  // ✅ 댓글이 없을 때
  if (!Array.isArray(parentComments) || parentComments.length === 0) {
    return (
      <Box p={5} textAlign="center">
        <Text color="gray.500">아직 방명록이 없습니다.</Text>
      </Box>
    );
  }

  // ✅ 부모 댓글만 필터링 (replyCommentId가 null/undefined인 경우)
  const rootComments = parentComments.filter((c) => c.replyCommentId == null);

  return (
    <Box p={5}>
      {/* 제목 영역 */}
      <Flex justify="center" mb={6}>
        <Text fontWeight="bold" fontSize="xl" color="teal.500">
          📝 방명록
        </Text>
      </Flex>
      {/* ✅ 댓글 목록 */}
      <VStack
        spacing={4}
        align="stretch"
        overflowY="auto" // 스크롤 가능
        maxH="400px" // 높이 제한 (원하는 값으로 조정)
      >
        {rootComments.map((comment) => (
          <DiaryCommentItem
            key={comment.id}
            comment={comment}
            allComments={allComments} // 전체 댓글 전달
            onCommentAdded={onCommentAdded}
          />
        ))}
      </VStack>
    </Box>
  );
}
