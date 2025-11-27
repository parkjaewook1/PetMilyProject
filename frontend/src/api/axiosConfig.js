import axios from "axios";

// 1. Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. 요청 인터셉터
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

// 3. 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const reissueResponse = await axios.post(
          "/api/member/reissue",
          {},
          { withCredentials: true },
        );

        const newAccessToken = reissueResponse.headers["access"];

        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          if (originalRequest.data instanceof FormData) {
            const newData = new FormData();
            for (let [key, value] of originalRequest.data.entries()) {
              newData.append(key, value);
            }
            originalRequest.data = newData;
          }

          return axiosInstance(originalRequest);
        }
      } catch (reissueError) {
        console.error("토큰 재발급 실패:", reissueError);

        // 🚨 [핵심 수정] 토큰이 있었는지 먼저 확인!
        const hadToken = localStorage.getItem("accessToken");

        // 토큰 삭제
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        const currentPath = window.location.pathname;

        // 1. 로그인이 필수인 페이지면 -> 로그인 창으로 보냄
        if (
          currentPath !== "/" &&
          currentPath !== "/member/login" &&
          currentPath !== "/member/signup"
        ) {
          alert("로그인 세션이 만료되었습니다.");
          window.location.href = "/member/login";
        }
        // 2. 홈 화면 등 비회원도 볼 수 있는 페이지라면?
        else {
          // ✅ [수정됨] "방금까지 로그인이 되어 있었던 경우"에만 새로고침!
          // (계속 비회원이었는데 401 났다고 새로고침하면 무한루프 돔)
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
