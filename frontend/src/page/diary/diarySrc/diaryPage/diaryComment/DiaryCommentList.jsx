import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import { format, isValid, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouseUser,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import axios from "@api/axiosConfig";

export function DiaryCommentList({ diaryCommentList }) {
  const { memberInfo } = useContext(LoginContext);
  const navigate = useNavigate();
  const toast = useToast();
  const { diaryId, id } = useParams(); // "DIARY-187-ID"
  const numericDiaryId = Number(diaryId.replace(/\D/g, ""));

  function goToMiniHome(authorId) {
    const targetDiaryId = generateDiaryId(authorId);
    navigate(`/diary/${targetDiaryId}`);
  }

  function handleEdit(commentId, memberId) {
    const diaryId = generateDiaryId(memberId);
    navigate(`/diary/${diaryId}/comment/edit/${commentId}`);
  }

  function handleView(commentId, diaryId) {
    console.log("commentId", commentId);
    navigate(`/diary/${diaryId}/comment/view/${commentId}`);
  }

  function handleDelete(commentId) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    axios
      .delete(`/api/diaryComment/${commentId}`)
      .then(() => {
        toast({ status: "success", description: "댓글이 삭제되었습니다." });
        // 삭제 후에는 새로고침하거나 상위(Home)에서 상태를 갱신해줘야 함
      })
      .catch(() =>
        toast({
          status: "error",
          description: "댓글 삭제 중 오류가 발생했습니다.",
          position: "top",
        }),
      );
  }

  if (!Array.isArray(diaryCommentList)) {
    return (
      <Center>
        <Text>댓글이 없습니다.</Text>
      </Center>
    );
  }

  return (
    <Box p={5}>
      <Center mb={5}>
        <Text fontWeight="bold" fontSize="x-large">
          방명록 보기
        </Text>
      </Center>

      <VStack spacing={4}>
        {diaryCommentList.map((diaryComment, index) => {
          const insertedDate = diaryComment.inserted
            ? parseISO(diaryComment.inserted)
            : null;
          const formattedDate =
            insertedDate && isValid(insertedDate)
              ? format(insertedDate, "yyyy.MM.dd")
              : "Unknown date";

          const isCommentOwner =
            Number(memberInfo?.id) === Number(diaryComment.memberId);
          const isDiaryOwner = Number(memberInfo?.id) === numericDiaryId;

          return (
            <Card
              key={diaryComment.id}
              w="100%"
              variant="outline"
              boxShadow="md"
            >
              <CardBody>
                <HStack justifyContent="space-between" mb={2}>
                  <HStack spacing={2}>
                    <Text fontWeight="bold">{index + 1}</Text>
                    <Text fontWeight="bold">{diaryComment.nickname}</Text>

                    {/* 미니홈피 이동 */}
                    <Popover placement="bottom-start">
                      <PopoverTrigger>
                        <Button colorScheme="teal" size="sm">
                          <FontAwesomeIcon icon={faHouseUser} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent w="auto">
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontWeight="bold" fontSize="md">
                          미니홈피 이동
                        </PopoverHeader>
                        <PopoverBody>
                          <Button
                            colorScheme="pink"
                            size="sm"
                            onClick={() => goToMiniHome(diaryComment.memberId)}
                          >
                            이동하기
                          </Button>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>

                    {/* View 버튼 */}
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleView(diaryComment.id, diaryId)}
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Button>
                    {/* 삭제 버튼 (내 댓글이거나 다이어리 주인일 때) */}
                    {(isCommentOwner || isDiaryOwner) && (
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDelete(diaryComment.id)}
                      >
                        삭제
                      </Button>
                    )}
                  </HStack>

                  <Text fontSize="sm" color="gray.500">
                    {formattedDate}
                  </Text>
                </HStack>

                <Textarea
                  value={diaryComment.comment}
                  minH="100px"
                  isReadOnly
                  mb={2}
                />
              </CardBody>
            </Card>
          );
        })}
      </VStack>
    </Box>
  );
}
