import React, { useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import {
  Badge,
  Box,
  Button,
  Fade,
  Flex,
  Image,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ImageCarousel from "../component/ImageCarousel.jsx";

const podiumMargins = {
  1: "0px",
  2: "100px",
  3: "100px",
};

const badgeColors = {
  1: "gold",
  2: "silver",
  3: "#cd7f32", // bronze
};

const PetProfile = ({ imgSrc, rank, boardId, onClick }) => {
  const handleError = (e) => {
    console.error(`Failed to load image: ${imgSrc}`, e);
  };

  const badgeStyles = {
    1: {
      background: "linear-gradient(145deg, #ffd700, #f0c431)",
      boxShadow:
        "0 4px 6px rgba(0, 0, 0, 0.3), inset 0 -1px 1px rgba(255, 255, 255, 0.2)",
    },
    2: {
      background: "linear-gradient(145deg, #c0c0c0, #b0b0b0)",
      boxShadow:
        "0 4px 6px rgba(0, 0, 0, 0.3), inset 0 -1px 1px rgba(255, 255, 255, 0.2)",
    },
    3: {
      background: "linear-gradient(145deg, #cd7f32, #c67c2f)",
      boxShadow:
        "0 4px 6px rgba(0, 0, 0, 0.3), inset 0 -1px 1px rgba(255, 255, 255, 0.2)",
    },
  };

  return (
    <Box
      textAlign="center"
      m={4}
      position="relative"
      marginTop={podiumMargins[rank]}
      height="auto"
      width="200px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      onClick={onClick} // 클릭 이벤트 핸들러 추가
      cursor="pointer" // 클릭 가능한 커서 스타일 추가
    >
      {rank === 1 && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundImage="url('/img/golden laurel wreath gold.png')"
          backgroundSize="cover"
          backgroundRepeat="no-repeat"
          backgroundPosition="center"
          zIndex={0}
          width="200px"
          height="200px"
          clipPath="inset(0% 0% 10% 0%)"
        />
      )}
      <Badge
        position="absolute"
        top="10px"
        left="10px"
        color="black"
        fontWeight="bold"
        borderRadius="full"
        width="40px"
        height="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="1.2rem"
        {...badgeStyles[rank]}
        zIndex={2}
      >
        {rank}
      </Badge>
      <Image
        src={imgSrc}
        borderRadius="full"
        boxSize="150px"
        mb={2}
        zIndex={1}
        onError={handleError}
      />
    </Box>
  );
};

export const MainPage = () => {
  const [latestBoards, setLatestBoards] = useState([]);
  const [popularBoards, setPopularBoards] = useState([]);
  const [topLikedImages, setTopLikedImages] = useState([]);
  const [guideBoards, setGuideBoards] = useState([]);
  const [showLogo, setShowLogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const images = ["/img/dog1.png", "/img/cat1.png", "/img/juntos2.png"]; // ✅ 로컬 이미지 배열

  const handleMapClick = () => {
    navigate("place-map3");
  };

  const handleSearchClick = () => {
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", searchQuery);
    navigate(`board/list?${searchParams.toString()}`);
  };

  useEffect(() => {
    const fetchLatestBoards = async () => {
      try {
        const res = await axios.get("/api/board/latest");
        console.log("Latest Boards:", res.data);
        setLatestBoards(res.data);
      } catch (error) {
        console.error("Error fetching latest boards:", error);
      }
    };

    const fetchPopularBoards = async () => {
      try {
        const res = await axios.get("/api/board/popular");
        console.log("Popular Boards:", res.data);
        setPopularBoards(res.data);
      } catch (error) {
        console.error("Error fetching popular boards:", error);
      }
    };

    const fetchTopLikedImages = async () => {
      try {
        const res = await axios.get("/api/board/topLikedImages");
        console.log("Top Liked Images:", res.data);
        setTopLikedImages(res.data);
      } catch (error) {
        console.error("Error fetching top liked images:", error);
      }
    };

    const fetchGuideBoards = async () => {
      try {
        const res = await axios.get("/api/board/guide");
        console.log("Guide Boards:", res.data);
        setGuideBoards(res.data);
      } catch (error) {
        console.error("Error fetching guide boards:", error);
      }
    };

    fetchLatestBoards();
    fetchPopularBoards();
    fetchTopLikedImages();
    fetchGuideBoards();

    const isFirstVisit = !sessionStorage.getItem("visited");
    if (isFirstVisit) {
      setShowLogo(true);
      sessionStorage.setItem("visited", "true");
      setTimeout(() => {
        setShowLogo(false);
      }, 2000); // 2초 후 로고 페이드아웃
    }
  }, []);

  const bg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const handleImageClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Fade in={showLogo} unmountOnExit>
        <Flex
          justify="center"
          align="center"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100vh"
          bg="#F8F8FF"
          zIndex="1000"
        >
          <Image src="/img/petmily-logo.png" w="25%" />
        </Flex>
      </Fade>
      <Box textAlign="center" mt={8}>
        <Box mt={10} mb={5}>
          <Text
            fontWeight="bold"
            fontStyle="italic"
            fontSize="larger"
            color="darkblue"
          >
            반려인의, 반려인에 의한, 반려인을 위한
          </Text>
        </Box>
        <Image src="/img/petmily-logo.png" w="20%" mx="auto" mb={4} />
        <Flex justifyContent="center" mb={8}>
          <Input
            type="text"
            placeholder="통합 검색"
            borderRadius="md"
            borderColor="gray.300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearchClick();
              }
            }}
            width="25%"
          />
          <Button
            bgColor="purple.100"
            _hover={{ bgColor: "purple.200" }}
            ml={2}
            fontWeight="bold"
            onClick={handleSearchClick}
            isDisabled={!searchQuery.trim()}
          >
            검색
          </Button>
        </Flex>
      </Box>

      <Text
        fontSize="2rem"
        fontWeight="extrabold"
        textAlign="center"
        color="purple.500"
        textShadow="1px 1px 4px rgba(0, 0, 0, 0.2)"
        mt={16}
      >
        펫밀리의 인기 가족을 소개합니다
      </Text>

      <Flex justify="space-evenly" align="center" mb={12}>
        <Flex direction="column" justify="center" alignItems="center" m={4}>
          {topLikedImages[1] && (
            <PetProfile
              key={1}
              imgSrc={topLikedImages[1].imageUrl}
              rank={2}
              onClick={() => handleImageClick(topLikedImages[1].id)}
            />
          )}
        </Flex>
        <Flex direction="column" justify="center" alignItems="center" m={4}>
          {topLikedImages[0] && (
            <PetProfile
              key={0}
              imgSrc={topLikedImages[0].imageUrl}
              rank={1}
              onClick={() => handleImageClick(topLikedImages[0].id)}
            />
          )}
        </Flex>
        <Flex direction="column" justify="center" alignItems="center" m={4}>
          {topLikedImages[2] && (
            <PetProfile
              key={2}
              imgSrc={topLikedImages[2].imageUrl}
              rank={3}
              onClick={() => handleImageClick(topLikedImages[2].id)}
            />
          )}
        </Flex>
      </Flex>

      {/* ✅ 슬라이드가 New/Hot 게시판보다 위로 이동 */}
      <ImageCarousel images={images} />

      <Flex justify="center" mb={8} wrap="wrap" gap={8}>
        {/* 🆕 최신 글 */}
        <Box
          w="500px"
          minW="300px"
          p={4}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
        >
          <Flex alignItems="center" mb={2}>
            <Text fontSize="xl" fontWeight="bold" color="teal.600">
              🆕 최신 글
            </Text>
          </Flex>
          <Box>
            {latestBoards.slice(0, 5).map((board) => (
              <Box
                key={board.id}
                borderBottom="1px solid"
                borderColor="gray.200"
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                  {board.title}
                </Text>
                <Flex
                  justify="space-between"
                  fontSize="sm"
                  color="gray.500"
                  mt={1}
                >
                  <Text>{board.writer}</Text>
                  <Text>
                    {board.inserted
                      ? new Date(board.inserted).toLocaleDateString()
                      : "날짜 없음"}
                  </Text>
                </Flex>
                <Flex justify="flex-end" fontSize="sm" color="gray.500" mt={1}>
                  <Text>
                    👍 {board.numberOfLikes} · 👀 {board.views}
                  </Text>
                </Flex>
              </Box>
            ))}
          </Box>
        </Box>
        {/* 🔥 인기 글 */}
        <Box
          w="500px"
          minW="300px"
          p={4}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
        >
          <Flex alignItems="center" mb={2}>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              🔥 인기 글
            </Text>
          </Flex>
          <Box>
            {popularBoards.slice(0, 5).map((board, index) => (
              <Box
                key={board.id}
                borderBottom="1px solid"
                borderColor="gray.200"
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <Flex align="center" mb={1}>
                  {/* 순위 뱃지 */}
                  {index === 0 && (
                    <Badge colorScheme="yellow" mr={2}>
                      🥇 1위
                    </Badge>
                  )}
                  {index === 1 && (
                    <Badge colorScheme="gray" mr={2}>
                      🥈 2위
                    </Badge>
                  )}
                  {index === 2 && (
                    <Badge colorScheme="orange" mr={2}>
                      🥉 3위
                    </Badge>
                  )}
                  {index > 2 && (
                    <Badge colorScheme="purple" mr={2}>
                      {index + 1}위
                    </Badge>
                  )}

                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {board.title}
                  </Text>
                </Flex>
                <Flex
                  justify="space-between"
                  fontSize="sm"
                  color="gray.500"
                  mt={1}
                >
                  <Text>{board.writer}</Text>
                  <Text>
                    {board.inserted
                      ? new Date(board.inserted).toLocaleDateString()
                      : "날짜 없음"}
                  </Text>
                </Flex>
                <Flex justify="flex-end" fontSize="sm" color="gray.500" mt={1}>
                  <Text>
                    👍 {board.numberOfLikes} · 👀 {board.views}
                  </Text>
                </Flex>
              </Box>
            ))}
          </Box>
        </Box>
      </Flex>

      {/*<Flex justify="flex-start" p={4} mb={8}>
        <Box
          flex="1"
          minW="300px"
          p={4}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
        >
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            근처 동물 병원 보기
          </Text>
          <Box
            mx={"auto"}
            w={"100%"}
            maxW={"600px"}
            h={"400px"}
            onClick={handleMapClick}
          >
            <KakaoMap2 />
          </Box>
        </Box>

        <Box
          flex="1"
          minW="300px"
          p={4}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          ml={4}
        >
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            반려인 가이드
          </Text>
          <SimpleGrid columns={1} spacing={4}>
            {guideBoards.slice(0, 3).map((board) => (
              <Box
                key={board.id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                p={4}
                cursor="pointer"
                onClick={() => navigate(`/board/${board.id}`)}
                _hover={{ bg: "gray.200" }}
                bg={bg}
                display="flex"
                alignItems="center"
              >
                {board.imageUrl && (
                  <Box mb={2} width="100px" height="100px" overflow="hidden">
                    <Image
                      src={board.imageUrl}
                      alt="썸네일"
                      borderRadius="md"
                      width="100%"
                      height="100%"
                      objectFit="cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/default-image.png"; // 기본 이미지 경로
                      }}
                    />
                  </Box>
                )}
                <Box ml={4}>
                  <Box fontWeight="bold" as="h4" fontSize="lg" mb={2}>
                    {board.title}
                  </Box>
                  <Box
                    fontWeight="medium"
                    as="h4"
                    fontSize="lg"
                    mb={2}
                    maxW="300px" // 최대 너비 설정
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {board.content}
                  </Box>
                  <Box fontSize="sm" color="gray.600" mb={2}>
                    {board.writer}
                  </Box>
                  <Box mt={2} fontSize="sm" color="gray.500">
                    <span>추천수: {board.numberOfLikes}</span>
                  </Box>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Flex>*/}
    </Box>
  );
};
