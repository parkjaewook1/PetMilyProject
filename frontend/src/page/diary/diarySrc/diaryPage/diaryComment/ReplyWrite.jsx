import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { useContext, useState } from "react";
import { Box, Button, Flex, Input, useToast } from "@chakra-ui/react"; // Textarea -> Input (한 줄 입력)

export function ReplyWrite({ diaryId, replyCommentId, onReplyAdded }) {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const { memberInfo } = useContext(LoginContext);
  const toast = useToast();

  const handleReplySubmit = () => {
    if (!reply.trim() || loading) return;
    setLoading(true);

    const payload = {
      diaryId,
      memberId: memberInfo.id,
      nickname: memberInfo.nickname,
      comment: reply,
      replyCommentId,
    };

    axios
      .post("/api/diaryComment/add", payload)
      .then((res) => {
        const newReply = res.data;
        setReply("");
        onReplyAdded?.(newReply);
      })
      .catch((err) => {
        console.error("대댓글 등록 오류:", err);
        toast({
          status: "error",
          position: "top",
          description: "오류가 발생했습니다.",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box
      bg="gray.50"
      p={2}
      borderRadius="md"
      mt={2}
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex gap={2} align="center">
        <Input
          size="sm"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="댓글을 입력하세요."
          bg="white"
          fontSize="xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleReplySubmit();
            }
          }}
        />
        <Button
          size="sm"
          colorScheme="blue" //
          isLoading={loading}
          isDisabled={!reply.trim()}
          onClick={handleReplySubmit}
          fontSize="xs"
          px={4}
        >
          확인
        </Button>
      </Flex>
    </Box>
  );
}
