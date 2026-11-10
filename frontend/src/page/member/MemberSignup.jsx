import { accountBoardPageStyle } from "../../design/accountBoardStyles.js";
import React, { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
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

  // ✅ [수정] 이메일 중복확인
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

    const params = new URLSearchParams();
    params.append("username", username);
    params.append("email", username);

    axios
      .get(`/api/member/check?${params.toString()}`)
      .then((res) => {
        // 백엔드가 true를 반환하면 res.data는 true입니다.
        console.log("이메일 체크 응답 데이터:", res.data);

        // ✅ [수정 포인트] 백엔드에서 true(Boolean)를 주므로 === true 로 비교
        const isAvailable = res.data === true;

        if (isAvailable) {
          toast({
            status: "success",
            description: "사용 가능한 이메일입니다.",
            position: "top",
            duration: 1000,
          });
          setIsUsernameConfirmed(true);
        } else {
          // 혹시 200 OK인데 false가 온 경우
          toast({
            status: "warning",
            description: "이미 사용 중인 이메일입니다.",
            position: "top",
            duration: 1000,
          });
          setIsUsernameConfirmed(false);
        }
      })
      .catch(() => {
        // 백엔드가 409 Conflict를 보내면 catch로 빠집니다.
        console.error("회원 요청에 실패했습니다.");
        toast({
          status: "warning", // 이미 사용 중인 경우이므로 warning
          description: "이미 사용 중인 이메일입니다.",
          position: "top",
          duration: 1000,
        });
        setIsUsernameConfirmed(false);
      });
  }

  // ✅ [수정] 닉네임 중복확인
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

        // ✅ [수정 포인트] 백엔드에서 true(Boolean)를 주므로 === true 로 비교
        const isAvailable = res.data === true;

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
      .catch(() => {
        // 백엔드가 409 Conflict를 보내면 catch로 빠집니다.
        console.error("회원 요청에 실패했습니다.");
        toast({
          status: "warning",
          description: "이미 사용 중인 닉네임입니다.",
          position: "top",
          duration: 1000,
        });
        setIsNicknameConfirmed(false);
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
    <Center
      as="main"
      className="ab-page ab-account ab-membersignup"
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
        <Text className="ab-eyebrow">PETMILY / ACCOUNT</Text>
        <Box
          as="h1"
          className="ab-heading"
          mb={10}
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
        >
          회원가입
        </Box>
        <Text className="ab-description">
          필수 정보를 입력하고 중복 확인을 완료해 주세요.
        </Text>
        <FormControl isRequired>
          <FormLabel variant="journal" htmlFor="membersignup-field-1">
            이메일
          </FormLabel>
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
              id="membersignup-field-1"
              variant="journal"
            />
            <InputRightElement w={"100px"} mr={1}>
              {isUsernameConfirmed ? (
                <Button
                  size={"sm"}
                  variant="journalOutline"
                  onClick={handleReenterUsername}
                  className="ab-inline-action"
                  aria-label="이메일 다시 입력"
                >
                  <FontAwesomeIcon icon={faHammer} />
                </Button>
              ) : (
                <Button
                  size={"sm"}
                  onClick={handleCheckUsername}
                  isDisabled={!isUsernameValid}
                  cursor={!isUsernameValid ? "not-allowed" : "pointer"}
                  variant="journalOutline"
                  className="ab-inline-action"
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
          <FormLabel variant="journal" htmlFor="membersignup-field-2">
            닉네임
          </FormLabel>
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
              id="membersignup-field-2"
              variant="journal"
            />
            <InputRightElement w={"100px"} mr={1}>
              {isNicknameConfirmed ? (
                <Button
                  size={"sm"}
                  variant="journalOutline"
                  onClick={handleReenterNickname}
                  className="ab-inline-action"
                  aria-label="닉네임 다시 입력"
                >
                  <FontAwesomeIcon icon={faHammer} />
                </Button>
              ) : (
                <Button
                  size={"sm"}
                  onClick={handleCheckNickname}
                  isDisabled={!isNicknameValid}
                  cursor={!isNicknameValid ? "not-allowed" : "pointer"}
                  variant="journalOutline"
                  className="ab-inline-action"
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
          <FormLabel variant="journal" htmlFor="membersignup-field-3">
            비밀번호
          </FormLabel>
          <InputGroup>
            <Input
              placeholder="비밀번호"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => {
                setPassword(e.target.value.trim());
                validatePassword(e.target.value);
              }}
              id="membersignup-field-3"
              variant="journal"
            />
            <InputRightElement width="4.5rem">
              {password && (
                <Button
                  h="1.75rem"
                  size="sm"
                  onClick={handleClickPassword}
                  variant="journalOutline"
                  className="ab-inline-action"
                >
                  {showPassword ? "숨기기" : "보기"}
                </Button>
              )}
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl isRequired className="ab-confirm-field">
          <FormLabel variant="journal" htmlFor="membersignup-field-4">
            비밀번호 확인
          </FormLabel>
          <InputGroup>
            {password && (
              <Input
                placeholder="비밀번호 확인"
                value={confirmPassword}
                type={showPassword ? "text" : "password"}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim());
                }}
                id="membersignup-field-4"
                variant="journal"
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
          <FormControl isRequired className="ab-choice-control">
            <FormLabel variant="journal">성별</FormLabel>

            <Flex justifyContent={"space-around"} mt={4} mb={4}>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={
                  gender === "male" ? "journal.brand" : "journal.line"
                }
                bg={gender === "male" ? "journal.hover" : "transparent"}
                onClick={() => handleGenderSelect("male")}
                cursor="pointer"
                _hover={{ bg: "journal.hover" }}
                aria-pressed={gender === "male"}
                color="journal.brand"
                variant="journalOutline"
              >
                남성
              </Button>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={
                  gender === "female" ? "journal.brand" : "journal.line"
                }
                bg={gender === "female" ? "journal.hover" : "transparent"}
                onClick={() => handleGenderSelect("female")}
                cursor="pointer"
                _hover={{ bg: "journal.hover" }}
                aria-pressed={gender === "female"}
                color="journal.brand"
                variant="journalOutline"
              >
                여성
              </Button>
            </Flex>
          </FormControl>
          <FormControl isRequired className="ab-choice-control">
            <FormLabel variant="journal">국적</FormLabel>

            <Flex justifyContent={"space-around"} mt={4} mb={4}>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={
                  nationality === "korean" ? "journal.brand" : "journal.line"
                }
                bg={nationality === "korean" ? "journal.hover" : "transparent"}
                onClick={() => handleNationalitySelect("korean")}
                cursor="pointer"
                _hover={{ bg: "journal.hover" }}
                aria-pressed={nationality === "korean"}
                color="journal.brand"
                variant="journalOutline"
              >
                내국인
              </Button>
              <Button
                w="100px"
                h="40px"
                border="1px solid"
                borderColor={
                  nationality === "foreigner" ? "journal.brand" : "journal.line"
                }
                bg={
                  nationality === "foreigner" ? "journal.hover" : "transparent"
                }
                onClick={() => handleNationalitySelect("foreigner")}
                cursor="pointer"
                _hover={{ bg: "journal.hover" }}
                aria-pressed={nationality === "foreigner"}
                color="journal.brand"
                variant="journalOutline"
              >
                외국인
              </Button>
            </Flex>
          </FormControl>
        </Flex>

        <FormControl isRequired>
          <FormLabel variant="journal" htmlFor="membersignup-field-5">
            이름
          </FormLabel>
          <Input
            placeholder="이름"
            value={name}
            onChange={handleNameChange}
            id="membersignup-field-5"
            variant="journal"
          />
          {!isNameValid && name && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              이름은 한글만 입력 가능합니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <FormLabel variant="journal" htmlFor="membersignup-field-6">
            생년월일
          </FormLabel>
          <Input
            placeholder="생년월일 8자리 ( YYYYMMDD )"
            value={birthDate}
            onChange={handleBirthDateChange}
            id="membersignup-field-6"
            variant="journal"
          />
          {!isBirthDateValid && birthDate && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              올바르지 않은 생년월일 형식입니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired>
          <FormLabel variant="journal" htmlFor="membersignup-field-7">
            연락처
          </FormLabel>
          <Input
            placeholder="연락처 ( '-' 제외하고 입력 )"
            type="tel"
            value={phoneNumber}
            maxLength={13}
            onChange={handlePhoneNumberChange}
            id="membersignup-field-7"
            variant="journal"
          />
          {!isPhoneNumberValid && phoneNumber && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              올바르지 않은 연락처 형식입니다.
            </Alert>
          )}
        </FormControl>

        <FormControl isRequired className="ab-address-field">
          <FormLabel variant="journal" htmlFor="membersignup-field-8">
            주소
          </FormLabel>
          <Flex>
            <Flex width={"80%"} direction={"column"}>
              <Input
                readOnly
                value={postcode}
                placeholder="우편번호"
                id="membersignup-field-8"
                variant="journal"
              />
              <Input
                readOnly
                value={mainAddress}
                placeholder="주소"
                id="membersignup-field-8-0"
                aria-label="주소"
                variant="journal"
              />
            </Flex>
            <Box>
              <Button
                height={"100%"}
                onClick={openPostcodePopup}
                variant="journalOutline"
              >
                주소 검색
              </Button>
            </Box>
          </Flex>
        </FormControl>
        <FormControl>
          <FormLabel variant="journal" htmlFor="membersignup-field-9">
            상세주소
          </FormLabel>
          <Input
            value={detailedAddress}
            onChange={(e) => {
              setDetailedAddress(e.target.value);
            }}
            placeholder="상세주소를 입력하세요."
            id="membersignup-field-9"
            variant="journal"
          />
        </FormControl>

        <Button
          mt={5}
          width={"100%"}
          isDisabled={!isFormValid}
          cursor={!isFormValid ? "not-allowed" : "pointer"}
          onClick={handleSubmit}
          variant="journal"
        >
          회원 가입
        </Button>
      </Box>
    </Center>
  );
}
