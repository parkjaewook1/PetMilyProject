// import React, { useState } from "react";
// import {
//   Button,
//   Flex,
//   IconButton,
//   Text,
//   Textarea,
//   VStack,
// } from "@chakra-ui/react";
// import axios from "@api/axiosConfig";
// import { FaAngry, FaFrown, FaMeh, FaSmile, FaTired } from "react-icons/fa";
//
// const moods = [
//   { key: "HAPPY", icon: FaSmile, label: "행복" },
//   { key: "NEUTRAL", icon: FaMeh, label: "보통" },
//   { key: "SAD", icon: FaFrown, label: "슬픔" },
//   { key: "ANGRY", icon: FaAngry, label: "화남" },
//   { key: "TIRED", icon: FaTired, label: "피곤" },
// ];
//
// export default function MoodEntryForm({ username, onSaved }) {
//   const [selectedMood, setSelectedMood] = useState(null);
//   const [memo, setMemo] = useState("");
//   const [loading, setLoading] = useState(false);
//
//   const handleSave = async () => {
//     if (!selectedMood) {
//       alert("기분을 선택해주세요!");
//       return;
//     }
//     setLoading(true);
//     try {
//       await axios.post("/api/diaryBoard/add", {
//         title: "오늘의 기분",
//         content: memo,
//         username: username,
//         mood: selectedMood,
//       });
//       alert("오늘의 기분이 저장되었습니다!");
//       setSelectedMood(null);
//       setMemo("");
//       if (onSaved) onSaved(); // 저장 후 부모에서 통계 갱신
//     } catch (err) {
//       console.error(err);
//       alert("저장 중 오류가 발생했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return (
//     <VStack
//       spacing={4}
//       align="stretch"
//       p={4}
//       border="1px solid #ccc"
//       borderRadius="md"
//     >
//       <Text fontWeight="bold">오늘 하루 기분을 선택하세요</Text>
//       <Flex gap={2}>
//         {moods.map((m) => (
//           <IconButton
//             key={m.key}
//             icon={<m.icon />}
//             aria-label={m.label}
//             colorScheme={selectedMood === m.key ? "teal" : "gray"}
//             onClick={() => setSelectedMood(m.key)}
//             flex="1"
//             fontSize="24px"
//           />
//         ))}
//       </Flex>
//       <Textarea
//         placeholder="오늘 하루를 간단히 기록하세요..."
//         value={memo}
//         onChange={(e) => setMemo(e.target.value)}
//         rows={4}
//       />
//       <Button colorScheme="teal" onClick={handleSave} isLoading={loading}>
//         저장
//       </Button>
//     </VStack>
//   );
// }
