import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Spinner,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { LoginContext } from "../../../../../component/LoginProvider.jsx";
import { generateDiaryId } from "../../../../../util/util.jsx";

export function DiaryBoardWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("NEUTRAL");
  const [files, setFiles] = useState([]); // 📌 파일 상태 추가

  const { memberInfo } = useContext(LoginContext);
  const access = memberInfo?.access || null;
  const isLoggedIn = Boolean(access);

  const toast = useToast();
  const navigate = useNavigate();
  const { diaryId: diaryIdParam } = useParams();
  const { ownerId, numericDiaryId, encodedId } = useOutletContext();

  const username = memberInfo?.nickname || "";
  const myDiaryId = generateDiaryId(memberInfo.id);

  const isOwner = String(memberInfo?.id) === String(ownerId);

  const handleFileChange = (e) => {
    setFiles(Array.f디om(e.target.files)); // 여러 파일 선택 가능
  };

  const handleSaveClick = () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("mood", selectedMood);

    // 📌 파일 추가
    files.forEach((file) => {
      formData.append("files", file);
    });

    axios
      .post("/api/diaryBoard/add", formData)
      .then((res) => {
        const newId = res.data.id;
        toast({
          description: "새 글이 등록되었습니다.",
          status: "success",
          position: "top",
        });
        navigate(`/diary/${myDiaryId}/board/list`, {
          state: { newPostId: newId },
        });
        console.log("encodedId:", encodedId);
        console.log("myDiaryId:", myDiaryId);
      })
      .catch((e) => {
        const code = e.response?.status;
        const message = e.response?.data; // 서버에서 body로 문자열 내려줬다면 그냥 data

        if (code === 400) {
          toast({
            status: "error",
            description: "등록되지 않았습니다. 입력한 내용을 확인하세요.",
            position: "top",
          });
        } else if (code === 401 || code === 403) {
          toast({
            status: "error",
            description: "이 다이어리의 주인만 글을 작성할 수 있습니다.",
            position: "top",
          });
        } else if (code === 409) {
          toast({
            status: "warning",
            description: message || "오늘은 이미 일기를 작성하셨습니다.",
            position: "top",
          });
        } else {
          toast({
            status: "error",
            description: "알 수 없는 오류가 발생했습니다.",
            position: "top",
          });
        }
      })
      .finally(() => setLoading(false));
  };

  const disableSaveButton =
    title.trim().length === 0 || content.trim().length === 0;

  // 로그인 안 한 경우
  if (!isLoggedIn) {
    return (
      <Center mt={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  // 주인 여부 판단 전 로딩
  if (ownerId === null) {
    return (
      <Center mt={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  // 로그인했지만 주인이 아닌 경우
  if (!isOwner) {
    return (
      <Center mt={10}>이 다이어리의 주인만 글을 작성할 수 있습니다.</Center>
    );
  }

  // 주인인 경우 작성 폼 표시
  return (
    <Center mt={5}>
      <Box w={500} p={6} boxShadow="lg" borderRadius="md" bg="white">
        <Heading mb={10} textAlign="center">
          글 작성
        </Heading>
        <FormControl mb={4}>
          <FormLabel>작성자</FormLabel>
          <Input value={username} readOnly />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>제목</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>본문</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="본문을 입력하세요"
            height="200px"
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>오늘의 기분</FormLabel>
          <Select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            placeholder="기분을 선택하세요"
          >
            <option value="HAPPY">😊 행복</option>
            <option value="SAD">😢 슬픔</option>
            <option value="ANGRY">😡 화남</option>
            <option value="NEUTRAL">😐 보통</option>
          </Select>
        </FormControl>
        {/* 📌 파일 업로드 필드 */}
        <FormControl mb={4}>
          <FormLabel>첨부 파일</FormLabel>
          <Input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*"
          />
        </FormControl>
        <Button
          isLoading={loading}
          isDisabled={disableSaveButton}
          colorScheme="blue"
          width="100%"
          onClick={handleSaveClick}
        >
          저장
        </Button>
      </Box>
    </Center>
  );
}
