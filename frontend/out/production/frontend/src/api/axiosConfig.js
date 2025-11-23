// src/api/axios.js
import axios from "axios";

// === 기본 설정 ===
axios.defaults.baseURL = "http://localhost:8080"; // 백엔드 주소
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
        console.error("토큰 재발급 실패", reissueError);
        // 재발급 실패 시 로그인 페이지로 이동
        // window.location.href = "/member/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
