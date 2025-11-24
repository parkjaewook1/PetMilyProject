import axios from "axios";

// 1. Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: "/api", // Vercel 프록시를 타기 위해 상대 경로 사용
  withCredentials: true, // 쿠키 전송 허용
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. [추가됨] 요청 인터셉터 (모든 요청 보낼 때마다 토큰 자동 주입)
// 이걸 써야 로그인 직후에도 새로고침 없이 바로 토큰이 들어갑니다.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. 응답 인터셉터 (401 에러 감지 및 재발급)
// 🚨 중요: axios.interceptors 가 아니라 axiosInstance.interceptors 여야 함!
axiosInstance.interceptors.response.use(
  (response) => response, // 정상 응답은 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 적이 없을 때만 진입
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 재발급 요청
        // (재발급 요청은 깡통 axios를 쓰거나, 헤더 없이 보내야 안전함)
        const reissueResponse = await axios.post(
          "/api/member/reissue",
          {},
          { withCredentials: true },
        );

        // 새 토큰 받기
        const newAccessToken = reissueResponse.headers["access"];

        if (newAccessToken) {
          // 저장
          localStorage.setItem("accessToken", newAccessToken);

          // 실패했던 요청의 헤더를 새 토큰으로 교체
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // FormData인 경우 데이터 유실 방지를 위한 재설정 (아주 훌륭한 코드입니다! 👍)
          if (originalRequest.data instanceof FormData) {
            const newData = new FormData();
            for (let [key, value] of originalRequest.data.entries()) {
              newData.append(key, value);
            }
            originalRequest.data = newData;
          }

          // 🚨 중요: 재요청도 'axiosInstance'로 해야 baseURL 설정이 유지됨
          return axiosInstance(originalRequest);
        }
      } catch (reissueError) {
        console.error("토큰 재발급 실패:", reissueError);

        // 실패 시 토큰 삭제 및 로그아웃 처리
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        // 2. [핵심 수정] 현재 페이지가 "로그인", "회원가입", "홈(/)"이 아닐 때만 튕겨내기!
        const currentPath = window.location.pathname;
        if (
          currentPath !== "/" &&
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

export default axiosInstance;
