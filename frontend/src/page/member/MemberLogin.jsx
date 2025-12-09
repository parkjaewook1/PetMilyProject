import React, { useContext, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Img,
  Input,
  InputGroup,
  Link,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import axios from "@api/axiosConfig";
import { LoginContext } from "../../component/LoginProvider.jsx";

export function MemberLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { setMemberInfo } = useContext(LoginContext);

  async function handleLogin(event) {
    if (event) event.preventDefault();

    setIsLoading(true);
    setError("");

    if (!username) {
      setError("이메일이 입력되지 않았습니다.");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("비밀번호가 입력되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("/api/member/login", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        // ⚡️ [수정] 백엔드에서 보내준 데이터에서 refresh 토큰도 꺼냅니다.
        const { access, refresh, id, nickname, role } = response.data;

        const memberInfo = { access, id, nickname, role };
        console.log("로그인 데이터:", response.data);

        // ⚡️ [핵심 추가] axiosConfig가 사용할 토큰들을 로컬스토리지에 저장합니다.
        // 이 부분이 있어야 재발급(401 -> 400 해결)이 작동합니다.
        localStorage.setItem("accessToken", access);

        if (refresh) {
          localStorage.setItem("refreshToken", refresh);
        }

        // ✅ 전역 상태 업데이트
        setMemberInfo(memberInfo);
        localStorage.setItem("memberInfo", JSON.stringify(memberInfo));

        // ✅ axios 기본 헤더 설정 (표준 Authorization 방식)
        axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;

        // ✅ 로그인 전 가려던 경로로 이동
        const redirectPath = location.state?.from || "/";
        navigate(redirectPath, { replace: true });
      } else {
        setError("로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      setError("이메일 또는 비밀번호를 다시 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(event) {
    if (event.key === "Enter") {
      handleLogin();
    }
  }

  function handleNaverLogin() {
    window.location.href =
      "http://52.79.251.74:8080/oauth2/authorization/naver";
  }

  return (
    <Center mt={5}>
      <Box w={500} p={6} boxShadow="lg" borderRadius="md" bg="white">
        <Box mb={10} fontSize="2xl" fontWeight="bold" textAlign="center">
          로그인
        </Box>
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <FormControl mb={4}>
          <FormLabel>이메일</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="이메일을 입력하세요"
            onKeyPress={handleKeyPress}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>비밀번호</FormLabel>
          <InputGroup>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              onKeyPress={handleKeyPress}
            />
          </InputGroup>
        </FormControl>
        <Flex justifyContent="space-between" mb={5}>
          <FormControl display="flex" alignItems="center"></FormControl>
          <Flex
            gap={5}
            fontSize="sm"
            justifyContent="flex-end"
            alignItems="center"
            minWidth="200px"
          >
            <Link
              as={RouterLink}
              to="/member/find"
              whiteSpace="nowrap"
              _hover={{ fontWeight: "bold" }}
            >
              비밀번호 찾기
            </Link>
          </Flex>
        </Flex>
        <Box mt={5}>
          <Button
            width={"100%"}
            height={"50px"}
            bg={"#E6E6FA"}
            color="purple"
            _hover={{ bg: "#DCD0FF" }}
            onClick={handleLogin}
            isLoading={isLoading}
            leftIcon={<Img src="/img/favicon.png" boxSize="20px" />}
          >
            {isLoading ? <Spinner size="sm" /> : "펫밀리로 로그인"}
          </Button>
          <Button
            mt={4}
            width={"100%"}
            height={"50px"}
            bg="#03C75A"
            color="white"
            _hover={{ bg: "#02A447" }}
            leftIcon={<Img src="/img/naver-logo.png" boxSize="20px" />}
            onClick={handleNaverLogin}
          >
            네이버로 로그인
          </Button>
        </Box>
        <Text mt={5} textAlign="center">
          아직 펫밀리의 회원이 아니신가요?{" "}
          <Link
            as={RouterLink}
            to="/member/signup"
            color="blue.500"
            fontWeight="bold"
            _hover={{ textDecoration: "underline" }}
          >
            가입하기
          </Link>
        </Text>
      </Box>
    </Center>
  );
}
