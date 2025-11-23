import {
  Avatar,
  Box,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faHouseUser,
  faMagnifyingGlass,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import axios from "@api/axiosConfig";
import { ReplyWrite } from "./ReplyWrite";
import { format, isValid, parseISO } from "date-fns";
import PropTypes from "prop-types";

export function DiaryCommentItem({ comment, allComments, onCommentAdded }) {
  const { memberInfo } = useContext(LoginContext);
  const navigate = useNavigate();
  const toast = useToast();
  const numericDiaryId = comment.diaryId;
  const [showReply, setShowReply] = useState(false);

  const cardBg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");
  const cmColor = useColorModeValue("gray.800", "gray.200");

  const isCommentOwner = Number(memberInfo?.id) === Number(comment.memberId);
  const isDiaryOwner = Number(memberInfo?.id) === numericDiaryId;

  // 날짜 포맷
  const insertedDate = comment.inserted ? parseISO(comment.inserted) : null;
  const formattedDate =
    insertedDate && isValid(insertedDate)
      ? format(insertedDate, "yyyy.MM.dd")
      : "Unknown date";

  // 이동/삭제 함수
  function goToMiniHome(authorId) {
    const targetDiaryId = generateDiaryId(authorId);
    navigate(`/diary/${targetDiaryId}`);
  }

  function handleView(commentId) {
    navigate(`/diary/${comment.diaryId}/comment/view/${commentId}`);
  }

  function handleDelete(commentId) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    axios
      .delete(`/api/diaryComment/${commentId}`)
      .then(() => {
        toast({ status: "success", description: "댓글이 삭제되었습니다." });
        onCommentAdded?.();
      })
      .catch(() =>
        toast({
          status: "error",
          description: "댓글 삭제 중 오류가 발생했습니다.",
          position: "top",
        }),
      );
  }

  // 자식 댓글은 allComments에서 필터링
  const childComments = allComments.filter(
    (c) => c.replyCommentId === comment.id,
  );

  // 디버깅 로그
  console.log("렌더링된 댓글:", comment.id, "자식 댓글:", childComments);

  return comment.replyCommentId ? (
    // ✅ 대댓글 (줄 단위 UI)
    <Flex align="flex-start" mt={2} ml={6}>
      {comment.profileImage ? (
        <Image
          src={comment.profileImage}
          alt={comment.nickname}
          boxSize="24px"
          borderRadius="full"
          mr={2}
        />
      ) : (
        <Avatar name={comment.nickname} size="xs" mr={2} />
      )}

      <Box>
        <Text fontSize="sm">
          <Text as="span" fontWeight="bold" mr={2}>
            {comment.nickname}
          </Text>
          {comment.comment}
        </Text>

        <Flex gap={3} mt={1} align="center">
          <Text fontSize="xs" color="gray.500">
            {formattedDate}
          </Text>
          <Text
            as="button"
            fontSize="xs"
            color="blue.400"
            onClick={() => setShowReply(!showReply)}
          >
            {showReply ? "취소" : "답글 달기"}
          </Text>
        </Flex>

        {showReply && (
          <ReplyWrite
            diaryId={comment.diaryId}
            replyCommentId={comment.id}
            onReplyAdded={(newReply) => {
              console.log("대댓글 작성 완료 → onCommentAdded 호출", newReply);
              onCommentAdded?.(newReply); // ✅ 새 대댓글 객체를 부모로 전달
              setShowReply(false); // 작성 후 입력창 닫기
            }}
          />
        )}

        {childComments.map((child) => (
          <DiaryCommentItem
            key={child.id}
            comment={child}
            allComments={allComments}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </Box>
    </Flex>
  ) : (
    // ✅ 부모 댓글 (카드 UI)
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      rounded="lg"
      shadow="sm"
      p={4}
      mt={3}
      _hover={{
        shadow: "md",
        transform: "translateY(-2px)",
        transition: "0.2s",
      }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Flex gap={2} align="center">
          {comment.profileImage ? (
            <Image
              src={comment.profileImage}
              alt={comment.nickname}
              boxSize="32px"
              borderRadius="full"
            />
          ) : (
            <Avatar name={comment.nickname} size="sm" />
          )}
          <Text fontWeight="bold">{comment.nickname}</Text>
          <Text fontSize="sm" color="gray.500">
            {formattedDate}
          </Text>
        </Flex>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FontAwesomeIcon icon={faEllipsisV} />}
            size="sm"
            variant="ghost"
          />
          <MenuList>
            <MenuItem
              icon={<FontAwesomeIcon icon={faHouseUser} />}
              onClick={() => goToMiniHome(comment.memberId)}
            >
              미니홈피 이동
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
              onClick={() => handleView(comment.id)}
            >
              상세보기
            </MenuItem>
            {(isCommentOwner || isDiaryOwner) && (
              <MenuItem
                icon={<FontAwesomeIcon icon={faTrash} />}
                color="red.400"
                onClick={() => handleDelete(comment.id)}
              >
                삭제
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </Flex>

      <Text fontSize="sm" color={cmColor}>
        {comment.comment}
      </Text>

      <Text
        as="button"
        fontSize="xs"
        color="blue.400"
        mt={2}
        onClick={() => setShowReply(!showReply)}
      >
        {showReply ? "취소" : "댓글 달기"}
      </Text>

      {showReply && (
        <ReplyWrite
          diaryId={comment.diaryId}
          replyCommentId={comment.id}
          onReplyAdded={(newReply) => {
            console.log("대댓글 작성 완료 → onCommentAdded 호출", newReply);
            onCommentAdded?.(newReply); // ✅ 새 대댓글 객체 전달
            setShowReply(false);
          }}
        />
      )}

      {childComments.map((child) => (
        <DiaryCommentItem
          key={child.id}
          comment={child}
          allComments={allComments}
          onCommentAdded={onCommentAdded}
        />
      ))}
    </Box>
  );
}

// ✅ PropTypes 정의
DiaryCommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    diaryId: PropTypes.number.isRequired,
    memberId: PropTypes.number.isRequired,
    nickname: PropTypes.string.isRequired,
    comment: PropTypes.string.isRequired,
    inserted: PropTypes.string,
    profileImage: PropTypes.string,
    replyCommentId: PropTypes.number,
    replyCount: PropTypes.number, // ✅ 추가
  }).isRequired,
  allComments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      diaryId: PropTypes.number.isRequired,
      memberId: PropTypes.number.isRequired,
      nickname: PropTypes.string.isRequired,
      comment: PropTypes.string.isRequired,
      inserted: PropTypes.string,
      profileImage: PropTypes.string,
      replyCommentId: PropTypes.number,
      replyCount: PropTypes.number, // ✅ 여기도 추가
    }),
  ).isRequired,
  onCommentAdded: PropTypes.func,
};
