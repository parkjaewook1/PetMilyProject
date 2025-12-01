import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Icon,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { DiaryNavbar } from "../diaryComponent/DiaryNavbar.jsx";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import axios from "@api/axiosConfig";
import { DiaryProvider } from "../diaryComponent/DiaryContext.jsx";
import { Chart } from "chart.js/auto";
import { useTheme } from "../diaryComponent/ThemeContext.jsx";
import { ThemeSwitcher } from "../diaryComponent/ThemeSwitcher.jsx";
import DiaryVisitorCounter from "../diaryComponent/DiaryVisitorCounter.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faMusic,
  faPen,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

export function DiaryHome() {
  const { memberInfo } = useContext(LoginContext);
  const { encodedId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { theme, setTheme } = useTheme();
  const { colorMode, toggleColorMode } = useColorMode();

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
  const [isProfileExists, setIsProfileExists] = useState(false);

  const [numericDiaryId, setNumericDiaryId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [moodStats, setMoodStats] = useState([]);
  const chartRef = useRef(null);

  // 🎨 스타일 변수
  const outerBg = useColorModeValue("#aebfd3", "#2d3748");
  const dotColor = useColorModeValue("#cbd5e0", "#4a5568");
  const skinMainBg = useColorModeValue("#b2cce5", "#2d3748");
  const skinBg = useColorModeValue("white", "gray.700");
  const dashedLineColor = useColorModeValue("gray.400", "gray.500");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const chartBorderColor = useColorModeValue("white", "gray.700");
  const contentBorderColor = useColorModeValue("gray.300", "gray.600");
  const paperBorderColor = useColorModeValue("gray.400", "gray.600");
  const leftProfileBg = useColorModeValue("white", "gray.700");
  const leftProfileBorder = useColorModeValue("gray.300", "gray.600");
  const profileBoxBorder = useColorModeValue("gray.200", "gray.600");
  const profileBoxBg = useColorModeValue("gray.50", "gray.800");
  const navButtonBorderColor = useColorModeValue("#b2cce5", "gray.600");
  const mobileNavBg = useColorModeValue("white", "gray.900");
  const stickyNoteBg = useColorModeValue("#fffce0", "#4A5568");
  const stickyNoteBorderColor = useColorModeValue("#FFD700", "#5A677D");
  const inputFieldBg = useColorModeValue("whiteAlpha.900", "gray.600");
  const inputFieldBorder = useColorModeValue("orange.200", "gray.500");

  const currentPath = location.pathname.replace(/\/$/, "");
  const homePath = `/diary/${encodedId}`;
  const isRootPath = currentPath === homePath;

  // 1. 다이어리 정보 조회
  useEffect(() => {
    if (!encodedId) return;
    const validateDiaryId = async () => {
      try {
        const res = await axios.get(`/api/diary/byMember/${encodedId}`);
        setIsValidDiaryId(res.data.isValid);
        if (res.data.isValid) {
          setNumericDiaryId(res.data.id);
          setOwnerId(res.data.memberId);
          setOwnerNickname(res.data.nickname);
          setIsOwner(res.data.isOwner);
        }
      } catch (err) {
        console.error("ID 확인 실패:", err);
        setIsValidDiaryId(false);
      } finally {
        setIsLoading(false);
      }
    };
    validateDiaryId();
  }, [encodedId]);

  // 2. 기분 통계 조회
  const fetchMoodStats = async () => {
    if (!ownerId) return;
    const yearMonth = new Date().toISOString().slice(0, 7);
    try {
      const res = await axios.get(`/api/diary/mood-stats`, {
        params: { memberId: ownerId, yearMonth },
      });
      setMoodStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. 로그인 체크
  useEffect(() => {
    if (memberInfo === null) return;
    if (!memberInfo) {
      toast({ title: "로그인 필요", status: "error", duration: 3000 });
      navigate("/member/login", {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [memberInfo, toast, navigate, location.pathname]);

  // 4. 초기 데이터 로드
  useEffect(() => {
    if (ownerId) {
      fetchProfileImage();
      fetchDiaryProfile(ownerId);
      fetchMoodStats();
    }
  }, [ownerId]);

  // 5. 차트 렌더링
  useEffect(() => {
    if (moodStats.length > 0 && chartRef.current) {
      if (chartRef.current._chartInstance) {
        chartRef.current._chartInstance.destroy();
      }
      const ctx = chartRef.current.getContext("2d");
      const newChart = new Chart(ctx, {
        type: "doughnut",
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
              borderColor: chartBorderColor,
              borderWidth: 2,
            },
          ],
        },
        options: {
          cutout: "65%",
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
        },
      });
      chartRef.current._chartInstance = newChart;
    }
  }, [moodStats, chartBorderColor]);

  // ✅ [수정] 여기가 핵심입니다.
  // 백엔드에서 200 OK로 빈 값을 보내주므로, 여기서 내용물을 확인하고 처리합니다.
  const fetchDiaryProfile = async (ownerId) => {
    try {
      const response = await axios.get(`/api/diary/profile/${ownerId}`);
      const data = response.data;

      // 데이터 안에 내용이 있는지 확인
      if (
        data &&
        (data.statusMessage || data.status_message || data.introduction)
      ) {
        setProfileData({
          statusMessage: data.statusMessage || data.status_message || "",
          introduction: data.introduction || "",
        });
        setIsProfileExists(true);
      } else {
        // 200 OK지만 내용이 없음 -> 신규 유저 -> 에러 아님!
        setProfileData({ statusMessage: "", introduction: "" });
        setIsProfileExists(false);
      }
    } catch (error) {
      // 404가 아닌 진짜 서버 에러일 때만 처리
      setProfileData({ statusMessage: "", introduction: "" });
      setIsProfileExists(false);
    }
  };

  // 프로필 저장
  const handleSaveProfileData = async () => {
    try {
      if (isProfileExists) {
        await axios.put(`/api/diary/profile/${ownerId}`, {
          status_message: profileData.statusMessage,
          introduction: profileData.introduction,
        });
      } else {
        await axios.post(`/api/diary/profile`, {
          ownerId,
          status_message: profileData.statusMessage,
          introduction: profileData.introduction,
        });
        setIsProfileExists(true);
      }
      setIsEditing(false);
      toast({
        title: "저장되었습니다.",
        status: "success",
        duration: 1000,
        position: "top",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        status: "error",
        duration: 1000,
        position: "top",
      });
    }
  };

  // ✅ [원복] 원래 쓰시던 대로 돌려놨습니다.
  async function fetchProfileImage() {
    try {
      const response = await axios.get(`/api/member/${ownerId}`);
      const imageUrl = response.data.imageUrl || response.data.profileImage;
      setProfileImage(imageUrl);
    } catch (error) {
      setProfileImage(null);
    }
  }

  // ------------------------------------------------------
  if (isLoading)
    return (
      <Center minH="100vh" bg={outerBg}>
        <Spinner size="xl" />
      </Center>
    );
  if (!isValidDiaryId)
    return (
      <Center minH="100vh" bg={outerBg}>
        <Text>존재하지 않는 미니홈피</Text>
      </Center>
    );

  return (
    <DiaryProvider>
      <Center
        h={{ base: "auto", md: "100vh" }}
        minH="100vh"
        bg={outerBg}
        sx={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
        p={{ base: 0, md: 8 }}
        alignItems={{ base: "flex-start", md: "center" }}
        overflowY={{ base: "visible", md: "hidden" }}
        overflowX="hidden"
      >
        <Flex
          w="100%"
          maxW="1280px"
          h={{ base: "auto", md: "720px" }}
          bg={skinMainBg}
          borderRadius={{ base: "0", md: "20px" }}
          p={{ base: 2, md: 5 }}
          boxShadow="xl"
          position="relative"
          direction={{ base: "column", md: "row" }}
          pb={{ base: "80px", md: "5" }}
          overflow="visible"
        >
          {/* 내부 흰색 종이 영역 */}
          <Box
            flex={1}
            bg={skinBg}
            borderRadius="15px"
            border="1px solid"
            borderColor={paperBorderColor}
            p={{ base: 3, md: 5 }}
            position="relative"
            boxShadow="inset 0 0 10px rgba(0,0,0,0.05)"
            h={{ base: "auto", md: "100%" }}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={{ base: 4, md: 6 }}
              h="100%"
            >
              {/* 👈 [좌측] 프로필 영역 */}
              <VStack
                display={{ base: isRootPath ? "flex" : "none", md: "flex" }}
                w={{ base: "100%", md: "250px" }}
                h={{ base: "auto", md: "100%" }}
                bg={leftProfileBg}
                border="1px solid"
                borderColor={leftProfileBorder}
                borderRadius="10px"
                p={3}
                spacing={3}
                align="stretch"
                justify="flex-start"
                flexShrink={0}
                overflowY={{ base: "visible", md: "auto" }}
              >
                <Box
                  textAlign="center"
                  fontSize="xs"
                  color="red.400"
                  fontWeight="bold"
                  mb={1}
                >
                  {numericDiaryId && (
                    <DiaryVisitorCounter diaryId={numericDiaryId} />
                  )}
                </Box>

                <Box
                  border="1px solid"
                  borderColor={profileBoxBorder}
                  bg={profileBoxBg}
                  p={1}
                  flex={1}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                >
                  <Box
                    w="100%"
                    h="200px"
                    bg="gray.200"
                    mb={3}
                    overflow="hidden"
                    position="relative"
                    role="group"
                  >
                    <Avatar
                      src={profileImage}
                      name={ownerNickname}
                      w="100%"
                      h="100%"
                      borderRadius="0"
                      icon={<Icon as={FontAwesomeIcon} icon={faCamera} />}
                    />
                    {Number(memberInfo?.id) === ownerId && (
                      <Flex
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.500"
                        justify="center"
                        align="center"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="0.2s"
                        cursor="pointer"
                        onClick={() => {
                          navigate(`/member/page/${ownerId}`);
                        }}
                      >
                        <VStack spacing={1}>
                          <Icon
                            as={FontAwesomeIcon}
                            icon={faCamera}
                            color="white"
                            boxSize={6}
                          />
                          <Text color="white" fontSize="xs">
                            프로필 변경
                          </Text>
                        </VStack>
                      </Flex>
                    )}
                  </Box>

                  <Text
                    fontSize="xs"
                    color={subTextColor}
                    mb={4}
                    w="full"
                    textAlign="left"
                  >
                    <Icon as={FontAwesomeIcon} icon={faMusic} mr={1} /> New
                    Jeans - Hype Boy
                  </Text>
                  <Divider
                    my={1}
                    borderColor={dashedLineColor}
                    borderStyle="dashed"
                  />

                  <Box
                    w="100%"
                    p={3}
                    bg={stickyNoteBg}
                    borderRadius="md"
                    boxShadow="sm"
                    border="1px solid"
                    borderColor={stickyNoteBorderColor}
                    mt={2}
                    position="relative"
                  >
                    {isEditing ? (
                      <VStack spacing={2}>
                        <Input
                          size="sm"
                          value={profileData.statusMessage || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              statusMessage: e.target.value,
                            })
                          }
                          bg={inputFieldBg}
                          borderColor={inputFieldBorder}
                          placeholder="상태메시지"
                        />
                        <Textarea
                          size="sm"
                          rows={4}
                          value={profileData.introduction || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              introduction: e.target.value,
                            })
                          }
                          bg={inputFieldBg}
                          borderColor={inputFieldBorder}
                          placeholder="자기소개"
                        />
                        <Button
                          size="xs"
                          w="full"
                          colorScheme="orange"
                          onClick={handleSaveProfileData}
                          leftIcon={<FontAwesomeIcon icon={faSave} />}
                        >
                          저장
                        </Button>
                      </VStack>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        <Flex
                          justify="space-between"
                          align="center"
                          borderBottom="1px dashed"
                          borderColor={stickyNoteBorderColor}
                          pb={1}
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={textColor}
                          >
                            {profileData.statusMessage || "오늘의 기분은?"}
                          </Text>
                          {Number(memberInfo?.id) === ownerId && (
                            <IconButton
                              size="xs"
                              icon={<FontAwesomeIcon icon={faPen} />}
                              variant="ghost"
                              color="gray.500"
                              onClick={() => setIsEditing(true)}
                              aria-label="edit"
                            />
                          )}
                        </Flex>
                        <Text
                          fontSize="xs"
                          color={textColor}
                          minH="60px"
                          whiteSpace="pre-wrap"
                        >
                          {profileData.introduction ||
                            "작성된 자기소개가 없습니다."}
                        </Text>
                      </VStack>
                    )}
                  </Box>

                  <Box
                    w="full"
                    mt="auto"
                    pt={2}
                    borderTop="1px dashed"
                    borderColor={dashedLineColor}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      mb={1}
                      color={subTextColor}
                    >
                      Emotion History
                    </Text>
                    <Box w="60px" h="60px" mx="auto">
                      <canvas ref={chartRef}></canvas>
                    </Box>
                  </Box>
                </Box>
              </VStack>

              {/* 👉 [우측] 콘텐츠 영역 */}
              <VStack
                display="flex"
                flex={1}
                h={{ base: "auto", md: "100%" }}
                align="stretch"
                spacing={0}
                overflow="hidden"
                minH={{ base: "400px", md: "400px" }}
              >
                <Flex justify="flex-start" align="flex-end" mb={2} px={2}>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="blue.600"
                    fontFamily="'Gulim', sans-serif"
                  >
                    {ownerNickname}님의 미니홈피
                  </Text>
                </Flex>

                <Box
                  flex={1}
                  bg="white"
                  borderRadius="10px"
                  border="1px solid"
                  borderColor={contentBorderColor}
                  p={4}
                  overflowY={{
                    base: isRootPath ? "visible" : "auto",
                    md: "auto",
                  }}
                >
                  <Outlet
                    context={{
                      numericDiaryId,
                      ownerId,
                      ownerNickname,
                      isOwner,
                    }}
                  />
                </Box>
              </VStack>
            </Flex>
          </Box>

          {/* 🔖 [우측 사이드] 탭 메뉴 (PC용) */}
          <VStack
            display={{ base: "none", md: "flex" }}
            position="absolute"
            right={{ base: "10px", md: "-38px" }}
            top="80px"
            spacing={1}
            align="flex-start"
            zIndex={100}
          >
            <Box
              sx={{
                "& button": {
                  width: "70px",
                  height: "32px",
                  borderTopLeftRadius: "0",
                  borderBottomLeftRadius: "0",
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                  border: "1px solid",
                  borderColor: navButtonBorderColor,
                  mb: "2px",
                  boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "xs",
                  _hover: { transform: "translateX(3px)" },
                },
              }}
            >
              <DiaryNavbar isOwner={isOwner} type="desktop" />
            </Box>
            <VStack mt={4} spacing={1}>
              <Box bg="white" p={1} borderRadius="md" boxShadow="sm">
                <ThemeSwitcher theme={theme} setTheme={setTheme} size="xs" />
              </Box>
              <Button
                size="xs"
                h="24px"
                fontSize="10px"
                onClick={toggleColorMode}
                borderRadius="full"
                colorScheme="gray"
                bg="white"
                border="1px solid"
                borderColor="gray.300"
              >
                {colorMode === "light" ? "🌙" : "☀️"}
              </Button>
            </VStack>
          </VStack>

          {/* 모바일 하단 바 */}
          <Box
            display={{ base: "block", md: "none" }}
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={mobileNavBg}
            borderTop="1px solid"
            borderColor="gray.200"
            zIndex={1000}
            h="60px"
            px={2}
            pb="safe"
          >
            <Flex justify="space-around" align="center" h="100%">
              <Box w="100%">
                <DiaryNavbar isOwner={isOwner} type="mobile" />
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Center>
    </DiaryProvider>
  );
}
