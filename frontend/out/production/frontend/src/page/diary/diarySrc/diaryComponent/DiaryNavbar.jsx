import { useContext, useEffect, useState } from "react";
import { Button, useColorModeValue, VStack } from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import axios from "@api/axiosConfig";
import {
  extractUserIdFromDiaryId,
  generateDiaryId,
} from "../../../../util/util";
import { ThemeSwitcher } from "./ThemeSwitcher.jsx";

export function DiaryNavbar({ isOwner }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberInfo } = useContext(LoginContext);
  const { encodedId } = useParams();
  const friendId = extractUserIdFromDiaryId(encodedId);
  console.log("다이어리 아이디입니다." + encodedId);

  const [isFriend, setIsFriend] = useState(false);
  const [activeButton, setActiveButton] = useState(location.pathname);

  // ✅ 테마 상태
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "default",
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // 내 다이어리 여부는 이미 props로 전달받음 → 여기서 다시 set할 필요 없음
    if (!isOwner) {
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
    setActiveButton(path);
    navigate(path);
  };

  // ✅ 테마별 색상 팔레트
  const palettes = {
    default: { active: "blue.400", inactive: "blue.200" },
    pastel: { active: "pink.300", inactive: "pink.100" },
    mono: { active: "gray.600", inactive: "gray.300" },
    vivid: { active: "purple.500", inactive: "purple.300" },
  };

  const { active, inactive } = palettes[theme];

  return (
    <VStack
      spacing={2}
      bg={useColorModeValue("white", "gray.700")}
      p={2}
      borderRadius="md"
      w="100%"
    >
      {/* 테마 선택 드롭다운 */}
      <ThemeSwitcher theme={theme} setTheme={setTheme} />

      <Button
        onClick={() => handleButtonClick(`/diary/${encodedId}`)}
        w="100%"
        bg={activeButton === `/diary/${encodedId}` ? active : inactive}
      >
        홈
      </Button>

      <Button
        onClick={() => handleButtonClick(`/diary/${encodedId}/comment`)}
        w="100%"
        bg={activeButton === `/diary/${encodedId}/comment` ? active : inactive}
      >
        방명록
      </Button>

      <Button
        onClick={() => handleButtonClick(`/diary/${encodedId}/board/list`)}
        w="100%"
        bg={
          activeButton === `/diary/${encodedId}/board/list` ? active : inactive
        }
      >
        일기장
      </Button>

      {isOwner && (
        <Button
          onClick={() => handleButtonClick(`/diary/${encodedId}/calendar`)}
          w="100%"
          bg={
            activeButton === `/diary/${encodedId}/calendar` ? active : inactive
          }
        >
          캘린더
        </Button>
      )}

      {!isFriend && !isOwner && (
        <Button size="sm" onClick={addFriend} w="100%">
          친구 추가
        </Button>
      )}

      {!isOwner && (
        <Button
          onClick={() =>
            handleButtonClick(`/diary/${generateDiaryId(memberInfo.id)}`)
          }
          w="100%"
          bg={
            activeButton === `/diary/${generateDiaryId(memberInfo.id)}`
              ? active
              : inactive
          }
        >
          MyHome
        </Button>
      )}
    </VStack>
  );
}
