import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import DiaryMoodModal from "./DiaryMoodModal";
import PropTypes from "prop-types";

export default function DiaryCalendar({ user }) {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadCalendarData = async (yearMonth) => {
    const res = await axios.get("/api/diaryBoard/mood-stats", {
      params: { memberId: user.id, yearMonth },
    });
    const mapped = res.data.map((stat) => ({
      title: stat.mood,
      start: stat.date,
      color: mapMoodToColor(stat.mood),
    }));
    setEvents(mapped);
  };

  const mapMoodToColor = (mood) => {
    switch (mood) {
      case "HAPPY":
        return "yellow";
      case "NEUTRAL":
        return "gray";
      case "SAD":
        return "blue";
      case "ANGRY":
        return "red";
      case "TIRED":
        return "purple";
      default:
        return "lightgray";
    }
  };

  useEffect(() => {
    if (!user) return; // user가 없으면 실행 안 함
    const today = new Date();
    loadCalendarData(today.toISOString().slice(0, 7));
  }, [user]);

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={(info) => {
          setSelectedDate(info.dateStr);
          setIsModalOpen(true);
        }}
      />

      <DiaryMoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        username={user?.nickname}
        reloadCalendar={loadCalendarData}
      />
    </>
  );
}
// 📌 여기서 PropTypes 정의
DiaryCalendar.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nickname: PropTypes.string.isRequired,
  }).isRequired,
};
