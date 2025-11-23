import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "@api/axiosConfig";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

export default function DiaryCalendar() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const { numericDiaryId } = useOutletContext();
  const { encodedId } = useParams();

  const loadCalendarData = async (yearMonth) => {
    const res = await axios.get("/api/diaryBoard/list", {
      params: { diaryId: numericDiaryId, yearMonth },
    });

    const list = res.data.diaryBoardList || []; // ✅ list만 꺼내기

    console.log("list[0]:", list[0]); // 이제 여기서 글 PK 확인 가능

    const mapped = list.map((d) => ({
      id: d.id,
      title: d.title.length > 20 ? d.title.slice(0, 20) + "..." : d.title,
      start: d.inserted,
    }));
    setEvents(mapped);
  };

  useEffect(() => {
    if (!numericDiaryId) return;
    const today = new Date();
    loadCalendarData(today.toISOString().slice(0, 7));
  }, [numericDiaryId]);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventClick={(info) => {
        console.log("클릭한 event.id:", info.event.id);
        navigate(`/diary/${encodedId}/board/view/${info.event.id}`);
      }}
      dateClick={(info) => {
        const event = events.find((e) => e.start.slice(0, 10) === info.dateStr);

        if (event) {
          navigate(`/diary/${encodedId}/board/view/${event.id}`);
        } else {
          navigate(`/diary/${encodedId}/board/write?date=${info.dateStr}`);
        }
      }}
    />
  );
}

// // 📌 PropTypes 정의
// DiaryCalendar.propTypes = {
//   user: PropTypes.shape({
//     id: PropTypes.number.isRequired,
//     nickname: PropTypes.string.isRequired,
//   }).isRequired,
// };
