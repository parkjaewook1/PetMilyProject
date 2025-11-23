import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { useContext, useState } from "react";
import { Button, Flex, Textarea, useToast } from "@chakra-ui/react";

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
      .post("/api/diaryComment/add", payload, {
        headers: { "Content-Type": "application/json" },
      })
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
          description: "대댓글 등록 중 오류가 발생했습니다.",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Flex mt={2} gap={2} align="center">
      <Textarea
        size="sm"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="댓글을 입력하세요"
        resize="none"
        rows={1}
        flex="1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleReplySubmit();
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        colorScheme="blue"
        isLoading={loading}
        isDisabled={!reply.trim()}
        onClick={handleReplySubmit}
      >
        등록
      </Button>
    </Flex>
  );
}
