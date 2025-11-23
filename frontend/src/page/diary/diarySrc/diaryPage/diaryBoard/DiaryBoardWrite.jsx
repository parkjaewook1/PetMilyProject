import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { useNavigate, useOutletContext } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPaperclip,
  faPenNib,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryBoardWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("NEUTRAL");
  const [files, setFiles] = useState([]);

  const { memberInfo } = useContext(LoginContext);
  const access = memberInfo?.access || null;
  const isLoggedIn = Boolean(access);

  const toast = useToast();
  const navigate = useNavigate();
  const { ownerId } = useOutletContext();

  const myDiaryId = generateDiaryId(memberInfo?.id);
  const isOwner = String(memberInfo?.id) === String(ownerId);

  // 🎨 스타일 변수
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const titleColor = "blue.600";
  const inputBg = useColorModeValue("white", "gray.700");

  // 📜 스크롤바 스타일 (통일감)
  const scrollbarStyle = {
    "&::-webkit-scrollbar": { width: "6px" },
    "&::-webkit-scrollbar-track": { background: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e0",
      borderRadius: "3px",
    },
  };

  const handleFileChange = (e) => {
    // ✅ 오타 수정: Array.f디om -> Array.from
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSaveClick = () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("mood", selectedMood);

    files.forEach((file) => {
      formData.append("files", file);
    });

    axios
      .post("/api/diaryBoard/add", formData)
      .then((res) => {
        const newId = res.data.id;
        toast({
          description: "일기가 기록되었습니다! 📖",
          status: "success",
          position: "top",
          duration: 2000,
        });
        navigate(`/diary/${myDiaryId}/board/list`, {
          state: { newPostId: newId },
        });
      })
      .catch((e) => {
        const code = e.response?.status;
        const message = e.response?.data;

        if (code === 409) {
          toast({
            status: "warning",
            description: message || "오늘은 이미 일기를 작성하셨습니다.",
            position: "top",
          });
        } else {
          toast({
            status: "error",
            description: "저장에 실패했습니다.",
            position: "top",
          });
        }
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    navigate(-1); // 뒤로 가기
  };

  // 🚫 접근 제한 처리
  if (!isLoggedIn || ownerId === null) {
    return (
      <Center mt={10}>
        <Spinner size="xl" color="blue.400" />
      </Center>
    );
  }

  if (!isOwner) {
    return (
      <Center mt={10} fontFamily="'Gulim', sans-serif">
        주인장만 작성할 수 있습니다. 🚫
      </Center>
    );
  }

  return (
    <Box h="100%" p={4} display="flex" flexDirection="column">
      {/* 1. 헤더 영역 */}
      <Flex
        align="center"
        mb={4}
        pb={2}
        borderBottom="2px solid"
        borderColor={titleColor}
      >
        <Icon as={FontAwesomeIcon} icon={faPenNib} color={titleColor} mr={2} />
        <Heading size="md" fontFamily="'Gulim', sans-serif" color="#333">
          일기 쓰기
        </Heading>
      </Flex>

      {/* 2. 입력 폼 영역 */}
      <VStack
        spacing={4}
        align="stretch"
        flex={1}
        fontFamily="'Gulim', sans-serif"
      >
        {/* 제목 & 기분 선택 */}
        <Flex gap={2}>
          <FormControl flex={1}>
            <Input
              variant="flushed" // 밑줄 스타일
              placeholder="제목을 입력하세요..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fontSize="lg"
              fontWeight="bold"
              focusBorderColor={titleColor}
              bg="transparent"
            />
          </FormControl>

          <FormControl w="150px">
            <Select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              size="sm"
              borderRadius="md"
              bg={inputBg}
            >
              <option value="HAPPY">🥰 행복</option>
              <option value="SAD">😭 슬픔</option>
              <option value="ANGRY">😡 화남</option>
              <option value="NEUTRAL">😐 보통</option>
            </Select>
          </FormControl>
        </Flex>

        {/* 본문 입력 */}
        <FormControl flex={1} display="flex" flexDirection="column">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            resize="none"
            flex={1} // 남은 높이 꽉 채우기
            p={4}
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            focusBorderColor={titleColor}
            sx={scrollbarStyle}
            lineHeight="1.8" // 줄간격 넓게
          />
        </FormControl>

        {/* 파일 첨부 */}
        <FormControl>
          <Flex
            align="center"
            p={2}
            border="1px dashed"
            borderColor="gray.300"
            borderRadius="md"
            bg="gray.50"
          >
            <Icon
              as={FontAwesomeIcon}
              icon={faPaperclip}
              color="gray.500"
              mr={3}
            />
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*"
              variant="unstyled" // 기본 테두리 제거
              p={1}
              size="sm"
              color="gray.600"
            />
          </Flex>
          {files.length > 0 && (
            <Text fontSize="xs" color="blue.500" mt={1} ml={1}>
              📎 {files.length}개의 파일이 선택됨
            </Text>
          )}
        </FormControl>
      </VStack>

      {/* 3. 하단 버튼 영역 */}
      <HStack justify="flex-end" mt={4} spacing={2}>
        <Button
          leftIcon={<FontAwesomeIcon icon={faXmark} />}
          onClick={handleCancel}
          variant="ghost"
          colorScheme="gray"
          size="sm"
        >
          취소
        </Button>
        <Button
          leftIcon={<FontAwesomeIcon icon={faCheck} />}
          isLoading={loading}
          isDisabled={title.trim().length === 0 || content.trim().length === 0}
          colorScheme="blue"
          onClick={handleSaveClick}
          size="sm"
          boxShadow="md"
        >
          저장하기
        </Button>
      </HStack>
    </Box>
  );
}
