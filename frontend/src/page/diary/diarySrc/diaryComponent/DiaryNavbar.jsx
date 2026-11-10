import { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import axios from "@api/axiosConfig";
import {
  extractUserIdFromDiaryId,
  generateDiaryId,
} from "../../../../util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCalendarDays,
  faHouse,
  faPenNib,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryNavbar({ isOwner, type = "desktop" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberInfo } = useContext(LoginContext);
  const { encodedId } = useParams();
  const friendId = extractUserIdFromDiaryId(encodedId);

  const [isFriend, setIsFriend] = useState(false);
  const currentPath = location.pathname;

  // 색상 변수
  const activeBgColor = useColorModeValue("white", "gray.800");
  const inactiveBgColor = useColorModeValue("#9ca3af", "#4a5568");
  const activeTextColor = useColorModeValue("#2d3748", "white");
  const inactiveTextColor = useColorModeValue("white", "gray.200");
  const friendButtonBg = useColorModeValue("#ffb6c1", "#e53e3e");

  const mobileActiveColor = useColorModeValue("black", "white");
  const mobileInactiveColor = useColorModeValue("gray.400", "gray.500");

  useEffect(() => {
    if (!isOwner && memberInfo?.id) {
      checkFriendship();
    }
  }, [memberInfo, friendId, isOwner]);

  const checkFriendship = async () => {
    if (memberInfo && friendId && memberInfo.id !== friendId) {
      try {
        const response = await axios.get("/api/friends/check", {
          params: { memberId: memberInfo.id, friendId: friendId },
        });
        setIsFriend(response.data);
      } catch (error) {
        console.error("Error checking friendship:", error);
      }
    }
  };

  const addFriend = async () => {
    if (memberInfo && memberInfo.id !== friendId && !isFriend) {
      try {
        await axios.post("/api/friends/add", {
          memberId: memberInfo.id,
          friendId: friendId,
        });
        setIsFriend(true);
      } catch (error) {
        console.error("Error adding friend:", error);
      }
    }
  };

  const handleButtonClick = (path) => {
    navigate(path);
  };

  const navItems = [
    {
      path: `/diary/${encodedId}`,
      label: "홈",
      icon: faHouse,
    },
    {
      path: `/diary/${encodedId}/board/list`,
      label: "일기",
      icon: faBook,
    },
    {
      path: `/diary/${encodedId}/comment`,
      label: "방명록",
      icon: faPenNib,
    },
    ...(isOwner
      ? [
          {
            path: `/diary/${encodedId}/calendar`,
            label: "캘린더",
            icon: faCalendarDays,
          },
        ]
      : []),
  ];

  // 🖥️ [Desktop] 스타일 수정
  const getDesktopStyle = (path, isSpecial = false) => {
    // The home bookmark is exact; child bookmarks include their own detail routes.
    const isActive =
      path === `/diary/${encodedId}`
        ? currentPath === path
        : currentPath === path || currentPath.startsWith(path + "/");

    return {
      bg: isSpecial
        ? friendButtonBg
        : isActive
          ? activeBgColor
          : inactiveBgColor,
      color: isSpecial
        ? "white"
        : isActive
          ? activeTextColor
          : inactiveTextColor,
      _hover: {
        bg: isSpecial ? "#ff90a0" : activeBgColor,
        color: isSpecial ? "white" : activeTextColor,
        transform: "translateX(3px)",
      },

      // ✅ [핵심 수정] Flex 정렬 및 간격 직접 제어
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px", // 👈 아이콘과 글자 사이 간격 (원하는 만큼 줄이세요: 2px, 3px...)

      pl: 0,
      pr: 0, // 좌우 패딩 제거해서 중앙 정렬 확실하게

      fontSize: "11px",
      fontWeight: "bold",

      w: "100%",
      h: "100%",
      borderRadius: "0",
      borderTopRightRadius: "10px",
      borderBottomRightRadius: "10px",
      boxShadow: isActive ? "2px 2px 5px rgba(0,0,0,0.1)" : "none",
      border: "1px solid",
      borderColor: isActive
        ? useColorModeValue("#b2cce5", "gray.600")
        : "transparent",
      borderLeft: "none",
      mb: 1,
      transition: "all 0.2s",
    };
  };

  const getMobileStyle = (path) => {
    const isActive = path.endsWith(encodedId)
      ? currentPath === path
      : currentPath.startsWith(path);

    return {
      bg: "transparent",
      color: isActive ? mobileActiveColor : mobileInactiveColor,
      _hover: { bg: "transparent" },
      _active: { bg: "transparent" },
      flexDirection: "column",
      gap: 0,
      h: "100%",
      fontSize: "xs",
      flex: 1,
      borderRadius: 0,
    };
  };

  // 🖥️ PC 렌더링 (수정됨)
  if (type === "desktop") {
    return (
      <VStack spacing={0} align="stretch" w="100%" bg="transparent">
        {navItems.map((item) => (
          <Button
            key={item.path}
            {...getDesktopStyle(item.path)}
            aria-current={
              (
                item.path === `/diary/${encodedId}`
                  ? currentPath === item.path
                  : item.path === `/diary/${encodedId}/board/list`
                    ? currentPath.startsWith(`/diary/${encodedId}/board/`)
                    : currentPath === item.path ||
                      currentPath.startsWith(item.path + "/")
              )
                ? "page"
                : undefined
            }
            onClick={() => handleButtonClick(item.path)}
            // 🚨 leftIcon 속성 제거! (이게 여백의 원인이었음)
          >
            {/* ✅ 직접 배치해서 간격 제어 */}
            <Icon as={FontAwesomeIcon} icon={item.icon} boxSize="10px" />
            <Text as="span">{item.label}</Text>
          </Button>
        ))}

        {/* 친구 추가 버튼 */}
        {!isFriend && !isOwner && memberInfo && (
          <Button {...getDesktopStyle("#", true)} onClick={addFriend}>
            <Icon as={FontAwesomeIcon} icon={faUserPlus} boxSize="10px" />
            <Text as="span">친구신청</Text>
          </Button>
        )}

        {/* My Home 이동 */}
        {!isOwner && memberInfo && (
          <Button
            {...getDesktopStyle(`/diary/${generateDiaryId(memberInfo.id)}`)}
            variant="solid"
            mt={2}
            bg={inactiveBgColor}
            color={inactiveTextColor}
            _hover={{
              bg: activeBgColor,
              color: activeTextColor,
              transform: "translateX(3px)",
            }}
          >
            <Text as="span" fontSize="10px">
              My Home
            </Text>
          </Button>
        )}
      </VStack>
    );
  }

  // 📱 모바일 렌더링 (기존 유지)
  return (
    <HStack w="100%" h="100%" justify="space-around" spacing={0} pb={2}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          {...getMobileStyle(item.path)}
          aria-current={
            (
              item.path === `/diary/${encodedId}`
                ? currentPath === item.path
                : item.path === `/diary/${encodedId}/board/list`
                  ? currentPath.startsWith(`/diary/${encodedId}/board/`)
                  : currentPath === item.path ||
                    currentPath.startsWith(item.path + "/")
            )
              ? "page"
              : undefined
          }
          onClick={() => handleButtonClick(item.path)}
        >
          <Icon as={FontAwesomeIcon} icon={item.icon} boxSize={5} mb={1} />
          <Text fontSize="10px">{item.label}</Text>
        </Button>
      ))}

      {!isFriend && !isOwner && memberInfo && (
        <Button
          {...getMobileStyle("#")}
          onClick={addFriend}
          color={friendButtonBg}
        >
          <Icon as={FontAwesomeIcon} icon={faUserPlus} boxSize={5} mb={1} />
          <Text fontSize="10px">친구추가</Text>
        </Button>
      )}

      {!isOwner && memberInfo && (
        <Button
          {...getMobileStyle(`/diary/${generateDiaryId(memberInfo.id)}`)}
          onClick={() =>
            handleButtonClick(`/diary/${generateDiaryId(memberInfo.id)}`)
          }
        >
          <Box
            border="1px solid"
            borderColor="gray.400"
            borderRadius="full"
            px={1}
          >
            <Text fontSize="xs" fontWeight="bold">
              MY
            </Text>
          </Box>
          <Text fontSize="10px" mt={1}>
            내 홈피
          </Text>
        </Button>
      )}
    </HStack>
  );
}
