import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Img,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "./LoginProvider.jsx";
import { useNavigate } from "react-router-dom";
import axios from "@api/axiosConfig";
import { generateDiaryId } from "../util/util.jsx";
import BoardMenu from "./BoardMenu.jsx";
import { ChevronDownIcon, HamburgerIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faMapLocationDot,
  faPencil,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";

const NavButton = ({ icon, children, onClick, to }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };

  return (
    <Button
      variant="ghost"
      leftIcon={icon ? <FontAwesomeIcon icon={icon} /> : null}
      onClick={handleClick}
      px={4}
      py={5}
      rounded={"full"}
      fontWeight="bold"
      fontSize="md"
      color="gray.600"
      _hover={{
        bg: "purple.50",
        color: "purple.600",
        transform: "translateY(-2px)",
        shadow: "sm",
      }}
      transition="all 0.2s"
    >
      {children}
    </Button>
  );
};

export function Navbar() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const { memberInfo, setMemberInfo } = useContext(LoginContext);

  const [myProfileImage, setMyProfileImage] = useState(null);

  const access = memberInfo?.access || null;
  const nickname = memberInfo?.nickname || null;

  const isLoggedIn = Boolean(access);
  const diaryId = isLoggedIn ? generateDiaryId(memberInfo.id) : null;

  // ✅ [핵심 수정] 프로필 이미지 경로 처리 로직 강화
  useEffect(() => {
    if (memberInfo?.id) {
      axios
        .get(`/api/member/${memberInfo.id}`)
        .then((res) => {
          const img = res.data.profileImage || res.data.imageUrl;

          if (img) {
            // 1. 외부 링크(http)면 그대로 사용
            if (img.startsWith("http")) {
              setMyProfileImage(img);
            }
            // 2. 🚨 이미 백엔드에서 '/uploads/'를 붙여줬다면 그대로 사용 (중복 방지)
            else if (img.startsWith("/uploads/")) {
              setMyProfileImage(img);
            }
            // 3. 파일명만 왔다면 앞에 붙여줌
            else {
              setMyProfileImage(`/uploads/${img}`);
            }
          } else {
            setMyProfileImage(null);
          }
        })
        .catch((err) => console.error("Navbar 프로필 로드 실패:", err));
    }
  }, [memberInfo]);

  const handleLogout = async () => {
    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      const response = await axios.post("/api/member/logout", formData, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setMemberInfo(null);
        localStorage.removeItem("memberInfo");
        navigate("/member/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleOpenDiary = () => {
    const url = `/diary/${diaryId}`;
    const windowFeatures = "width=1200,height=800,left=100,top=100";
    window.open(url, "_blank", windowFeatures);
  };

  useEffect(() => {
    document.body.style.paddingTop = isLargerThan768 ? "100px" : "80px";
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, [isLargerThan768]);

  return (
    <Flex
      as="nav"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      h={{ base: "60px", md: "80px" }}
      alignItems="center"
      justifyContent="center"
      px={4}
      bg="rgba(248, 248, 255, 0.85)"
      backdropFilter="blur(12px)"
      boxShadow="sm"
      borderBottom="1px solid"
      borderColor="purple.100"
      transition="all 0.3s"
    >
      <Flex
        w="100%"
        maxW="1200px"
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack spacing={{ base: 2, md: 6 }} alignItems="center">
          <Box
            cursor="pointer"
            onClick={() => navigate("/")}
            w={{ base: "100px", md: "130px" }}
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <Img
              src={"/img/petmily-logo.png"}
              alt="Petmily Logo"
              w="100%"
              h="auto"
            />
          </Box>

          {isLargerThan768 && (
            <HStack
              as={"nav"}
              spacing={1}
              display={{ base: "none", md: "flex" }}
            >
              <Box
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <BoardMenu isOpen={isOpen} onOpen={onOpen} onClose={onClose} />
              </Box>

              <NavButton to="/place/map" icon={faMapLocationDot}>
                병원 찾기
              </NavButton>

              <NavButton
                to="/board/list?boardType=반려동물 정보"
                icon={faBookOpen}
              >
                가이드
              </NavButton>

              <NavButton to="/aichat" icon={faStethoscope}>
                닥터 AI
              </NavButton>
            </HStack>
          )}
        </HStack>

        <HStack spacing={3}>
          {isLargerThan768 ? (
            <>
              <Button
                leftIcon={<FontAwesomeIcon icon={faPencil} />}
                bgGradient="linear(to-r, purple.400, purple.500)"
                color="white"
                variant="solid"
                size="sm"
                onClick={() => navigate("/board/write")}
                borderRadius="full"
                px={5}
                boxShadow="md"
                _hover={{
                  bgGradient: "linear(to-r, purple.500, purple.600)",
                  transform: "translateY(-1px)",
                  boxShadow: "lg",
                }}
                _active={{ transform: "translateY(0)" }}
              >
                새 글쓰기
              </Button>

              {isLoggedIn ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={"full"}
                    variant={"ghost"}
                    cursor={"pointer"}
                    minW={0}
                    rightIcon={<ChevronDownIcon color="gray.400" />}
                    _hover={{ bg: "purple.50" }}
                    pl={2}
                    pr={4}
                  >
                    <HStack spacing={2}>
                      {/* ✅ Avatar에 이미지 적용 */}
                      <Avatar
                        size={"sm"}
                        src={myProfileImage}
                        name={nickname}
                        border="2px solid white"
                        boxShadow="base"
                      />
                      <Text fontWeight="bold" color="gray.700" fontSize="sm">
                        {nickname}님
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList
                    zIndex={1001}
                    border="none"
                    boxShadow="xl"
                    borderRadius="xl"
                    p={2}
                  >
                    <MenuItem
                      onClick={() => navigate(`/member/page/${memberInfo.id}`)}
                      borderRadius="md"
                      fontWeight="medium"
                    >
                      👤 마이페이지
                    </MenuItem>
                    <MenuItem
                      onClick={handleOpenDiary}
                      borderRadius="md"
                      fontWeight="medium"
                    >
                      📒 다이어리 열기
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      onClick={handleLogout}
                      color="red.500"
                      fontWeight="bold"
                      borderRadius="md"
                      _hover={{ bg: "red.50" }}
                    >
                      Log out
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button
                  fontSize={"sm"}
                  fontWeight="bold"
                  color={"purple.600"}
                  bg={"white"}
                  border="1px solid"
                  borderColor="purple.200"
                  _hover={{
                    bg: "purple.50",
                    borderColor: "purple.400",
                  }}
                  onClick={() => navigate("/member/login")}
                  size="sm"
                  px={6}
                  borderRadius="full"
                >
                  Login
                </Button>
              )}
            </>
          ) : (
            <>
              <IconButton
                icon={<FontAwesomeIcon icon={faPencil} />}
                variant="ghost"
                colorScheme="purple"
                onClick={() => navigate("/board/write")}
                aria-label="Write"
                size="md"
                isRound
              />
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<HamburgerIcon w={6} h={6} />}
                  variant="ghost"
                  aria-label="Options"
                  size="md"
                  isRound
                />
                <MenuList
                  zIndex={1001}
                  border="none"
                  boxShadow="dark-lg"
                  borderRadius="xl"
                >
                  <MenuItem
                    fontWeight="bold"
                    onClick={() => navigate("/")}
                    py={3}
                  >
                    🏠 홈
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/place/map")} py={3}>
                    🏥 동물병원 찾기
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      navigate("/board/list?boardType=반려동물 정보")
                    }
                    py={3}
                  >
                    📖 반려인 가이드
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/aichat")} py={3}>
                    🩺 AI 수의사
                  </MenuItem>
                  <MenuDivider />
                  {isLoggedIn ? (
                    <>
                      <MenuItem
                        fontWeight="bold"
                        color="purple.600"
                        cursor="default"
                        bg="purple.50"
                      >
                        👋 {nickname}님
                      </MenuItem>
                      <MenuItem
                        onClick={() =>
                          navigate(`/member/page/${memberInfo.id}`)
                        }
                      >
                        마이페이지
                      </MenuItem>
                      <MenuItem onClick={handleOpenDiary}>다이어리</MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        color="red.500"
                        fontWeight="bold"
                      >
                        로그아웃
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem
                      onClick={() => navigate("/member/login")}
                      fontWeight="bold"
                      color="purple.600"
                    >
                      로그인
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </>
          )}
        </HStack>
      </Flex>
    </Flex>
  );
}
