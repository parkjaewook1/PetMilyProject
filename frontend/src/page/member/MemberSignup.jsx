import React, { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHammer } from "@fortawesome/free-solid-svg-icons";

export function MemberSignup(props) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [nationality, setNationality] = useState("korean");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [mainAddress, setMainAddress] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");

  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isUsernameConfirmed, setIsUsernameConfirmed] = useState(false);
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isNicknameConfirmed, setIsNicknameConfirmed] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);
  const [isBirthDateValid, setIsBirthDateValid] = useState(false);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordRight = password === confirmPassword;
  const formattedBirthDate =
    birthDate.slice(0, 4) +
    "-" +
    birthDate.slice(4, 6) +
    "-" +
    birthDate.slice(6, 8);

  const isFormValid =
    isUsernameValid &&
    isUsernameConfirmed &&
    isNicknameValid &&
    isNicknameConfirmed &&
    isPasswordValid &&
    isPasswordRight &&
    gender &&
    nationality &&
    isNameValid &&
    isBirthDateValid &&
    isPhoneNumberValid &&
    postcode;

  // --- 유효성 검사 로직 ---
  function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]{2,3}$/.test(
      username,
    );
    setIsUsernameValid(usernameRegex);
  }

  function validateNickname(nickname) {
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{3,12}$/.test(nickname);
    setIsNicknameValid(nicknameRegex);
  }

  function validatePassword(password) {
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/.test(
        password,
      );
    setIsPasswordValid(passwordRegex);
  }

  function validateName(name) {
    const nameRegex = /^[가-힣]+$/.test(name);
    setIsNameValid(nameRegex);
  }

  function validateBirthDate(date) {
    if (date.length !== 8) return false;
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10);
    const day = parseInt(date.substring(6, 8), 10);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) return false;
    if (month < 1 || month > 12) return false;

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && day === 29) {
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        return true;
      }
      return false;
    }
    if (day < 1 || day > daysInMonth[month - 1]) return false;
    return true;
  }

  function validatePhoneNumber(phoneNumber) {
    const phoneNumberRegex =
      /^01[0-9]{1}-[0-9]{3,4}-[0-9]{4}$/.test(phoneNumber) ||
      /^02-[0-9]{3,4}-[0-9]{4}$/.test(phoneNumber);
    return phoneNumberRegex;
  }

  // --- 입력 핸들러 ---
  function handleNameChange(e) {
    const name = e.target.value.trim();
    setName(name);
    validateName(name);
  }

  function handleBirthDateChange(e) {
    const birthDateRegex = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setBirthDate(birthDateRegex);
    const isValid = validateBirthDate(birthDateRegex);
    setIsBirthDateValid(isValid);
  }

  function handlePhoneNumberChange(e) {
    const phoneNumberRegex = e.target.value
      .replace(/[^0-9]/g, "")
      .replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]{3,4})([0-9]{4})/g, "$1-$2-$3");
    setPhoneNumber(phoneNumberRegex);
    const isValid = validatePhoneNumber(phoneNumberRegex);
    setIsPhoneNumberValid(isValid);
  }

  // ✅ [수정] 이메일 중복확인 (강력한 빈 값 체크)
  function handleCheckUsername() {
    if (!isUsernameValid) {
      toast({
        status: "error",
        description: "이메일 형식을 올바르게 입력해주세요.",
        position: "top",
        duration: 1000,
      });
      return;
    }

    // 파라미터 안전장치: username과 email 둘 다 보냄
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("email", username);

    axios
      .get(`/api/member/check?${params.toString()}`)
      .then((res) => {
        // 👀 F12 콘솔에서 이 로그를 확인하세요! (서버가 뭘 줬는지)
        console.log("이메일 체크 응답 데이터:", res.data);

        // 1. 데이터가 null, undefined, 빈 문자열("")인 경우 -> 사용 가능
        // 2. 빈 객체({})인 경우 -> 사용 가능 (Object.keys 체크)
        const isAvailable =
          !res.data ||
          res.data === "" ||
          (typeof res.data === "object" && Object.keys(res.data).length === 0);

        if (isAvailable) {
          toast({
            status: "success",
            description: "사용 가능한 이메일입니다.",
            position: "top",
            duration: 1000,
          });
          setIsUsernameConfirmed(true);
        } else {
          toast({
            status: "warning",
            description: "이미 사용 중인 이메일입니다.",
            position: "top",
            duration: 1000,
          });
          setIsUsernameConfirmed(false);
        }
      })
      .catch((err) => {
        console.error("서버 에러:", err);
        toast({
          status: "error",
          description: "확인 중 오류가 발생했습니다.",
          position: "top",
          duration: 1000,
        });
      });
  }

  // ✅ [수정] 닉네임 중복확인 (강력한 빈 값 체크)
  function handleCheckNickname() {
    if (!isNicknameValid) {
      toast({
        status: "error",
        description: "닉네임 형식을 확인해주세요.",
        position: "top",
        duration: 1000,
      });
      return;
    }

    axios
      .get(`/api/member/check?nickname=${nickname}`)
      .then((res) => {
        console.log("닉네임 체크 응답 데이터:", res.data);

        const isAvailable =
          !res.data ||
          res.data === "" ||
          (typeof res.data === "object" && Object.keys(res.data).length === 0);

        if (isAvailable) {
          toast({
            status: "success",
            description: "사용 가능한 닉네임입니다.",
            position: "top",
            duration: 1000,
          });
          setIsNicknameConfirmed(true);
        } else {
          toast({
            status: "warning",
            description: "이미 사용 중인 닉네임입니다.",
            position: "top",
            duration: 1000,
          });
          setIsNicknameConfirmed(false);
        }
      })
      .catch((err) => {
        console.error(err);
        toast({
          status: "error",
          description: "확인 중 오류가 발생했습니다.",
          position: "top",
          duration: 1000,
        });
      });
  }

  function handleReenterUsername() {
    setUsername("");
    setIsUsernameConfirmed(false);
    setIsUsernameValid(false);
  }

  function handleReenterNickname() {
    setNickname("");
    setIsNicknameConfirmed(false);
    setIsNicknameValid(false);
  }

  function handleClickPassword() {
    setShowPassword(!showPassword);
  }

  function handleGenderSelect(selectedGender) {
    setGender(selectedGender);
  }

  function handleNationalitySelect(selectedNationality) {
    setNationality(selectedNationality);
  }

  function openPostcodePopup() {
    const postcodePopup = new window.daum.Postcode({
      onComplete: function (data) {
        setPostcode(data.zonecode);
        setMainAddress(data.address);
      },
    });
    postcodePopup.open();
  }

  function handleSubmit() {
    const signupData = {
      name: name,
      username: username,
      nickname: nickname,
      password: password,
      gender: gender,
      nationality: nationality,
      birthDate: formattedBirthDate,
      phoneNumber: phoneNumber,
      postcode: postcode,
      mainAddress: mainAddress,
      detailedAddress: detailedAddress,
    };

    axios
      .post("/api/member/signup", signupData)
      .then((res) => {
        Swal.fire({
          title: "회원가입이 완료되었습니다.",
          text: "로그인 페이지로 이동합니다.",
          icon: "success",
          confirmButtonText: "확인",
        }).then(() => {
          navigate("/member/login");
        });
      })
      .catch((err) => {
        Swal.fire({
          title: "회원가입에 실패하였습니다.",
          text: "오류가 발생하였습니다. 잠시 후 다시 시도해주세요.",
          icon: "error",
          confirmButtonText: "확인",
        });
      });
  }

  return (
    <Center mt={5}>
      <Box w={500} p={6} boxShadow="lg" borderRadius="md" bg="white">
        <Box mb={10} fontSize="2xl" fontWeight="bold" textAlign="center">
          회원가입
        </Box>
        <FormControl isRequired>
          <InputGroup>
            <Input
              placeholder={"이메일"}
              value={username}
              readOnly={isUsernameConfirmed}
              onChange={(e) => {
                setUsername(e.target.value.trim());
                validateUsername(e.target.value.trim());
              }}
              backgroundColor={isUsernameConfirmed ? "gray.200" : "white"}
            />
            <InputRightElement w={"100px"} mr={1}>
              {isUsernameConfirmed ? (
                <Button
                  size={"sm"}
                  variant="ghost"
                  onClick={handleReenterUsername}
                  _hover={{ color: "red.500 " }}
                >
                  <FontAwesomeIcon icon={faHammer} />
                </Button>
              ) : (
                <Button
                  size={"sm"}
                  onClick={handleCheckUsername}
                  isDisabled={!isUsernameValid}
                  cursor={!isUsernameValid ? "not-allowed" : "pointer"}
                  _hover={
                    !isUsernameValid
                      ? { bgColor: "gray.100" }
                      : { bgColor: "purple.500 ", color: "white" }
                  }
                >
                  중복확인
                </Button>
              )}
            </InputRightElement>
          </InputGroup>
          {!isUsernameValid && username && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              올바르지 않은 이메일 형식입니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <InputGroup>
            <Input
              placeholder={"닉네임"}
              value={nickname}
              readOnly={isNicknameConfirmed}
              onChange={(e) => {
                setNickname(e.target.value.trim());
                validateNickname(e.target.value.trim());
              }}
              backgroundColor={isNicknameConfirmed ? "gray.200" : "white"}
            />
            <InputRightElement w={"100px"} mr={1}>
              {isNicknameConfirmed ? (
                <Button
                  size={"sm"}
                  variant="ghost"
                  onClick={handleReenterNickname}
                  _hover={{ color: "red.500 " }}
                >
                  <FontAwesomeIcon icon={faHammer} />
                </Button>
              ) : (
                <Button
                  size={"sm"}
                  onClick={handleCheckNickname}
                  isDisabled={!isNicknameValid}
                  cursor={!isNicknameValid ? "not-allowed" : "pointer"}
                  _hover={
                    !isNicknameValid
                      ? { bgColor: "gray.100" }
                      : { bgColor: "purple.500 ", color: "white" }
                  }
                >
                  중복확인
                </Button>
              )}
            </InputRightElement>
          </InputGroup>
          {!isNicknameValid && nickname && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              닉네임은 3~12자 사이의 한글, 영문, 숫자로 구성되어야 합니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <InputGroup>
            <Input
              placeholder="비밀번호"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => {
                setPassword(e.target.value.trim());
                validatePassword(e.target.value);
              }}
            />
            <InputRightElement width="4.5rem">
              {password && (
                <Button h="1.75rem" size="sm" onClick={handleClickPassword}>
                  {showPassword ? "숨기기" : "보기"}
                </Button>
              )}
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <InputGroup>
            {password && (
              <Input
                placeholder="비밀번호 확인"
                value={confirmPassword}
                type={showPassword ? "text" : "password"}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim());
                }}
              />
            )}
          </InputGroup>
          {!isPasswordValid && password && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              비밀번호는 최소 8자에서 최대 16자 사이
              <br />
              영문 대소문자, 숫자, 특수문자를 포함해야 합니다.
            </Alert>
          )}
          {confirmPassword && (
            <Alert status={isPasswordRight ? "success" : "error"} mt={2}>
              <AlertIcon />
              {isPasswordRight
                ? "비밀번호가 일치합니다."
                : "비밀번호가 일치하지 않습니다."}
            </Alert>
          )}
        </FormControl>

        <Flex>
          <FormControl isRequired>
            <Flex justifyContent={"space-around"} mt={4} mb={4}>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={gender === "male" ? "blue" : "gray"}
                bg={gender === "male" ? "blue.100" : "white"}
                onClick={() => handleGenderSelect("male")}
                cursor="pointer"
                _hover={{ bg: "blue.200" }}
              >
                남성
              </Button>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={gender === "female" ? "red" : "gray"}
                bg={gender === "female" ? "red.100" : "white"}
                onClick={() => handleGenderSelect("female")}
                cursor="pointer"
                _hover={{ bg: "red.200" }}
              >
                여성
              </Button>
            </Flex>
          </FormControl>
          <FormControl isRequired>
            <Flex justifyContent={"space-around"} mt={4} mb={4}>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={nationality === "korean" ? "green" : "gray"}
                bg={nationality === "korean" ? "green.100" : "white"}
                onClick={() => handleNationalitySelect("korean")}
                cursor="pointer"
                _hover={{ bg: "green.200" }}
              >
                내국인
              </Button>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={nationality === "foreigner" ? "orange" : "gray"}
                bg={nationality === "foreigner" ? "orange.100" : "white"}
                onClick={() => handleNationalitySelect("foreigner")}
                cursor="pointer"
                _hover={{ bg: "orange.200" }}
              >
                외국인
              </Button>
            </Flex>
          </FormControl>
        </Flex>

        <FormControl isRequired>
          <Input placeholder="이름" value={name} onChange={handleNameChange} />
          {!isNameValid && name && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              이름은 한글만 입력 가능합니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <Input
            placeholder="생년월일 8자리 ( YYYYMMDD )"
            value={birthDate}
            onChange={handleBirthDateChange}
          />
          {!isBirthDateValid && birthDate && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              올바르지 않은 생년월일 형식입니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <Input
            placeholder="연락처 ( '-' 제외하고 입력 )"
            type="tel"
            value={phoneNumber}
            maxLength={13}
            onChange={handlePhoneNumberChange}
          />
          {!isPhoneNumberValid && phoneNumber && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              올바르지 않은 연락처 형식입니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <Flex>
            <Flex width={"80%"} direction={"column"}>
              <Input readOnly value={postcode} placeholder="우편번호" />
              <Input readOnly value={mainAddress} placeholder="주소" />
            </Flex>
            <Box>
              <Button
                _hover={{ bgColor: "purple.500 ", color: "white" }}
                height={"100%"}
                onClick={openPostcodePopup}
              >
                주소 검색
              </Button>
            </Box>
          </Flex>
        </FormControl>
        <FormControl>
          <Input
            value={detailedAddress}
            onChange={(e) => {
              setDetailedAddress(e.target.value);
            }}
            placeholder="상세주소를 입력하세요."
          />
        </FormControl>

        <Button
          mt={5}
          width={"100%"}
          isDisabled={!isFormValid}
          cursor={!isFormValid ? "not-allowed" : "pointer"}
          _hover={
            !isFormValid
              ? { bgColor: "gray.100" }
              : { bgColor: "purple.500 ", color: "white" }
          }
          onClick={handleSubmit}
        >
          회원 가입
        </Button>
      </Box>
    </Center>
  );
}
