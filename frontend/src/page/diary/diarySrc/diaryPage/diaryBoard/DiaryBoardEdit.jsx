import React, { useContext, useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPaperclip,
  faPen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryBoardEdit() {
  const { id } = useParams();
  const [diaryBoard, setDiaryBoard] = useState(null);
  const [removeFileList, setRemoveFileList] = useState([]); // 삭제할 파일 이름 목록
  const [addFileList, setAddFileList] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { memberInfo } = useContext(LoginContext);
  const nickname = memberInfo?.nickname || "";

  // 🎨 스타일 변수
  const titleColor = "blue.600";
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    axios.get(`/api/diaryBoard/${id}`).then((res) => setDiaryBoard(res.data));
  }, [id]);

  const handleClickSave = () => {
    const formData = new FormData();
    formData.append("id", diaryBoard.id);
    formData.append("title", diaryBoard.title);
    formData.append("content", diaryBoard.content);
    formData.append("mood", diaryBoard.mood);
    formData.append("nickname", memberInfo.nickname);
    formData.append("memberId", memberInfo.id);

    removeFileList.forEach((file) => formData.append("removeFileList", file));
    Array.from(addFileList).forEach((file) =>
      formData.append("addFileList", file),
    );

    axios
      .put("/api/diaryBoard/edit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        toast({
          status: "success",
          description: "일기가 수정되었습니다.",
          position: "top",
        });
        navigate(
          `/diary/${generateDiaryId(memberInfo.id)}/board/view/${diaryBoard.id}`,
        );
      })
      .catch((err) => {
        toast({
          status: "error",
          description: "수정에 실패했습니다.",
          position: "top",
        });
      })
      .finally(() => {
        onClose();
      });
  };

  // 삭제할 파일 체크 핸들러
  const handleRemoveSwitchChange = (name, isChecked) => {
    setRemoveFileList((prev) =>
      isChecked ? [...prev, name] : prev.filter((item) => item !== name),
    );
  };

  if (diaryBoard === null) {
    return (
      <Center mt={10}>
        <Spinner size="xl" color="blue.400" />
      </Center>
    );
  }

  const isOwner = diaryBoard.writer === nickname;

  if (!isOwner) {
    return (
      <Center mt={10} fontFamily="'Gulim', sans-serif">
        수정 권한이 없습니다. 🚫
      </Center>
    );
  }

  return (
    <Box h="100%" p={4} display="flex" flexDirection="column" overflowY="auto">
      {/* 1. 헤더 영역 */}
      <Flex
        align="center"
        mb={4}
        pb={2}
        borderBottom="2px solid"
        borderColor={titleColor}
      >
        <Icon as={FontAwesomeIcon} icon={faPen} color={titleColor} mr={2} />
        <Heading size="md" fontFamily="'Gulim', sans-serif" color="#333">
          일기 수정
        </Heading>
      </Flex>

      {/* 2. 입력 폼 영역 */}
      <VStack
        spacing={4}
        align="stretch"
        flex={1}
        fontFamily="'Gulim', sans-serif"
      >
        {/* 제목 & 기분 */}
        <Flex gap={2}>
          <FormControl flex={1}>
            <FormLabel fontSize="sm" mb={1} fontWeight="bold" color="gray.600">
              제목
            </FormLabel>
            <Input
              value={diaryBoard.title}
              onChange={(e) =>
                setDiaryBoard({ ...diaryBoard, title: e.target.value })
              }
              bg={inputBg}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl w="150px">
            <FormLabel fontSize="sm" mb={1} fontWeight="bold" color="gray.600">
              기분
            </FormLabel>
            <Select
              value={diaryBoard.mood}
              onChange={(e) =>
                setDiaryBoard({ ...diaryBoard, mood: e.target.value })
              }
              bg={inputBg}
              borderColor={borderColor}
            >
              <option value="HAPPY">😊 행복</option>
              <option value="SAD">😢 슬픔</option>
              <option value="ANGRY">😡 화남</option>
              <option value="NEUTRAL">😐 보통</option>
            </Select>
          </FormControl>
        </Flex>

        {/* 본문 */}
        <FormControl>
          <FormLabel fontSize="sm" mb={1} fontWeight="bold" color="gray.600">
            내용
          </FormLabel>
          <Textarea
            value={diaryBoard.content}
            onChange={(e) =>
              setDiaryBoard({ ...diaryBoard, content: e.target.value })
            }
            h="250px"
            resize="none"
            bg={inputBg}
            borderColor={borderColor}
            lineHeight="1.8"
          />
        </FormControl>

        {/* 기존 파일 목록 (삭제 선택) */}
        {diaryBoard.fileList && diaryBoard.fileList.length > 0 && (
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
              기존 파일 삭제
            </FormLabel>
            <VStack
              align="stretch"
              spacing={2}
              p={3}
              border="1px dashed"
              borderColor="red.200"
              borderRadius="md"
              bg="red.50"
            >
              {diaryBoard.fileList.map((file) => (
                <Flex key={file.name} justify="space-between" align="center">
                  <Flex align="center" gap={2}>
                    <Icon
                      as={FontAwesomeIcon}
                      icon={faPaperclip}
                      color="gray.500"
                      size="xs"
                    />
                    <Text fontSize="sm" isTruncated maxW="300px">
                      {file.name}
                    </Text>
                  </Flex>
                  <HStack>
                    <Text fontSize="xs" color="red.500">
                      삭제
                    </Text>
                    <Switch
                      size="sm"
                      colorScheme="red"
                      isChecked={removeFileList.includes(file.name)}
                      onChange={(e) =>
                        handleRemoveSwitchChange(file.name, e.target.checked)
                      }
                    />
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </FormControl>
        )}

        {/* 새 파일 추가 */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
            파일 추가
          </FormLabel>
          <Input
            multiple
            type="file"
            accept="image/*"
            onChange={(e) => setAddFileList(e.target.files)}
            pt={1}
            fontSize="sm"
            bg={inputBg}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
            작성자
          </FormLabel>
          <Input
            value={diaryBoard.writer}
            readOnly
            bg="gray.100"
            border="none"
          />
        </FormControl>
      </VStack>

      {/* 3. 하단 버튼 */}
      <HStack justify="flex-end" mt={6} spacing={2}>
        <Button
          leftIcon={<FontAwesomeIcon icon={faXmark} />}
          onClick={() => navigate(-1)}
          variant="ghost"
          colorScheme="gray"
          size="sm"
        >
          취소
        </Button>
        <Button
          leftIcon={<FontAwesomeIcon icon={faCheck} />}
          onClick={onOpen}
          colorScheme="blue"
          size="sm"
          boxShadow="md"
        >
          저장
        </Button>
      </HStack>

      {/* 저장 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent fontFamily="'Gulim', sans-serif">
          <ModalHeader fontSize="md">수정 확인</ModalHeader>
          <ModalBody fontSize="sm">정말 수정하시겠습니까?</ModalBody>
          <ModalFooter>
            <Button size="sm" onClick={onClose} mr={2}>
              취소
            </Button>
            <Button size="sm" onClick={handleClickSave} colorScheme="blue">
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
