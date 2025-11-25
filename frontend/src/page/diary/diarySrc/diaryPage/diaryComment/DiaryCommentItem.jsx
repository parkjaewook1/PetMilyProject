import {
  Avatar,
  Box,
  Button,
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
  faChevronDown,
  faChevronUp,
  faEllipsisV,
  faHouseUser,
  faMagnifyingGlass,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import axios from "@api/axiosConfig";
import { ReplyWrite } from "./ReplyWrite";
import { format, isValid, parseISO } from "date-fns";
import PropTypes from "prop-types";

export function DiaryCommentItem({
  comment,
  allComments,
  onCommentAdded,
  depth = 0,
}) {
  const { memberInfo } = useContext(LoginContext);
  const navigate = useNavigate();
  const { encodedId } = useParams();
  const toast = useToast();
  const numericDiaryId = comment.diaryId;

  const [showReply, setShowReply] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  // ✅ 이미지 로드 에러 상태
  const [imageError, setImageError] = useState(false);

  const REPLY_LIMIT = depth === 0 ? 3 : 0;

  const cardBg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");
  const cmColor = useColorModeValue("gray.800", "gray.200");
  const lineColor = useColorModeValue("gray.300", "gray.600");

  const isCommentOwner = Number(memberInfo?.id) === Number(comment.memberId);
  const isDiaryOwner = Number(memberInfo?.id) === numericDiaryId;

  const insertedDate = comment.inserted ? parseISO(comment.inserted) : null;
  const formattedDate =
    insertedDate && isValid(insertedDate)
      ? format(insertedDate, "yyyy.MM.dd")
      : "Unknown date";

  // ✅ [핵심 수정] 중복 경로 방지 로직
  const getProfileUrl = (imageName) => {
    if (!imageName) return null;
    // 1. 외부 링크(http)면 그대로
    if (imageName.startsWith("http")) return imageName;
    // 2. 이미 /uploads/로 시작하면 그대로 (백엔드에서 붙여준 경우)
    if (imageName.startsWith("/uploads/")) return imageName;
    // 3. 파일명만 있으면 붙여줌
    return `/uploads/${imageName}`;
  };

  const profileUrl = getProfileUrl(comment.profileImage);

  function goToMiniHome(authorId) {
    const targetDiaryId = generateDiaryId(authorId);
    navigate(`/diary/${targetDiaryId}`);
  }

  function handleView(commentId) {
    navigate(`/diary/${encodedId}/comment/view/${commentId}`);
  }

  function handleDelete(commentId) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    axios
      .delete(`/api/diaryComment/${commentId}`)
      .then(() => {
        toast({ status: "success", description: "삭제되었습니다." });
        onCommentAdded?.();
      })
      .catch(() =>
        toast({ status: "error", description: "오류가 발생했습니다." }),
      );
  }

  const childComments = allComments.filter(
    (c) => String(c.replyCommentId) === String(comment.id),
  );

  const visibleChildren = showAllReplies
    ? childComments
    : childComments.slice(0, REPLY_LIMIT);

  const hiddenCount = childComments.length - REPLY_LIMIT;

  const renderChildrenSection = () => {
    if (childComments.length === 0) return null;

    return (
      <Box mt={2} pl={3} ml={2} borderLeft="2px solid" borderColor={lineColor}>
        {visibleChildren.map((child) => (
          <DiaryCommentItem
            key={child.id}
            comment={child}
            allComments={allComments}
            onCommentAdded={onCommentAdded}
            depth={depth + 1}
          />
        ))}

        {childComments.length > REPLY_LIMIT && (
          <Button
            size="xs"
            variant="ghost"
            color="gray.500"
            h="28px"
            mt={1}
            ml={2}
            onClick={() => setShowAllReplies(!showAllReplies)}
            leftIcon={
              <FontAwesomeIcon
                icon={showAllReplies ? faChevronUp : faChevronDown}
              />
            }
            justifyContent="flex-start"
          >
            {showAllReplies ? "접기" : `답글 ${hiddenCount}개 더보기`}
          </Button>
        )}
      </Box>
    );
  };

  // Case 1. 대댓글 (자식) UI
  if (comment.replyCommentId) {
    return (
      <Box mt={3}>
        <Flex align="flex-start">
          {profileUrl && !imageError ? (
            <Image
              src={profileUrl}
              alt={comment.nickname}
              boxSize="24px"
              borderRadius="full"
              mr={2}
              objectFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Avatar name={comment.nickname} size="xs" mr={2} />
          )}

          <Box w="100%">
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
                cursor="pointer"
                onClick={() => setShowReply(!showReply)}
                _hover={{ textDecoration: "underline" }}
              >
                {showReply ? "취소" : "답글"}
              </Text>
            </Flex>
            {showReply && (
              <ReplyWrite
                diaryId={comment.diaryId}
                replyCommentId={comment.id}
                onReplyAdded={(newReply) => {
                  onCommentAdded?.(newReply);
                  setShowReply(false);
                  setShowAllReplies(true);
                }}
              />
            )}
          </Box>
        </Flex>
        {renderChildrenSection()}
      </Box>
    );
  }

  // Case 2. 부모 댓글 (카드) UI
  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      rounded="lg"
      p={4}
      mt={3}
      shadow="sm"
      _hover={{
        shadow: "md",
        transform: "translateY(-2px)",
        transition: "0.2s",
      }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Flex gap={2} align="center">
          {profileUrl && !imageError ? (
            <Image
              src={profileUrl}
              alt={comment.nickname}
              boxSize="32px"
              borderRadius="full"
              objectFit="cover"
              onError={() => setImageError(true)}
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
              미니홈피
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
        cursor="pointer"
        onClick={() => setShowReply(!showReply)}
        _hover={{ textDecoration: "underline" }}
      >
        {showReply ? "취소" : "댓글 달기"}
      </Text>

      {showReply && (
        <ReplyWrite
          diaryId={comment.diaryId}
          replyCommentId={comment.id}
          onReplyAdded={(newReply) => {
            onCommentAdded?.(newReply);
            setShowReply(false);
            setShowAllReplies(true);
          }}
        />
      )}

      {renderChildrenSection()}
    </Box>
  );
}

DiaryCommentItem.propTypes = {
  comment: PropTypes.object.isRequired,
  allComments: PropTypes.array.isRequired,
  onCommentAdded: PropTypes.func,
  depth: PropTypes.number,
};
