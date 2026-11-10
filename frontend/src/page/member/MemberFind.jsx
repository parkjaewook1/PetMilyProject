import { accountBoardPageStyle } from "../../design/accountBoardStyles.js";
import React, { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "@api/axiosConfig";

export function MemberFind() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const toast = useToast();

  async function handleFindPassword(event) {
    if (event) event.preventDefault(); // form submit 방지

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    // 유효성 검사
    if (!username) {
      setError("이메일이 입력되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/member/sendEmail", { username });

      if (response.status === 200) {
        setSuccessMessage("임시 비밀번호가 이메일로 전송되었습니다.");
        toast({
          title: "성공",
          description: "임시 비밀번호가 이메일로 전송되었습니다.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError("비밀번호 재설정 링크 전송에 실패했습니다.");
      }
    } catch (error) {
      setError("이메일 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleFindPassword(event);
    }
  };

  return (
    <Center
      as="main"
      className="ab-page ab-account ab-memberfind"
      sx={accountBoardPageStyle}
      mt={5}
    >
      <Box
        className="ab-form-panel"
        w={500}
        p={6}
        boxShadow="lg"
        borderRadius="md"
        bg="white"
      >
        <VStack spacing={4} align="stretch">
          <Text className="ab-eyebrow">PETMILY / ACCOUNT</Text>
          <Text
            as="h1"
            className="ab-heading"
            fontSize="2xl"
            fontWeight="bold"
            textAlign="center"
            mb={6}
          >
            비밀번호 찾기
          </Text>
          <Text className="ab-description">
            가입한 이메일로 비밀번호 찾기를 진행하세요.
          </Text>
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {successMessage}
            </Alert>
          )}
          <FormControl>
            <FormLabel htmlFor="memberfind-field-1" variant="journal">
              이메일
            </FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="이메일을 입력하세요"
              onKeyPress={handleKeyPress}
              variant="journal"
              focusBorderColor="purple.500"
              id="memberfind-field-1"
            />
          </FormControl>
          <Button
            mt={4}
            width="full"
            onClick={handleFindPassword}
            isLoading={isLoading}
            variant="journal"
          >
            {isLoading ? <Spinner size="sm" /> : "비밀번호 찾기"}
          </Button>
        </VStack>
      </Box>
    </Center>
  );
}
