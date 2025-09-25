import React, { useContext, useEffect, useRef, useState } from "react";
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
  useToast,
  VStack,
} from "@chakra-ui/react";
import { DiaryNavbar } from "../diaryComponent/DiaryNavbar.jsx";
import { LoginContext } from "../../../../component/LoginProvider.jsx";
import axios from "@api/axiosConfig";
import { extractUserIdFromDiaryId } from "../../../../util/util.jsx";
import { DiaryProvider } from "../diaryComponent/DiaryContext.jsx";
import { Chart } from "chart.js/auto";

export function DiaryHome() {
  const { memberInfo } = useContext(LoginContext);
  const { diaryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [isValidDiaryId, setIsValidDiaryId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerNickname, setOwnerNickname] = useState("");
  const [ownerId, setOwnerId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState({
    statusMessage: "",
    introduction: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [moodStats, setMoodStats] = useState([]);
  const chartRef = useRef(null);

  // ✅ 통계 조회 함수 분리
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

  // 1) 로그인 여부 체크 → 없으면 toast + 이전 페이지 이동
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
  }, [memberInfo, toast, navigate, location.state]);

  // 2) 다이어리 ID 검증 (로그인된 경우만)
  useEffect(() => {
    console.log("diaryId:", diaryId); // diaryID
    const saved = localStorage.getItem("memberInfo");
    const token = saved ? JSON.parse(saved).access : null;
    if (!token) {
      console.log("토큰 없습니다.");
      setIsLoading(false);
      return;
    } // 토큰 없으면 호출 안 함

    const validateDiaryId = async () => {
      try {
        const response = await axios.get(
          `/api/member/validateDiaryId/${diaryId}`,
        );

        console.log("API response:", response.data);
        setIsValidDiaryId(response.data.isValid);
        console.log("full response:", response.data);
        if (response.data.isValid) {
          setOwnerNickname(response.data.nickname);
          setOwnerId(response.data.ownerId);
        }
      } catch (error) {
        console.error("Error validating diary ID:", error);
        setIsValidDiaryId(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateDiaryId();
  }, [diaryId]);

  // 3) ownerId 변경 시 프로필 이미지, 프로필 데이터, mood 통계 로드
  useEffect(() => {
    if (ownerId) {
      fetchProfileImage(ownerId);
      fetchDiaryProfile(ownerId);

      const yearMonth = new Date().toISOString().slice(0, 7);
      axios
        .get(`/api/diary/mood-stats?memberId=${ownerId}&yearMonth=${yearMonth}`)
        .then((res) => setMoodStats(res.data))
        .catch((err) => console.error("mood-stats error:", err));
    }
  }, [ownerId]);

  // 4) moodStats 변경 시 차트 렌더링
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
        options: {
          plugins: {
            legend: { position: "bottom" },
          },
        },
      });
      chartRef.current._chartInstance = newChart;
    }
  }, [moodStats]);

  // 프로필 데이터 로드
  const fetchDiaryProfile = async (ownerId) => {
    try {
      const response = await axios.get(`/api/diary/profile/${ownerId}`);
      const { status_message, introduction } = response.data;
      setProfileData({
        statusMessage: status_message || "",
        introduction: introduction || "",
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setProfileData({ statusMessage: "", introduction: "" });
      } else {
        console.error("Error fetching diary profile:", error);
      }
    }
  };

  // 프로필 저장
  const handleSaveProfileData = async () => {
    const data = {
      ownerId: extractUserIdFromDiaryId(diaryId),
      status_message: profileData.statusMessage,
      introduction: profileData.introduction,
    };

    try {
      const checkProfileResponse = await axios.get(
        `/api/diary/profile/${ownerId}`,
      );
      if (checkProfileResponse.status === 200) {
        await axios.put(`/api/diary/profile/${ownerId}`, data);
      } else {
        await axios.post(`/api/diary/profile`, data);
      }
      setIsEditing(false);
    } catch (error) {
      if (error.response?.status === 404) {
        await axios.post(`/api/diary/profile`, data);
        setIsEditing(false);
      } else {
        console.error("Error saving profile data:", error);
      }
    }
  };

  // 프로필 이미지 로드
  async function fetchProfileImage(ownerId) {
    try {
      const res = await axios.get(`/api/member/${ownerId}`);
      setProfileImage(res.data.imageUrl);
    } catch (error) {
      console.error("Error fetching profile image:", error.response || error);
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
        <Text fontSize="xl" fontWeight="bold" color="red.500">
          잘못된 접근입니다.
        </Text>
      </Center>
    );
  }

  // 정상 UI
  return (
    <DiaryProvider>
      <Center bg="gray.100" minH="100vh">
        <Flex
          w="100%"
          h="100%"
          p={6}
          bg="purple.100"
          boxShadow="lg"
          borderRadius="md"
          position="relative"
          overflow="hidden"
        >
          <Box
            w="1300px"
            h="800px"
            border="2px solid #ccc"
            borderRadius="md"
            overflow="hidden"
            display="flex"
            position="relative"
            bg="white"
          >
            <Flex w="100%" h="100%" flexDirection="row">
              {/* 왼쪽 사이드바 */}
              <VStack
                w="25%"
                h="100%"
                bg="white"
                borderRight="2px solid #ccc"
                p={4}
                spacing={4}
                alignItems="center"
              >
                <Text fontSize="xl" fontWeight="bold">
                  {ownerNickname}님의 다이어리
                </Text>
                <Box>
                  {profileImage ? (
                    <Image
                      borderRadius="full"
                      boxSize="150px"
                      src={profileImage}
                      alt="Profile Image"
                    />
                  ) : (
                    <Avatar name={ownerNickname} size={"sm"} mr={2} />
                  )}
                </Box>
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
                      h="30px"
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
                      height="250px"
                      bg="white"
                      maxLength={255}
                    />
                    <HStack spacing={2} alignSelf="flex-end">
                      {Number(memberInfo.id) === ownerId && (
                        <Button
                          colorScheme="teal"
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
                    <Text>{profileData.statusMessage}</Text>
                    <Textarea
                      value={profileData.introduction || "자기소개가 없습니다."}
                      fontSize="sm"
                      h="250px"
                      readOnly
                    />
                    <HStack spacing={2} alignSelf="flex-end">
                      {Number(memberInfo.id) === ownerId && (
                        <Button
                          colorScheme="teal"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          수정
                        </Button>
                      )}
                    </HStack>
                  </>
                )}{" "}
                <Box w="100%" mt={4}>
                  <Text fontWeight="bold" mb={2}>
                    이번 달 기분
                  </Text>
                  <canvas ref={chartRef} width="200" height="200"></canvas>
                </Box>
              </VStack>
              <Box ml={1} w="75%" h="100%" position="relative">
                <Box
                  w="100%"
                  h="100%"
                  border="1px solid #ccc"
                  borderRadius="md"
                  overflowY="auto"
                  bg="white"
                  position="absolute"
                  top={0}
                  left={0}
                  pt={5}
                  pb={5}
                  pr={10}
                  pl={10}
                >
                  <Outlet />
                </Box>
              </Box>
            </Flex>
          </Box>
          <Box ml={-2}>
            <DiaryNavbar />
          </Box>
        </Flex>
      </Center>
    </DiaryProvider>
  );
}
