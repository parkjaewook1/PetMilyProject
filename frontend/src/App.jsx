import React, { useContext, useEffect, useState } from "react";
import { ChakraProvider, theme } from "@chakra-ui/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import axios from "@api/axiosConfig";
import { Home } from "./page/Home.jsx";
import { MainPage } from "./page/MainPage.jsx";
import { AIChat } from "./component/chat/AIChat.jsx";

// Member
import { MemberSignup } from "./page/member/MemberSignup.jsx";
import { MemberLogin } from "./page/member/MemberLogin.jsx";
import { MemberFind } from "./page/member/MemberFind.jsx";
import { MemberPage } from "./page/member/MemberPage.jsx";
import { MemberList } from "./page/member/MemberList.jsx";
import { MemberEdit } from "./page/member/MemberEdit.jsx";
import { LoginContext, LoginProvider } from "./component/LoginProvider.jsx";
import { OAuthLogin } from "./page/member/OAuthLogin.jsx";

// Board
import { BoardWrite } from "./page/board/BoardWrite.jsx";
import { BoardList } from "./page/board/BoardList.jsx";
import { BoardView } from "./page/board/BoardView.jsx";
import { BoardEdit } from "./page/board/BoardEdit.jsx";
import { BoardReportList } from "./page/board/BoardReportList.jsx";
import { BoardReportListContents } from "./page/board/BoardReportListContents.jsx";

// Diary
import { DiaryHome } from "./page/diary/diarySrc/diaryPage/DiaryHome.jsx";
import { DiaryHomeMain } from "./page/diary/diarySrc/diaryPage/DiaryHomeMain.jsx";
import { DiaryBoardWrite } from "./page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardWrite.jsx";
import { DiaryBoardList } from "./page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardList.jsx";
import { DiaryBoardView } from "./page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardView.jsx";
import { DiaryBoardEdit } from "./page/diary/diarySrc/diaryPage/diaryBoard/DiaryBoardEdit.jsx";
import { DiaryComment } from "./page/diary/diarySrc/diaryPage/diaryComment/DiaryComment.jsx";
import { DiaryCommentWrite } from "./page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentWrite.jsx";
import { DiaryCommentView } from "./page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentView.jsx";
import { DiaryCommentList } from "./page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentList.jsx";
import { DiaryCommentEdit } from "./page/diary/diarySrc/diaryPage/diaryComment/DiaryCommentEdit.jsx";
import DiaryCalendar from "./page/diary/diarySrc/diaryPage/diaryCalendar/DiaryCalendar.jsx";

// Place
import { PlaceLocal } from "./page/place/PlaceLocal.jsx";
import { PlaceMap } from "./page/place/PlaceMap.jsx";
import { PlaceMap2 } from "./page/place/PlaceMap2.jsx";
import { PlaceMap3 } from "./page/place/PlaceMap3.jsx";
import { PlaceReview } from "./page/place/PlaceReview.jsx";
import KakaoMap from "./KakaoMap.jsx";

const App = () => {
  const [selectedCtprvnCd, setSelectedCtprvnCd] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const memberInfo = useContext(LoginContext);

  // 📌 앱 시작 시 토큰으로 내 정보 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!memberInfo?.id) return; // id 없으면 호출 안 함

        const res = await axios.get(`/api/member/${memberInfo.id}`, {
          withCredentials: true,
        });
        setUser(res.data); // { id, nickname, ... }
      } catch (err) {
        console.error("사용자 정보 불러오기 실패:", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [memberInfo?.id]); // id가 바뀌면 다시 호출

  // ✅ memberInfo가 세팅되면 로딩 종료
  useEffect(() => {
    if (memberInfo) {
      setLoadingUser(false);
    }
  }, [memberInfo]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      children: [
        { index: true, element: <MainPage /> },
        { path: "aichat", element: <AIChat /> },

        // Member
        { path: "member/signup", element: <MemberSignup /> },
        { path: "member/login", element: <MemberLogin /> },
        { path: "member/find", element: <MemberFind /> },
        { path: "member/page/:id", element: <MemberPage /> },
        { path: "member/list", element: <MemberList /> },
        { path: "member/edit/:id", element: <MemberEdit /> },
        { path: "member/oauth/login", element: <OAuthLogin /> },

        // Board
        { path: "board/write", element: <BoardWrite /> },
        { path: "board/list", element: <BoardList /> },
        { path: "board/:id", element: <BoardView /> },
        { path: "board/edit/:id", element: <BoardEdit /> },
        { path: "board/list/report", element: <BoardReportList /> },
        {
          path: "board/list/report/content",
          element: <BoardReportListContents />,
        },

        // Diary
        {
          path: "diary/:diaryId",
          element: <DiaryHome />,
          children: [
            { index: true, element: <DiaryHomeMain /> },

            // 게시판(일기)
            { path: "board/write", element: <DiaryBoardWrite /> },
            { path: "board/list", element: <DiaryBoardList /> },
            { path: "board/view/:id", element: <DiaryBoardView /> }, // ✅ /diary/:diaryId/view/:id
            { path: "board/edit/:id", element: <DiaryBoardEdit /> },

            // 방명록(댓글)
            { path: "comment", element: <DiaryComment /> },
            { path: "comment/write", element: <DiaryCommentWrite /> },
            { path: "comment/view/:id", element: <DiaryCommentView /> },
            { path: "comment/list", element: <DiaryCommentList /> }, // ✅ /diary/:diaryId/comment/list
            { path: "comment/edit/:id", element: <DiaryCommentEdit /> },

            // 캘린더
            {
              path: "calendar",
              element: loadingUser ? (
                <div>로그인 정보를 불러오는 중...</div>
              ) : user ? (
                <DiaryCalendar user={user} />
              ) : (
                <div>유저 정보 없음</div>
              ),
            },
          ],
        },

        // Place
        { path: "place/local", element: <PlaceLocal /> },
        { path: "place/map", element: <PlaceMap /> },
        {
          path: "place-map2",
          element: <PlaceMap2 ctprvnCd={selectedCtprvnCd} />,
        },
        { path: "place/:id", element: <PlaceReview /> },
        {
          path: "kakao-map",
          element: <KakaoMap onPolygonSelect={setSelectedCtprvnCd} />,
        },
        { path: "place-map3", element: <PlaceMap3 /> },
      ],
    },
  ]);

  return (
    <LoginProvider>
      <ChakraProvider theme={theme}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </LoginProvider>
  );
};

export default App;
