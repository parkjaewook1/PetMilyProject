import React, { useEffect, useState } from "react";
import axios from "@api/axiosConfig";
import {
  Badge,
  Box,
  Button,
  Fade,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  TimeIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

// 🎠 [최종 수정] 테두리 없고 너비가 꽉 찬 슬라이더
const CardCarousel = ({ images }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesCount = images.length;

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    const autoSlide = setInterval(() => {
      setCurrentSlide((s) => (s === slidesCount - 1 ? 0 : s + 1));
    }, 3000);
    return () => clearInterval(autoSlide);
  }, [slidesCount]);

  const prevSlide = () => {
    setCurrentSlide((s) => (s === 0 ? slidesCount - 1 : s - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((s) => (s === slidesCount - 1 ? 0 : s + 1));
  };

  return (
    <Box
      position="relative"
      w="full" // 👈 [변경] 상단 섹션과 똑같이 꽉 차게 (기존 maxW="900px" 제거)
      h={{ base: "300px", md: "500px" }}
      mx="auto"
      borderRadius="3xl"
      overflow="hidden"
      bg="white"
      boxShadow="xl"
      // 👈 [변경] 테두리(border) 속성 삭제됨
    >
      {/* 슬라이드 트랙 */}
      <Flex
        w="full"
        h="full"
        transition="transform 0.5s ease-in-out"
        transform={`translateX(-${currentSlide * 100}%)`}
      >
        {images.map((img, index) => (
          <Box key={index} w="full" h="full" flex="none" position="relative">
            <Image
              src={img}
              alt={`Slide ${index + 1}`}
              w="full"
              h="full"
              objectFit="cover"
            />
            {/* 하단 그라데이션 데코 */}
            <Box
              position="absolute"
              bottom="0"
              left="0"
              right="0"
              h="120px"
              bgGradient="linear(to-t, blackAlpha.700, transparent)"
            />
          </Box>
        ))}
      </Flex>

      {/* 좌측 화살표 */}
      <IconButton
        aria-label="previous slide"
        icon={<ChevronLeftIcon w={8} h={8} />}
        position="absolute"
        left="20px"
        top="50%"
        transform="translateY(-50%)"
        bg="whiteAlpha.400"
        color="white"
        _hover={{ bg: "whiteAlpha.700", color: "black" }}
        onClick={prevSlide}
        isRound
        zIndex={2}
        size="lg"
      />

      {/* 우측 화살표 */}
      <IconButton
        aria-label="next slide"
        icon={<ChevronRightIcon w={8} h={8} />}
        position="absolute"
        right="20px"
        top="50%"
        transform="translateY(-50%)"
        bg="whiteAlpha.400"
        color="white"
        _hover={{ bg: "whiteAlpha.700", color: "black" }}
        onClick={nextSlide}
        isRound
        zIndex={2}
        size="lg"
      />

      {/* 하단 인디케이터 (점) */}
      <HStack
        position="absolute"
        bottom="20px"
        w="full"
        justify="center"
        zIndex={2}
      >
        {images.map((_, index) => (
          <Box
            key={index}
            w={currentSlide === index ? "24px" : "8px"}
            h="8px"
            borderRadius="full"
            bg={currentSlide === index ? "white" : "whiteAlpha.500"}
            transition="all 0.3s"
            cursor="pointer"
            onClick={() => setCurrentSlide(index)}
            boxShadow="md"
          />
        ))}
      </HStack>

      {/* 우측 하단 하트 장식 */}
      <Box position="absolute" bottom="25px" right="30px" zIndex={2}>
        <Icon
          as={FontAwesomeIcon}
          icon={faHeart}
          color="pink.400"
          boxSize={8}
          filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))"
        />
      </Box>
    </Box>
  );
};

export const MainPage = () => {
  const [latestBoards, setLatestBoards] = useState([]);
  const [popularBoards, setPopularBoards] = useState([]);
  const [showLogo, setShowLogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // ✅ 고정된 3장의 사진
  const images = ["/img/dog1.png", "/img/cat1.png", "/img/juntos2.png"];

  const handleSearchClick = () => {
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", searchQuery);
    navigate(`board/list?${searchParams.toString()}`);
  };

  const handleTagClick = (tag) => {
    const keyword = tag.replace("#", "");
    setSearchQuery(keyword);
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", keyword);
    navigate(`board/list?${searchParams.toString()}`);
  };

  useEffect(() => {
    const fetchLatestBoards = async () => {
      try {
        const res = await axios.get("/api/board/latest");
        setLatestBoards(res.data);
      } catch (error) {
        console.error("Error fetching latest boards:", error);
      }
    };

    const fetchPopularBoards = async () => {
      try {
        const res = await axios.get("/api/board/popular");
        setPopularBoards(res.data);
      } catch (error) {
        console.error("Error fetching popular boards:", error);
      }
    };

    fetchLatestBoards();
    fetchPopularBoards();

    const isFirstVisit = !sessionStorage.getItem("visited");
    if (isFirstVisit) {
      setShowLogo(true);
      sessionStorage.setItem("visited", "true");
      setTimeout(() => {
        setShowLogo(false);
      }, 2000);
    }
  }, []);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* 인트로 */}
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

      {/* 🌟 Hero Section */}
      <Box
        textAlign="center"
        mt={8}
        bgGradient="linear(to-b, purple.50, white)"
        py={12}
        borderRadius="3xl"
        boxShadow="sm"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-30px"
          left="-30px"
          w="150px"
          h="150px"
          bg="purple.200"
          borderRadius="full"
          opacity={0.4}
          filter="blur(50px)"
        />
        <Box
          position="absolute"
          bottom="-30px"
          right="-30px"
          w="200px"
          h="200px"
          bg="pink.200"
          borderRadius="full"
          opacity={0.4}
          filter="blur(50px)"
        />

        <Text
          bgGradient="linear(to-r, purple.500, pink.500)"
          bgClip="text"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="900"
          letterSpacing="tight"
          mb={8}
          position="relative"
          zIndex={1}
        >
          반려인의, 반려인에 의한, 반려인을 위한 🐾
        </Text>

        <Flex justifyContent="center" mt={6} position="relative" zIndex={1}>
          <Input
            placeholder="궁금한 내용을 검색해보세요 (예: 강아지 간식)"
            width={{ base: "90%", md: "50%" }}
            height="60px"
            borderRadius="full"
            boxShadow="lg"
            bg="white"
            pl={8}
            pr="100px"
            fontSize="lg"
            _focus={{
              boxShadow: "outline",
              borderColor: "purple.300",
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearchClick();
            }}
          />
          <Button
            position="relative"
            left="-90px"
            height="60px"
            width="90px"
            borderRightRadius="full"
            borderLeftRadius="none"
            colorScheme="purple"
            zIndex={2}
            onClick={handleSearchClick}
            fontSize="md"
            fontWeight="bold"
          >
            검색
          </Button>
        </Flex>

        <HStack
          justify="center"
          mt={6}
          spacing={3}
          wrap="wrap"
          position="relative"
          zIndex={1}
        >
          {["#강아지", "#고양이", "#동물병원", "#산책코스"].map((tag) => (
            <Badge
              key={tag}
              px={4}
              py={2}
              borderRadius="full"
              bg="white"
              color="purple.500"
              boxShadow="md"
              cursor="pointer"
              _hover={{
                transform: "translateY(-2px)",
                bg: "purple.500",
                color: "white",
              }}
              transition="all 0.2s"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </HStack>
      </Box>

      {/* =================================================== */}
      {/* 🎠 [수정됨] 테두리 없고 꽉 찬 슬라이더 섹션 🎠 */}
      {/* =================================================== */}
      <Box mt={16} mb={16}>
        <CardCarousel images={images} />
      </Box>

      {/* 게시글 리스트 섹션 */}
      <Flex justify="center" mb={20} wrap="wrap" gap={8}>
        {/* 🆕 최신 글 */}
        <Box
          flex="1"
          minW="350px"
          maxW="600px"
          bg="white"
          borderRadius="2xl"
          boxShadow="xl"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex
            p={6}
            bgGradient="linear(to-r, teal.50, white)"
            align="center"
            justify="space-between"
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <HStack spacing={2}>
              <Text fontSize="2xl">🌱</Text>
              <Text fontSize="xl" fontWeight="800" color="gray.800">
                따끈따끈 최신 글
              </Text>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="teal"
              fontWeight="bold"
              onClick={() => navigate("/board/list")}
              borderRadius="full"
            >
              전체보기 &gt;
            </Button>
          </Flex>

          <VStack spacing={0} align="stretch" p={2}>
            {latestBoards.slice(0, 5).map((board) => (
              <Box
                key={board.id}
                p={4}
                mx={2}
                my={1}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  bg: "teal.50",
                  transform: "translateY(-2px)",
                  boxShadow: "md",
                }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <Flex justify="space-between" align="flex-start">
                  <VStack align="start" spacing={1} w="75%">
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      noOfLines={1}
                      color="gray.800"
                    >
                      {board.title}
                    </Text>
                    <HStack fontSize="xs" color="gray.500" spacing={3}>
                      <Text>{board.writer}</Text>
                      <HStack spacing={1}>
                        <Icon as={TimeIcon} />
                        <Text>
                          {board.inserted
                            ? new Date(board.inserted).toLocaleDateString()
                            : ""}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                  <HStack
                    bg="white"
                    px={3}
                    py={1}
                    borderRadius="full"
                    boxShadow="sm"
                    border="1px solid"
                    borderColor="gray.100"
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.600"
                  >
                    <Icon as={ViewIcon} color="teal.400" />
                    <Text>{board.views}</Text>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* 🔥 인기 글 */}
        <Box
          flex="1"
          minW="350px"
          maxW="600px"
          bg="white"
          borderRadius="2xl"
          boxShadow="xl"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex
            p={6}
            bgGradient="linear(to-r, orange.50, white)"
            align="center"
            justify="space-between"
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <HStack spacing={2}>
              <Text fontSize="2xl">🔥</Text>
              <Text fontSize="xl" fontWeight="800" color="gray.800">
                지금 핫한 인기 글
              </Text>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="orange"
              fontWeight="bold"
              onClick={() => navigate("/board/list?type=best")}
              borderRadius="full"
            >
              전체보기 &gt;
            </Button>
          </Flex>

          <VStack spacing={0} align="stretch" p={2}>
            {popularBoards.slice(0, 5).map((board, index) => (
              <Box
                key={board.id}
                p={4}
                mx={2}
                my={1}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  bg: "orange.50",
                  transform: "translateY(-2px)",
                  boxShadow: "md",
                }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center" w="80%">
                    <Flex
                      align="center"
                      justify="center"
                      minW="28px"
                      h="28px"
                      borderRadius="8px"
                      bg={
                        index === 0
                          ? "red.500"
                          : index === 1
                            ? "orange.400"
                            : index === 2
                              ? "yellow.400"
                              : "gray.200"
                      }
                      color="white"
                      fontWeight="bold"
                      fontSize="sm"
                      mr={3}
                      boxShadow="sm"
                    >
                      {index + 1}
                    </Flex>
                    <VStack align="start" spacing={0} w="100%">
                      <Text
                        fontWeight="bold"
                        fontSize="md"
                        noOfLines={1}
                        color="gray.800"
                      >
                        {board.title}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {board.writer}
                      </Text>
                    </VStack>
                  </Flex>
                  <HStack spacing={3} fontSize="xs" color="gray.500">
                    <HStack
                      spacing={1}
                      bg="red.50"
                      px={2}
                      py={1}
                      borderRadius="md"
                      color="red.500"
                    >
                      <Icon as={StarIcon} />
                      <Text fontWeight="bold">{board.numberOfLikes}</Text>
                    </HStack>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};
