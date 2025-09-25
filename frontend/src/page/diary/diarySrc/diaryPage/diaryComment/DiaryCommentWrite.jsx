import React, { useContext, useState } from "react";
import { Box, Button, Text, Textarea, useToast } from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export function DiaryCommentWrite({ diaryId, onCommentAdded }) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { memberInfo } = useContext(LoginContext);
  const nickname = memberInfo.nickname;

  const handleDiaryCommentSubmitClick = () => {
    if (!comment.trim()) return;

    setLoading(true);
    const payload = {
      diaryId, // 부모에서 받은 PK 그대로 사용
      nickname,
      memberId: memberInfo.id,
      comment,
    };

    axios
      .post("/api/diaryComment/add", payload, {
        headers: { "Content-Type": "application/json" },
      })
      .then(() => {
        toast({
          status: "success",
          position: "top",
          description: "방명록이 등록되었습니다.",
        });
        setComment(""); // 입력창 초기화
        onCommentAdded(); // 부모에서 fetchComments 호출
      })
      .catch(() => {
        toast({
          status: "error",
          position: "top",
          description: "방명록 등록 중 오류가 발생했습니다.",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box>
      <Box>
        <Text fontWeight="bold" fontSize="large">
          {nickname}님!
        </Text>
      </Box>
      <Box mb={2}>
        <Textarea
          placeholder="방명록을 남겨보세요"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Box>
      <Button
        isLoading={loading}
        isDisabled={!comment.trim()}
        colorScheme="blue"
        onClick={handleDiaryCommentSubmitClick}
      >
        <FontAwesomeIcon icon={faPaperPlane} />
      </Button>
    </Box>
  );
}
