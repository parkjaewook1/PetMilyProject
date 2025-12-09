import axios from "axios";

// 1. Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: "", // 컴포넌트에서 /api를 붙이므로 여기선 빈 문자열
  withCredentials: true, // 쿠키 전송 허용 (로컬 환경용)
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// 2. 요청 인터셉터 (Access Token 추가)
// 특정 요청(로그인, 중복확인 등)에는 토큰을 싣지 않도록 필터링합니다.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    // 토큰이 있고 + 토큰이 필요 없는 요청이 아닐 때만 헤더에 추가
    if (
      token &&
      !config.url.includes("/member/login") &&
      !config.url.includes("/member/signup") &&
      !config.url.includes("/member/check") && // 👈 중복 확인
      !config.url.includes("/member/reissue") // 👈 토큰 재발급
    ) {
      // ✅ 표준 방식(Authorization: Bearer ...) 유지
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. 응답 인터셉터 (401 에러 감지 및 재발급)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러가 났고, 아직 재시도를 안 한 요청이라면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 루프 방지 플래그

      try {
        // ⚡️ [핵심 수정 1] 로컬스토리지에서 Refresh Token 꺼내기
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // 리프레시 토큰도 없으면 바로 로그아웃 처리로 이동
          throw new Error("리프레시 토큰이 없습니다.");
        }

        // ⚡️ [핵심 수정 2] 재발급 요청 시 헤더에 Refresh-Token을 실어서 보냄
        // (쿠키가 막히는 배포 환경에서도 동작하도록 함)
        const reissueResponse = await axios.post(
          "/api/member/reissue",
          {},
          {
            withCredentials: true,
            headers: {
              "Refresh-Token": refreshToken, // 👈 백엔드가 이 헤더를 확인합니다.
            },
          },
        );

        // ⚡️ [핵심 수정 3] 백엔드가 응답 헤더로 준 새 토큰 받기 & 저장
        const newAccessToken = reissueResponse.headers["access"];
        const newRefreshToken = reissueResponse.headers["refresh-token"];

        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);

          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          // 원래 요청의 헤더를 새 토큰으로 교체 (표준 방식)
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // FormData 처리 (데이터 손실 방지)
          if (originalRequest.data instanceof FormData) {
            const newData = new FormData();
            for (let [key, value] of originalRequest.data.entries()) {
              newData.append(key, value);
            }
            originalRequest.data = newData;
          }

          // 실패했던 원래 요청 재시도
          return axiosInstance(originalRequest);
        }
      } catch (reissueError) {
        console.error("토큰 재발급 실패:", reissueError);

        // 토큰 삭제 및 로그아웃 처리
        const hadToken = localStorage.getItem("accessToken");

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken"); // 리프레시 토큰도 삭제
        localStorage.removeItem("memberInfo"); // 사용자 정보도 삭제
        delete axios.defaults.headers.common["Authorization"];

        const currentPath = window.location.pathname;
        if (
          currentPath !== "/" &&
          currentPath !== "/member/login" &&
          currentPath !== "/member/signup"
        ) {
          alert("로그인 세션이 만료되었습니다.");
          window.location.href = "/member/login";
        } else {
          // 원래 토큰이 있었는데 만료된 경우에만 새로고침 (무한루프 방지)
          if (hadToken) {
            window.location.reload();
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
