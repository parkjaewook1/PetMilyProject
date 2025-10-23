import React, { useContext, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
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
      .then((res) => {
        console.log("서버 응답:", res.data); // ✅ 여기서 확인
        const newComment = res.data; // 서버가 내려준 새 댓글 객체

        toast({
          status: "success",
          position: "top",
          description: "방명록이 등록되었습니다.",
        });

        setComment(""); // 입력창 초기화
        onCommentAdded(newComment); // ✅ 부모에 새 댓글 전달
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
      <Box mb={2}>
        <Text fontWeight="bold" fontSize="large">
          {nickname}님!
        </Text>
      </Box>

      {/* ✅ 전체 입력 영역을 하나의 칸처럼 */}
      <Flex
        align="center"
        border="1px solid"
        borderColor="gray.300"
        rounded="md"
        p={2}
        bg="white"
        gap={3}
      >
        {/* ✅ 로그인한 사용자 프로필 */}
        {localStorage.getItem(`profileImage_${memberInfo.id}`) ? (
          <Image
            src={localStorage.getItem(`profileImage_${memberInfo.id}`)}
            alt={memberInfo.nickname}
            boxSize="40px"
            borderRadius="full"
          />
        ) : (
          <Avatar name={memberInfo.nickname} size="md" />
        )}

        {/* ✅ 구분선 */}
        <Box h="40px" borderLeft="1px solid" borderColor="gray.300" />

        {/* ✅ 입력창 + 버튼 */}
        <Flex flex="1" align="center" gap={2}>
          <Textarea
            placeholder="방명록을 남겨보세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            resize="none"
            flex="1"
            border="none"
            _focus={{ boxShadow: "none" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // 줄바꿈 방지
                handleDiaryCommentSubmitClick();
              }
            }}
          />
          <Button
            type="button" // ✅ 기본 submit 동작 방지
            isLoading={loading}
            isDisabled={!comment.trim()}
            colorScheme="blue"
            onClick={handleDiaryCommentSubmitClick}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
