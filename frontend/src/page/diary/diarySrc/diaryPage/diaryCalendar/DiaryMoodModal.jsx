import React, { useEffect, useState } from "react";
import {
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from "@chakra-ui/react";
import { FaAngry, FaFrown, FaMeh, FaSmile, FaTired } from "react-icons/fa";
import axios from "axios";

const moods = [
  { key: "HAPPY", icon: FaSmile },
  { key: "NEUTRAL", icon: FaMeh },
  { key: "SAD", icon: FaFrown },
  { key: "ANGRY", icon: FaAngry },
  { key: "TIRED", icon: FaTired },
];

export default function DiaryMoodModal({
  isOpen,
  onClose,
  selectedDate, // YYYY-MM-DD
  reloadCalendar, // 저장 후 달력 새로고침 함수
  defaultMood,
  defaultMemo,
}) {
  const [mood, setMood] = useState(defaultMood || null);
  const [memo, setMemo] = useState(defaultMemo || "");

  useEffect(() => {
    setMood(defaultMood || null);
    setMemo(defaultMemo || "");
  }, [defaultMood, defaultMemo]);

  const handleSave = async () => {
    if (!mood) {
      alert("기분을 선택해주세요!");
      return;
    }
    try {
      await axios.post("/api/diaryBoard/add-mood", {
        title: "감정일기",
        content: memo,
        mood: mood,
        inserted: selectedDate,
      });
      onClose();
      reloadCalendar(selectedDate.slice(0, 7)); // 해당 월 데이터 갱신
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>감정 일기</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack spacing={2} mb={4}>
            {moods.map((m) => (
              <IconButton
                key={m.key}
                icon={<m.icon />}
                aria-label={m.key}
                colorScheme={mood === m.key ? "teal" : "gray"}
                onClick={() => setMood(m.key)}
              />
            ))}
          </HStack>
          <Textarea
            placeholder="오늘 하루를 기록하세요..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" mr={3} onClick={handleSave}>
            저장
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
