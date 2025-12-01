import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/LoginProvider.jsx";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

export function BoardWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // const [writer, setWriter] = useState(""); // 사용되지 않아 주석 처리
  const [files, setFiles] = useState([]);
  const [invisibledText, setInvisibledText] = useState(true);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [boardType, setBoardType] = useState("자유");
  const navigate = useNavigate();
  const location = useLocation();
  const { memberInfo } = useContext(LoginContext);

  // ✅ 모달 상태 관리 훅
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();

  function handleSaveClick() {
    axios
      .postForm("/api/board/add", {
        title,
        content,
        boardType,
        memberId: memberInfo.id,
        files,
      })
      .then(() => {
        // ✅ 저장 성공 시 바로 이동하지 않고 모달 열기
        onOpen();
      })
      .catch((err) => {
        console.log(err);
        toast({
          title: "저장 실패",
          description: "게시글 저장 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  }

  // ✅ 모달 닫기 및 목록 이동 핸들러
  function handleCloseAndNavigate() {
    onClose();
    navigate("/board/list");
  }

  React.useEffect(() => {
    if (!memberInfo) {
      toast({
        title: "로그인 회원만 가능합니다",
        duration: 3000,
        isClosable: true,
        status: "error",
      });
      const previousPath = location.state?.from || "/";
      navigate(previousPath, { replace: true });
    }

    // 유효성 검사 로직
    if (title.trim().length === 0 || content.trim().length === 0) {
      setDisableSaveButton(true);
    } else {
      // 파일 용량 에러가 없을 때만 버튼 활성화
      if (invisibledText) {
        setDisableSaveButton(false);
      }
    }
  }, [title, content, memberInfo, navigate, location, invisibledText, toast]);

  const fileNameList = files.map((file, index) => (
    <li key={index}>{file.name}</li>
  ));

  function handleChange(e) {
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
      setFiles(selectedFiles);
      setInvisibledText(true);

      if (title.trim().length === 0 || content.trim().length === 0) {
        setDisableSaveButton(true);
      } else {
        setDisableSaveButton(false);
      }
    }
  }

  if (!memberInfo) {
    return <Box />;
  }

  return (
    <Center>
      <Box
        maxW={"700px"}
        w={"100%"}
        p={6}
        boxShadow={"lg"}
        borderRadius={"md"}
        mt={10}
        bg={"white"}
      >
        <Box mb={6}>
          <FormControl>
            <FormLabel>작성자</FormLabel>
            <Text>{memberInfo.nickname}</Text>
          </FormControl>
        </Box>
        <Box mb={6}>
          <FormControl>
            <FormLabel>제목</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="filled"
              focusBorderColor="teal.500"
              placeholder="제목을 입력하세요"
            />
          </FormControl>
        </Box>
        <Box mb={6}>
          <Box fontWeight="bold" mb={2}>
            카테고리 선택
          </Box>
          <Menu>
            {({ isOpen }) => (
              <>
                <MenuButton
                  as={Button}
                  rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  bg="gray.100"
                  color="black"
                  fontWeight="medium"
                  _hover={{ bg: "gray.200" }}
                  _active={{ bg: "gray.300" }}
                  size="lg"
                  width="100%"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                >
                  {`${boardType}`}
                </MenuButton>
                <MenuList overflowY="auto">
                  <MenuItem onClick={() => setBoardType("자유")}>
                    자유 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("사진 공유")}>
                    사진 공유 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("질문/답변")}>
                    질문/답변 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("반려동물 건강")}>
                    반려동물 건강 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("훈련/교육")}>
                    훈련/교육 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("리뷰")}>
                    리뷰 게시판
                  </MenuItem>
                  <MenuItem onClick={() => setBoardType("이벤트/모임")}>
                    이벤트/모임 게시판
                  </MenuItem>
                  {Number(memberInfo.id) === 1 && (
                    <MenuItem onClick={() => setBoardType("반려동물 정보")}>
                      반려동물 정보 게시판
                    </MenuItem>
                  )}
                </MenuList>
              </>
            )}
          </Menu>
        </Box>
        <Box mb={6}>
          <FormControl>
            <FormLabel>내용</FormLabel>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              height="200px"
              variant="filled"
              focusBorderColor="teal.500"
              placeholder="내용을 입력하세요"
            />
          </FormControl>
        </Box>
        <Box mb={6}>
          <FormControl>
            <FormLabel>파일</FormLabel>
            <Input
              multiple
              type="file"
              accept="image/*"
              onChange={handleChange}
              variant="filled"
              focusBorderColor="teal.500"
            />
            {!invisibledText && (
              <FormHelperText color="red.500">
                총 용량은 100MB, 한 파일은 10MB를 초과할 수 없습니다.
              </FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box mb={6}>
          <ul>{fileNameList}</ul>
        </Box>
        <Box textAlign="center">
          <Button
            colorScheme={"teal"}
            onClick={handleSaveClick}
            isDisabled={disableSaveButton}
          >
            저장
          </Button>
        </Box>
      </Box>

      {/* ✅ 저장 성공 모달 */}
      <Modal
        isOpen={isOpen}
        onClose={handleCloseAndNavigate}
        isCentered
        closeOnOverlayClick={false} // 모달 밖을 클릭해도 안 닫히게 설정 (선택사항)
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>알림</ModalHeader>
          {/* <ModalCloseButton /> X 버튼 필요하면 주석 해제 */}
          <ModalBody>게시글이 성공적으로 저장되었습니다.</ModalBody>

          <ModalFooter>
            <Button colorScheme="teal" onClick={handleCloseAndNavigate}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
