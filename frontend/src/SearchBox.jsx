import React, { useState } from "react";
import { Box, Button, Input } from "@chakra-ui/react";

const SearchBox = ({ onSearch, isDisabled = false }) => {
  const [keyword, setKeyword] = useState("");

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleSearchClick = () => {
    if (!keyword.trim()) {
      alert("키워드를 입력해주세요!");
      return;
    }
    onSearch(keyword);
  };

  return (
    <Box
      backgroundColor="white"
      padding="10px"
      borderRadius="5px"
      boxShadow="0 2px 4px rgba(0,0,0,0.2)"
      zIndex="10"
    >
      <Input
        id="keyword"
        aria-label="장소 키워드"
        isDisabled={isDisabled}
        placeholder="키워드를 입력하세요"
        value={keyword}
        onChange={handleKeywordChange}
      />
      <Button isDisabled={isDisabled} variant="journal" onClick={handleSearchClick} marginTop="5px">
        검색
      </Button>
    </Box>
  );
};

export default SearchBox;
