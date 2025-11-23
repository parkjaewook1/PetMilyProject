import React from "react";
import { Button, HStack, IconButton } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const DiaryPagination = ({
  pageInfo,
  pageNumbers,
  handlePageButtonClick,
  maxPageButtons = 5,
}) => {
  const { currentPageNumber, nextPageNumber, prevPageNumber, lastPageNumber } =
    pageInfo;

  // 현재 페이지 그룹 계산
  const currentPageGroup = Math.ceil(currentPageNumber / maxPageButtons);
  const startPageNumber = (currentPageGroup - 1) * maxPageButtons + 1;
  const endPageNumber = Math.min(
    currentPageGroup * maxPageButtons,
    lastPageNumber,
  );

  // 공통 버튼 스타일
  const buttonSize = "xs";
  const buttonVariant = "ghost"; // 평소엔 투명하게

  return (
    <HStack spacing={1} justifyContent="center" mt={2}>
      {/* 1. 처음으로 (<<) */}
      <IconButton
        icon={<FontAwesomeIcon icon={faAnglesLeft} />}
        onClick={() => handlePageButtonClick(1)}
        isDisabled={currentPageNumber === 1}
        size={buttonSize}
        variant={buttonVariant}
        aria-label="First Page"
        color="gray.500"
      />

      {/* 2. 이전 ( < ) */}
      <IconButton
        icon={<FontAwesomeIcon icon={faChevronLeft} />}
        onClick={() => prevPageNumber && handlePageButtonClick(prevPageNumber)}
        isDisabled={!prevPageNumber}
        size={buttonSize}
        variant={buttonVariant}
        aria-label="Previous Page"
        color="gray.500"
      />

      {/* 3. 페이지 번호들 */}
      {pageNumbers
        .slice(startPageNumber - 1, endPageNumber)
        .map((pageNumber) => (
          <Button
            key={pageNumber}
            onClick={() => handlePageButtonClick(pageNumber)}
            size={buttonSize}
            // 현재 페이지는 solid(채움), 나머지는 ghost(투명)
            variant={pageNumber === currentPageNumber ? "solid" : "ghost"}
            colorScheme={pageNumber === currentPageNumber ? "blue" : "gray"}
            color={pageNumber === currentPageNumber ? "white" : "gray.600"}
            fontWeight={pageNumber === currentPageNumber ? "bold" : "normal"}
            borderRadius="md"
          >
            {pageNumber}
          </Button>
        ))}

      {/* 4. 다음 ( > ) */}
      <IconButton
        icon={<FontAwesomeIcon icon={faChevronRight} />}
        onClick={() => nextPageNumber && handlePageButtonClick(nextPageNumber)}
        isDisabled={!nextPageNumber}
        size={buttonSize}
        variant={buttonVariant}
        aria-label="Next Page"
        color="gray.500"
      />

      {/* 5. 마지막으로 ( >> ) */}
      <IconButton
        icon={<FontAwesomeIcon icon={faAnglesRight} />}
        onClick={() => handlePageButtonClick(lastPageNumber)}
        isDisabled={currentPageNumber === lastPageNumber}
        size={buttonSize}
        variant={buttonVariant}
        aria-label="Last Page"
        color="gray.500"
      />
    </HStack>
  );
};

export default DiaryPagination;
