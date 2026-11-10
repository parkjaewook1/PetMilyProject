import { fullSurfaceStyle } from "../../design/fullAuditStyles.js";
import React, { useState } from "react";
import KakaoMap from "../../KakaoMap.jsx";
import SearchMap from "../../SearchMap.jsx";
import { Box, Button, Text } from "@chakra-ui/react";
import { PlaceMap2 } from "./PlaceMap2.jsx";

export function PlaceMap() {
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [selectedCtprvnCd, setSelectedCtprvnCd] = useState(null);

  const handlePolygonSelect = (ctprvnCd) => {
    setSelectedCtprvnCd(ctprvnCd);
  };

  const handleBackClick = () => {
    setSelectedCtprvnCd(null);
  };

  return (
    <Box
      className="App full-journal full-map full-placemap"
      p={4}
      sx={fullSurfaceStyle}
    >
      <Box as="header" className="service-heading">
        <Text className="service-eyebrow">PETMILY / PLACES</Text>
        <Text as="h1">우리 동네 동물병원</Text>
        <Text>지도에서 지역을 선택하고 동물병원을 찾아보세요.</Text>
      </Box>
      <Box
        className="service-map-frame"
        position="relative"
        width="100%"
        height="500px"
        boxShadow="lg"
        borderRadius="md"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          display={selectedCtprvnCd ? "none" : "block"}
        >
          <KakaoMap onPolygonSelect={handlePolygonSelect} />
        </Box>
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          display={selectedCtprvnCd ? "block" : "none"}
        >
          <PlaceMap2 ctprvnCd={selectedCtprvnCd} />
          <Button
            position="absolute"
            top={4}
            left={4}
            colorScheme="blue"
            onClick={handleBackClick}
            boxShadow="md"
            variant="journal"
          >
            돌아가기
          </Button>
        </Box>
      </Box>
      <Box mt={4}>
        <Text fontSize="sm">카테고리는 카카오의 일반 업종입니다. 동물병원은 키워드로 검색하세요.</Text>
        <Button variant="journalOutline" mt={2} aria-expanded={showKeywordSearch} aria-controls="place-keyword-search" onClick={() => setShowKeywordSearch((visible) => !visible)}>
          {showKeywordSearch ? "키워드 검색 접기" : "키워드로 장소 찾기"}
        </Button>
        {showKeywordSearch && <Box id="place-keyword-search" mt={4}><SearchMap /></Box>}
      </Box>
    </Box>
  );
}
