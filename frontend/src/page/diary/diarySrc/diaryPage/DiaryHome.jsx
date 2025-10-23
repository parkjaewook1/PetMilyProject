import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  Input,
  Spinner,
  Text,
  Textarea,
  useColorMode,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { DiaryNavbar } from "../diaryComponent/DiaryNavbar.jsx";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import axios from "@api/axiosConfig";
import { DiaryProvider } from "../diaryComponent/DiaryContext.jsx";
import { Chart } from "chart.js/auto";
import { palettes } from "../diaryComponent/themePalettes.js";
import { useTheme } from "../diaryComponent/ThemeContext.jsx";
import { ThemeSwitcher } from "../diaryComponent/ThemeSwitcher.jsx";
import DiaryVisitorCounter from "../diaryComponent/DiaryVisitorCounter.jsx";

export function DiaryHome() {
  const { memberInfo } = useContext(LoginContext);
  const { encodedId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [isValidDiaryId, setIsValidDiaryId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerNickname, setOwnerNickname] = useState("");
  const [ownerId, setOwnerId] = useState(null);
  const [isOwner, setIsOwner] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState({
    statusMessage: "",
    introduction: "",
  });
  const [numericDiaryId, setNumericDiaryId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [moodStats, setMoodStats] = useState([]);
  const chartRef = useRef(null);
  const { theme, setTheme } = useTheme(); // 프리셋
  const { colorMode, toggleColorMode } = useColorMode();

  // ✅ Chakra UI 다크모드 훅
  // ✅ 현재 프리셋 + 다크모드에 맞는 색상 선택
  const currentPalette =
    palettes[theme]?.[colorMode] || palettes["default"]["light"];
  const {
    pageBg,
    containerBg,
    sidebarBg,
    sidebarBorder,
    sidebarText,
    inputBg,
    inputText,
  } = currentPalette;
  // ✅ 다이어리 PK 조회 (원래 DiaryHomeMain에 있던 로직을 끌어올림)
  useEffect(() => {
    if (!encodedId) return;

    const validateDiaryId = async () => {
      try {
        const res = await axios.get(`/api/diary/byMember/${encodedId}`);
        setIsValidDiaryId(res.data.isValid);
        console.log(res.data);
        if (res.data.isValid) {
          setNumericDiaryId(res.data.id);
          setOwnerId(res.data.memberId);
          setOwnerNickname(res.data.nickname);
          setIsOwner(res.data.isOwner);
          console.log("encodedId:", encodedId);
          console.log(res.data.ownerId);
        }
      } catch (err) {
        console.error("다이어리 ID 확인 실패:", err.response || err);
        setIsValidDiaryId(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateDiaryId();
  }, [encodedId]);

  // ✅ 통계 조회 함수
  const fetchMoodStats = async () => {
    const yearMonth = new Date().toISOString().slice(0, 7);
    try {
      const res = await axios.get(`/api/diary/mood-stats`, {
        params: { memberId: ownerId, yearMonth },
      });
      setMoodStats(res.data);
    } catch (err) {
      console.error("mood-stats error:", err);
    }
  };

  // 로그인 여부 체크
  useEffect(() => {
    if (!memberInfo) {
      toast({
        title: "로그인 회원만 가능합니다",
        description: "로그인 후 이용해주세요.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/member/login", {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [memberInfo, toast, navigate, location.pathname]);

  // ownerId 변경 시 프로필/통계 로드
  useEffect(() => {
    if (ownerId) {
      fetchProfileImage(ownerId);
      fetchDiaryProfile(ownerId);
      fetchMoodStats();
    }
  }, [ownerId]);

  // moodStats 변경 시 차트 렌더링
  useEffect(() => {
    if (moodStats.length > 0 && chartRef.current) {
      if (chartRef.current._chartInstance) {
        chartRef.current._chartInstance.destroy();
      }
      const ctx = chartRef.current.getContext("2d");
      const newChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: moodStats.map((s) => s.mood),
          datasets: [
            {
              data: moodStats.map((s) => s.count),
              backgroundColor: [
                "#FFD93D",
                "#A0AEC0",
                "#4A90E2",
                "#E53E3E",
                "#805AD5",
              ],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });
      chartRef.current._chartInstance = newChart;
    }
  }, [moodStats]);

  // // 프로필 데이터 로드
  // const fetchDiaryProfile = async (ownerId) => {
  //   try {
  //     const response = await axios.get(`/api/diary/profile/${ownerId}`);
  //     const { statusMessage, introduction } = response.data;
  //     setProfileData({
  //       statusMessage: statusMessage || "",
  //       introduction: introduction || "",
  //     });
  //   } catch (error) {
  //     setProfileData({ statusMessage: "", introduction: "" });
  //   }
  // };
  //
  // // 프로필 저장
  // const handleSaveProfileData = async () => {
  //   try {
  //     const res = await axios.get(`/api/diary/profile/${ownerId}`);
  //     if (res.status === 200) {
  //       await axios.put(`/api/diary/profile/${ownerId}`, {
  //         status_message: profileData.statusMessage,
  //         introduction: profileData.introduction,
  //       });
  //     }
  //     setIsEditing(false);
  //   } catch (error) {
  //     await axios.post(`/api/diary/profile`, {
  //       ownerId,
  //       status_message: profileData.statusMessage,
  //       introduction: profileData.introduction,
  //     });
  //     setIsEditing(false);
  //   }
  // };
  //
  // // 프로필 이미지 로드
  // async function fetchProfileImage(ownerId) {
  //   try {
  //     const res = await axios.get(`/api/member/${ownerId}`);
  //     setProfileImage(res.data.imageUrl);
  //   } catch (error) {
  //     console.error("Error fetching profile image:", error);
  //   }
  // }
  // ✅ 프로필 데이터 로드 (localStorage 기반)
  // ✅ 상태메시지/소개는 기존 서버 방식 그대로
  const fetchDiaryProfile = async (ownerId) => {
    try {
      const response = await axios.get(`/api/diary/profile/${ownerId}`);
      const { statusMessage, introduction } = response.data;
      setProfileData({
        statusMessage: statusMessage || "",
        introduction: introduction || "",
      });
    } catch (error) {
      setProfileData({ statusMessage: "", introduction: "" });
    }
  };

  const handleSaveProfileData = async () => {
    try {
      const res = await axios.get(`/api/diary/profile/${ownerId}`);
      if (res.status === 200) {
        await axios.put(`/api/diary/profile/${ownerId}`, {
          status_message: profileData.statusMessage,
          introduction: profileData.introduction,
        });
      }
      setIsEditing(false);
    } catch (error) {
      await axios.post(`/api/diary/profile`, {
        ownerId,
        status_message: profileData.statusMessage,
        introduction: profileData.introduction,
      });
      setIsEditing(false);
    }
  };

  // ✅ 프로필 이미지만 로컬스토리지 기반
  async function fetchProfileImage() {
    try {
      const savedImage = localStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      } else {
        setProfileImage(null); // 기본 아바타 표시
      }
    } catch (error) {
      console.error("로컬 프로필 이미지 불러오기 실패:", error);
      setProfileImage(null);
    }
  }

  // 로딩 처리
  if (isLoading) {
    return (
      <Center mt={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  // 잘못된 접근 처리
  if (!isValidDiaryId) {
    return (
      <Center mt={10}>
        <Text>잘못된 접근입니다.</Text>
      </Center>
    );
  }

  // 정상 UI
  return (
    <DiaryProvider>
      <Center bg={pageBg} minH="100vh">
        <Flex
          w="100%"
          h="100%"
          p={6}
          bg={pageBg}
          boxShadow="lg"
          borderRadius="md"
          position="relative"
          overflow="hidden"
          justify="center"
          gap={0} // 메인 박스와 네브바 사이 간격
        >
          {/* 메인 다이어리 박스 */}
          <Box
            w={{ base: "100%", md: "100%", lg: "100%" }}
            maxW="2000px"
            h={{ base: "600px", md: "650px", lg: "700px" }}
            border="2px solid"
            borderColor={sidebarBorder}
            borderRadius="md"
            display="flex"
            position="relative"
            bg={containerBg}
          >
            <Flex w="100%" h="100%" flexDirection="row">
              {/* 왼쪽 사이드바 */}
              <VStack
                w="25%"
                h="100%"
                flexShrink={0}
                bg={sidebarBg}
                borderRight="2px solid"
                borderColor={sidebarBorder}
                p={3}
                spacing={4}
                alignItems="center"
              >
                {/* ✅ 방문자 카운터 */}
                {numericDiaryId && (
                  <DiaryVisitorCounter diaryId={numericDiaryId} />
                )}
                <Box>
                  <Text fontSize="md" fontWeight="bold" color={sidebarText}>
                    {ownerNickname} 님
                  </Text>
                </Box>
                <Box>
                  {profileImage ? (
                    <Image
                      borderRadius="full"
                      boxSize="120px"
                      src={profileImage}
                      alt="Profile Image"
                    />
                  ) : (
                    <Avatar name={ownerNickname} size={"sm"} mr={2} />
                  )}
                </Box>

                {/* ✅ 임시 업로드 버튼 (개발용) */}
                {Number(memberInfo.id) === ownerId && (
                  <Button
                    size="xs"
                    colorScheme="teal"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          localStorage.setItem(
                            `profileImage_${memberInfo.id}`,
                            reader.result,
                          );
                          setProfileImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      };
                      input.click();
                    }}
                  >
                    프로필 이미지 업로드
                  </Button>
                )}

                {isEditing ? (
                  <>
                    <Input
                      value={profileData.statusMessage}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          statusMessage: e.target.value,
                        })
                      }
                      placeholder="상태메시지를 입력하세요"
                      size="sm"
                      h="28px"
                      bg={inputBg}
                      color={inputText}
                    />
                    <Textarea
                      value={profileData.introduction}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          introduction: e.target.value,
                        })
                      }
                      placeholder="자기소개를 입력하세요"
                      size="sm"
                      height="200px"
                      bg={inputBg}
                      color={inputText}
                      maxLength={255}
                    />
                    <HStack spacing={2} alignSelf="flex-end">
                      {Number(memberInfo.id) === ownerId && (
                        <Button
                          colorScheme="yellow"
                          size="sm"
                          onClick={handleSaveProfileData}
                        >
                          저장
                        </Button>
                      )}
                    </HStack>
                  </>
                ) : (
                  <>
                    <Text color={sidebarText}>{profileData.statusMessage}</Text>
                    <Textarea
                      value={profileData.introduction || "자기소개가 없습니다."}
                      fontSize="sm"
                      h="200px"
                      readOnly
                      bg={inputBg}
                      color={inputText}
                    />
                    <HStack spacing={2} alignSelf="flex-end">
                      {Number(memberInfo.id) === ownerId && (
                        <Button
                          colorScheme="yellow"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          수정
                        </Button>
                      )}
                    </HStack>
                  </>
                )}

                {/* 이번 달 기분 */}
                <Box w="70%" mt={4}>
                  <Text fontWeight="bold" mb={2} color={sidebarText}>
                    이번 달 기분
                  </Text>
                  <canvas ref={chartRef} width="180" height="180"></canvas>
                </Box>
              </VStack>

              {/* 오른쪽 메인 컨텐츠 */}
              <Box w="75%" h="100%" position="relative">
                <Box
                  w="100%"
                  h="100%"
                  border="1px solid"
                  borderColor={sidebarBorder}
                  borderRadius="md"
                  overflowY="auto"
                  bg={containerBg}
                  pt={4}
                  pb={4}
                  pr={6}
                  pl={6}
                >
                  {/* ✅ Outlet에 context 전달 */}
                  <Outlet
                    context={{
                      numericDiaryId,
                      ownerId,
                      ownerNickname,
                      isOwner,
                    }}
                  />
                </Box>
              </Box>
            </Flex>
          </Box>

          {/* 네비게이션 바 → 독립형으로 메인 박스 옆에 붙임 */}
          <Box w="90px">
            <Flex direction="column" align="flex-end" h="100%">
              <DiaryNavbar isOwner={isOwner} />
              <Box mt="auto" mb={10}>
                <VStack spacing={2} align="flex-end">
                  <ThemeSwitcher
                    theme={theme}
                    setTheme={setTheme}
                    size="sm"
                    w="75px"
                  />
                  <Button size="sm" onClick={toggleColorMode}>
                    {colorMode === "light" ? "🌙 Dark" : "☀️ Light"}
                  </Button>
                </VStack>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Center>
    </DiaryProvider>
  );
}
