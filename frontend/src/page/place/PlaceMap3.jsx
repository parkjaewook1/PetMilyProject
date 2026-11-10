import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import React, { useState } from "react";
import KakaoMap2 from "../../KakaoMap2.jsx";
import { Box, Button, Text } from "@chakra-ui/react";
import SelectComponent from "../../SelectCompoent.jsx";

// 이름 오류 수정: 'SelectCompoent' -> 'SelectComponent'

export function PlaceMap3() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [map, setMap] = useState(null); // 지도 객체 상태 추가

  const handleCategoryChange = (newCategory) => {
    setSelectedCategories(newCategory); // 카테고리 변경 핸들러 구현
  };

  const searchByCategory = (map) => {
    console.log("카테고리로 검색:", selectedCategories);
    // 카테고리에 따른 검색 로직 구현 필요
  };

  return (
    <Box
      position="relative"
      width="100%"
      height="500px"
      sx={fullSurfaceStyle}
      className="full-journal full-map full-placemap3"
    >
      <Box
        position="absolute"
        top="50%"
        left="0"
        transform="translateY(-50%)"
        zIndex="10"
        background="rgba(255, 255, 255, 0.8)"
        p={4}
        boxShadow="md"
        width="200px"
        height="400px"
      >
        <SelectComponent
          isDisabled
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
        />
        <Text fontSize="sm">이 화면의 카테고리 검색은 준비 중입니다.</Text>
        <Button mt={2} isDisabled variant="journal">
          카테고리 검색 · 준비 중
        </Button>
      </Box>
      <div className="App">
        <KakaoMap2 width="100%" height="600px" />
      </div>
    </Box>
  );
}
