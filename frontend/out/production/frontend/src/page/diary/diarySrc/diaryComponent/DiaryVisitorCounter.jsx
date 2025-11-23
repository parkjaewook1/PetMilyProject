import { useEffect, useState } from "react";
import { Badge, Box, HStack } from "@chakra-ui/react";
import axios from "@api/axiosConfig";
import { FaCalendarDay, FaUsers } from "react-icons/fa";

function DiaryVisitorCounter({ diaryId }) {
  const [counts, setCounts] = useState({ today: 0, total: 0 });

  useEffect(() => {
    // ✅ 방문 기록 남기기
    axios
      .post(`/api/diary-visit/${diaryId}`)
      .catch((err) => console.error("방문 기록 실패:", err));

    // ✅ 방문자 수 불러오기
    axios
      .get(`/api/diary-visit/${diaryId}/count`)
      .then((res) => setCounts(res.data))
      .catch((err) => console.error("방문자 수 조회 실패:", err));
  }, [diaryId]);

  return (
    <HStack spacing={3} justify="center" mt={2}>
      <Box display="flex" alignItems="center" gap={1}>
        <FaCalendarDay color="#3182CE" size="0.9em" />
        <Badge colorScheme="blue" fontSize="0.7em" borderRadius="full" px={2}>
          Today {counts.today}
        </Badge>
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        <FaUsers color="#38A169" size="0.9em" />
        <Badge colorScheme="green" fontSize="0.7em" borderRadius="full" px={2}>
          Total {counts.total}
        </Badge>
      </Box>
    </HStack>
  );
}

export default DiaryVisitorCounter;
