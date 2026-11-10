import { accountBoardPageStyle } from "../../design/accountBoardStyles.js";
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { useState } from "react";
import axios from "@api/axiosConfig";

export function BoardCommentEdit({
  comment,
  setIsEditing,
  setIsProcessing,
  isProcessing,
}) {
  const [commentText, setCommentText] = useState(comment.boardComment);
  const { onClose, onOpen, isOpen } = useDisclosure();
  const toast = useToast();
  // console.log(comment);
  function handleCommentSubmit() {
    setIsProcessing(true);
    axios
      .put("/api/comment/edit", {
        id: comment.id,
        boardComment: commentText,
      })
      .then(() => {
        toast({
          description: "댓글이 수정되었습니다.",
          position: "top",
          status: "success",
        });
      })
      .catch(() => {})
      .finally(() => {
        setIsProcessing(false);
        setIsEditing(false);
      });
  }

  return (
    <Flex className="ab-comment-edit">
      <Box flex={1} mr={3}>
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          variant="journal"
        />
      </Box>
      <Stack>
        <Button
          size={"sm"}
          variant="journalOutline"
          onClick={() => setIsEditing(false)}
        >
          <FontAwesomeIcon icon={faXmark} />
        </Button>
        <Button
          size={"sm"}
          isLoading={isProcessing}
          onClick={onOpen}
          variant="journalOutline"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </Button>
      </Stack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent className="ab-modal" sx={accountBoardPageStyle}>
          <ModalHeader>수정 확인</ModalHeader>
          <ModalBody>댓글을 저장하시겠습니까?</ModalBody>
          <ModalFooter>
            <Button mr={2} onClick={onClose} variant="journalOutline">
              취소
            </Button>
            <Button onClick={handleCommentSubmit} variant="journal">
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
