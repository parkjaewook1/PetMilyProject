// SelectComponent.jsx
import React from "react";
import { Box, Checkbox, CheckboxGroup } from "@chakra-ui/react";

const SelectComponent = ({ selectedCategories, onCategoryChange, isDisabled = false }) => {
  return (
    <CheckboxGroup isDisabled={isDisabled} value={selectedCategories} onChange={onCategoryChange}>
      <Box>
        <Checkbox value="HP8">병원(일반)</Checkbox>
        <Checkbox value="MT1">대형마트</Checkbox>
        <Checkbox value="CS2">편의점</Checkbox>
        <Checkbox value="SC4">학교</Checkbox>
        <Checkbox value="AC5">학원</Checkbox>
        <Checkbox value="PK6">주차장</Checkbox>
        <Checkbox value="OL7">주유소·충전소</Checkbox>
        <Checkbox value="SW8">지하철역</Checkbox>
        <Checkbox value="BK9">은행</Checkbox>
        <Checkbox value="CT1">문화시설</Checkbox>
        <Checkbox value="AG2">중개업소</Checkbox>
      </Box>
    </CheckboxGroup>
  );
};

export default SelectComponent;
