import { accountBoardPageStyle } from "../../design/accountBoardStyles.js";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { LoginContext } from "../../component/LoginProvider.jsx";

export function BoardEdit() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [removeFileList, setRemoveFileList] = useState([]);
  const [addFileList, setAddFileList] = useState([]);
  const [invisibledText, setInvisibledText] = useState(true);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { memberInfo } = useContext(LoginContext);
  const memberId = memberInfo && memberInfo.id ? parseInt(memberInfo.id) : null;

  useEffect(() => {
    const requestParams = memberId ? { memberId } : {};

    if (id) {
      axios
        .get(`/api/board/${id}`, { params: requestParams })
        .then((res) => {
          setBoard(res.data.board);
        })
        .catch((err) => console.error("게시글 로드 실패:", err));
    }
  }, [id, memberId]); // 👈 객체(params) 대신 원시값(memberId)을 넣어서 무한 루프 방지!

  useEffect(() => {
    if (board) {
      setDisableSaveButton(
        board.title.trim().length === 0 || board.content.trim().length === 0,
      );
    }
  }, [board]);

  const handleClickSave = () => {
    axios
      .putForm(`/api/board/edit`, {
        id: board.id,
        title: board.title,
        content: board.content,
        memberId: memberId, // ⚡️ [수정] params.memberId 대신 memberId 직접 사용
        removeFileList,
        addFileList,
      })
      .then(() => {
        toast({
          status: "success",
          description: `${board.id}번 게시글이 수정되었습니다`,
          duration: 500,
          position: "top",
        });
        navigate(`/board/${id}`);
      })
      .catch((err) => {
        const errorMessage =
          err.response?.status === 403
            ? "권한이 없습니다."
            : "다른 오류가 발생했습니다";
        toast({
          status: "error",
          description: errorMessage,
          duration: 500,
          position: "top",
        });
      })
      .finally(onClose);
  };

  if (board === null) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  const fileNameList = addFileList.map((file) => {
    const duplicate = board.fileList.some(
      (boardFile) => boardFile.name === file.name,
    );
    return (
      <li key={file.name}>
        {file.name}
        {duplicate && <Badge colorScheme="red">override</Badge>}
      </li>
    );
  });

  const handleRemoveFile = (name) => {
    setRemoveFileList((prevList) => {
      if (prevList.includes(name)) {
        return prevList.filter((item) => item !== name);
      } else {
        return [...prevList, name];
      }
    });
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    let totalSize = 0;
    let hasOversizedFile = false;

    selectedFiles.forEach((file) => {
      if (file.size > 100 * 1024 * 1024) {
        hasOversizedFile = true;
      }
      totalSize += file.size;
    });

    if (totalSize > 100 * 1024 * 1024 || hasOversizedFile) {
      setDisableSaveButton(true);
      setInvisibledText(false);
    } else {
      setDisableSaveButton(false);
      setInvisibledText(true);
      setAddFileList(selectedFiles);
    }

    if (board.title.trim().length === 0 || board.content.trim().length === 0) {
      setDisableSaveButton(true);
    } else {
      setDisableSaveButton(false);
    }
  };

  return (
    <Box
      as="main"
      className="ab-page ab-board ab-editor ab-edit"
      sx={accountBoardPageStyle}
      maxW="1000px"
      m="auto"
      p={6}
      boxShadow="lg"
      borderRadius="md"
      mt={10}
      bg="white"
    >
      <Box
        className="ab-editor-sheet"
        p={4}
        bg="white"
        borderRadius="md"
        boxShadow="md"
        mb={4}
      >
        <Text className="ab-eyebrow">COMMUNITY / EDIT</Text>
        <Text
          as="h1"
          className="ab-heading"
          fontSize="2xl"
          fontWeight="bold"
          mb={6}
        >
          {id}번 게시물 수정
        </Text>
        <FormControl mb={4}>
          <FormLabel htmlFor="boardedit-field-1" variant="journal">
            제목
          </FormLabel>
          <Input
            defaultValue={board.title}
            onChange={(e) => setBoard({ ...board, title: e.target.value })}
            id="boardedit-field-1"
            variant="journal"
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel htmlFor="boardedit-field-2" variant="journal">
            본문
          </FormLabel>
          <Textarea
            defaultValue={board.content}
            onChange={(e) => setBoard({ ...board, content: e.target.value })}
            id="boardedit-field-2"
            variant="journal"
          />
        </FormControl>
        <Box mb={4}>
          {board.fileList &&
            board.fileList.map((file) => (
              <Box
                border="1px solid gray"
                borderRadius="md"
                p={3}
                mb={3}
                key={file.name}
                position="relative"
              >
                <Flex align="center">
                  <Box position="relative">
                    <Image
                      boxSize="100px"
                      objectFit="cover"
                      src={file.src}
                      alt={file.name}
                      borderRadius="md"
                      style={
                        removeFileList.includes(file.name)
                          ? { filter: "blur(8px)" }
                          : {}
                      }
                    />
                    <IconButton
                      icon={<FontAwesomeIcon icon={faTimes} />}
                      variant="unstyled"
                      size="sm"
                      color="red.500"
                      position="absolute"
                      top={-1}
                      right={-1}
                      onClick={() => handleRemoveFile(file.name)}
                    />
                  </Box>
                </Flex>
                <Text>{file.name}</Text>
              </Box>
            ))}
        </Box>
        <FormControl mb={4}>
          <FormLabel htmlFor="boardedit-field-3" variant="journal">
            파일
          </FormLabel>
          <Input
            multiple
            type="file"
            accept="image/*"
            onChange={handleChange}
            id="boardedit-field-3"
            variant="journal"
          />
          {!invisibledText && (
            <FormHelperText color="red.500">
              총 용량은 100MB, 한 파일은 100MB를 초과할 수 없습니다.
            </FormHelperText>
          )}
        </FormControl>
        <Box mb={4}>
          <ul>{fileNameList}</ul>
        </Box>
        <Flex justify="flex-end" gap={3}>
          <Button
            onClick={onOpen}
            isDisabled={disableSaveButton}
            variant="journalOutline"
          >
            수정
          </Button>
        </Flex>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent className="ab-modal" sx={accountBoardPageStyle}>
          <ModalHeader>게시물 수정</ModalHeader>
          <ModalCloseButton />
          <ModalBody>정말로 수정하시겠습니까?</ModalBody>
          <ModalFooter>
            <Button onClick={onClose} variant="journalOutline">
              취소
            </Button>
            <Button onClick={handleClickSave} variant="journal">
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
