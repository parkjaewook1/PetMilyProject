// src/api/axios.js
import axios from "axios";

// === 기본 설정 ===
axios.defaults.baseURL = "http://150.230.249.131:8080/api"; // 백엔드 주소
axios.defaults.withCredentials = true; // ✅ Refresh Token 쿠키 전송 허용

// 앱 시작 시 저장된 Access Token을 기본 헤더에 세팅
const token = localStorage.getItem("accessToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// === 401 감지 → 재발급 인터셉터 ===
axios.interceptors.response.use(
  (response) => response, // 정상 응답은 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // Access Token 만료로 401이면서, 재시도한 적 없는 요청만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token은 쿠키로 자동 전송됨
        const reissueResponse = await axios.post(
          "/api/member/reissue",
          {},
          { withCredentials: true },
        );

        // 새 Access Token 추출
        const newAccessToken = reissueResponse.headers["access"];
        if (newAccessToken) {
          // 저장
          localStorage.setItem("accessToken", newAccessToken);

          // axios 기본 헤더 갱신
          axios.defaults.headers.common["Authorization"] =
            `Bearer ${newAccessToken}`;

          // 원래 요청 헤더 갱신
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // ✅ FormData 요청이면 복제
          if (originalRequest.data instanceof FormData) {
            const newData = new FormData();
            for (let [key, value] of originalRequest.data.entries()) {
              newData.append(key, value);
            }
            originalRequest.data = newData;
          }
        }

        // 원래 요청 재시도
        return axios(originalRequest);
      } catch (reissueError) {
        console.error("토큰 재발급 실패: 세션이 만료되었습니다.", reissueError);

        // 1. 오염된/만료된 토큰 삭제 (매우 중요!)
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        // 2. [핵심] 무한 루프 방지: "이미 로그인 페이지가 아닐 때만" 이동
        const currentPath = window.location.pathname;
        if (
          currentPath !== "/member/login" &&
          currentPath !== "/member/signup"
        ) {
          alert("로그인 세션이 만료되었습니다.");
          window.location.href = "/member/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
