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
import { useContext, useEffect, useState } from "react"; // useEffect 추가
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

  // ✅ [디버깅용] 이미지 URL 변환 함수 + 로그 출력
  const getProfileUrl = (imageName) => {
    if (!imageName) return null;
    const finalUrl = imageName.startsWith("http")
      ? imageName
      : `/api/uploads/${imageName}`;

    return finalUrl;
  };

  // 🔴 [진단] 렌더링 될 때마다 이미지 경로 로그 찍기
  useEffect(() => {
    if (comment.profileImage) {
      console.log(`[댓글 ID: ${comment.id}] 작성자: ${comment.nickname}`);
      console.log(`- 원본 DB값:`, comment.profileImage);
      console.log(`- 변환된 URL:`, getProfileUrl(comment.profileImage));
    }
  }, [comment]);

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

  // 1. 내 자식 찾기
  const childComments = allComments.filter(
    (c) => String(c.replyCommentId) === String(comment.id),
  );

  // 2. 보여줄 목록 계산
  const visibleChildren = showAllReplies
    ? childComments
    : childComments.slice(0, REPLY_LIMIT);

  const hiddenCount = childComments.length - REPLY_LIMIT;

  // -------------------------------------------------------
  // 🎨 자식 렌더링 섹션
  // -------------------------------------------------------
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

  // =======================================================
  // Case 1. 대댓글 (자식) UI
  // =======================================================
  if (comment.replyCommentId) {
    const profileUrl = getProfileUrl(comment.profileImage);

    return (
      <Box mt={3}>
        <Flex align="flex-start">
          {/* ✅ [수정] 이미지 처리 */}
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={comment.nickname}
              boxSize="24px"
              borderRadius="full"
              mr={2}
              objectFit="cover"
              // 🔴 이미지 로드 실패 시 로그 출력
              onError={(e) => {
                console.error(
                  `[이미지 로드 실패] ID: ${comment.id}, URL: ${profileUrl}`,
                );
                e.target.style.display = "none"; // 엑박 숨김
              }}
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

  // =======================================================
  // Case 2. 부모 댓글 (카드) UI
  // =======================================================
  const profileUrl = getProfileUrl(comment.profileImage);

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
          {/* ✅ [수정] 이미지 처리 */}
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={comment.nickname}
              boxSize="32px"
              borderRadius="full"
              objectFit="cover"
              // 🔴 이미지 로드 실패 시 로그 출력
              onError={(e) => {
                console.error(
                  `[이미지 로드 실패] ID: ${comment.id}, URL: ${profileUrl}`,
                );
                e.target.style.display = "none";
              }}
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
              다이어리
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
