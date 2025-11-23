import React, { useContext } from "react";
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "./LoginProvider.jsx"; // 경로 확인 필요
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faComments,
  faExclamationTriangle,
  faGraduationCap,
  faHeartPulse,
  faLayerGroup,
  faList,
  faQuestionCircle,
  faStar,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export default function BoardMenu() {
  const navigate = useNavigate();
  const { memberInfo } = useContext(LoginContext);

  // 게시판 목록 정의 (이름, 타입, 아이콘, 색상)
  const menuItems = [
    {
      label: "전체 게시판",
      type: "전체",
      icon: faLayerGroup,
      color: "gray.600",
    },
    { label: "자유 게시판", type: "자유", icon: faComments, color: "blue.400" },
    {
      label: "사진 공유",
      type: "사진 공유",
      icon: faCamera,
      color: "purple.400",
    },
    {
      label: "질문/답변",
      type: "질문/답변",
      icon: faQuestionCircle,
      color: "orange.400",
    },
    {
      label: "반려동물 건강",
      type: "반려동물 건강",
      icon: faHeartPulse,
      color: "red.400",
    },
    {
      label: "훈련/교육",
      type: "훈련/교육",
      icon: faGraduationCap,
      color: "teal.400",
    },
    { label: "용품 리뷰", type: "리뷰", icon: faStar, color: "yellow.400" },
    {
      label: "이벤트/모임",
      type: "이벤트/모임",
      icon: faUsers,
      color: "green.400",
    },
  ];

  // 메뉴 이동 핸들러
  const handleMove = (type) => {
    const params = new URLSearchParams();
    params.append("boardType", type);
    navigate(`/board/list?${params.toString()}`);
  };

  return (
    <Menu autoSelect={false} isLazy>
      {/* 1. 트리거 버튼 (Navbar의 다른 버튼들과 디자인 통일) */}
      <MenuButton
        as={Button}
        variant="ghost"
        leftIcon={<FontAwesomeIcon icon={faList} />}
        rightIcon={<ChevronDownIcon color="gray.400" />}
        px={4}
        py={5}
        rounded="full" // 둥근 알약 모양
        fontWeight="bold"
        fontSize="md"
        color="gray.600"
        _hover={{
          bg: "purple.50",
          color: "purple.600",
          transform: "translateY(-2px)",
          boxShadow: "sm",
        }}
        _active={{
          bg: "purple.100",
        }}
        transition="all 0.2s"
      >
        게시판
      </MenuButton>

      {/* 2. 드롭다운 메뉴 리스트 */}
      <MenuList
        border="none"
        boxShadow="dark-lg"
        borderRadius="xl"
        p={2}
        zIndex={2000}
        minW="240px"
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => handleMove(item.type)}
            borderRadius="lg"
            mb={1}
            py={3}
            _hover={{
              bg: "purple.50",
              color: "purple.700",
            }}
          >
            <Flex align="center" gap={3}>
              {/* 아이콘 박스 */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="32px"
                h="32px"
                borderRadius="full"
                bg="gray.50"
                color={item.color}
                fontSize="sm"
              >
                <FontAwesomeIcon icon={item.icon} />
              </Box>

              {/* 텍스트 */}
              <Text fontWeight="bold" fontSize="sm">
                {item.label}
              </Text>
            </Flex>
          </MenuItem>
        ))}

        {/* 3. 관리자 전용 신고 게시판 (조건부 렌더링) */}
        {memberInfo && memberInfo.role === "ROLE_ADMIN" && (
          <>
            <Box borderTop="1px solid" borderColor="gray.100" my={1} />
            <MenuItem
              onClick={() => navigate("/board/list/report")}
              borderRadius="lg"
              py={3}
              _hover={{ bg: "red.50", color: "red.600" }}
            >
              <Flex align="center" gap={3}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="red.100"
                  color="red.500"
                  fontSize="sm"
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </Box>
                <Text fontWeight="bold" fontSize="sm" color="red.500">
                  신고 게시판 (관리자)
                </Text>
              </Flex>
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
}
