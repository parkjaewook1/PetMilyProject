import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "@api/axiosConfig";

export const LoginContext = createContext(null);

export function LoginProvider({ children }) {
  const [memberInfo, setMemberInfo] = useState(() => {
    const stored = localStorage.getItem("memberInfo");
    return stored ? JSON.parse(stored) : null;
  });

  // ✅ memberInfo에서 안전한 user 정보만 추출
  const user = memberInfo
    ? {
        id: memberInfo.id,
        nickname: memberInfo.nickname,
      }
    : null;

  // 공통 로그아웃 처리
  const logout = () => {
    localStorage.removeItem("memberInfo");
    setMemberInfo(null);
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/member/login";
  };

  // ✅ memberInfo 변경 시: Axios 헤더 + localStorage 동기화 + 만료 타이머 설정
  useEffect(() => {
    if (memberInfo?.access) {
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${memberInfo.access}`;
      localStorage.setItem("memberInfo", JSON.stringify(memberInfo));

      try {
        const { exp } = jwtDecode(memberInfo.access);
        const msUntilExpire = exp * 1000 - Date.now();
        if (msUntilExpire > 0) {
          const timer = setTimeout(() => {
            console.log("⏰ 토큰 만료 → 자동 로그아웃");
            logout();
          }, msUntilExpire);
          return () => clearTimeout(timer);
        } else {
          setTimeout(() => logout(), 0);
        }
      } catch (e) {
        console.error("토큰 디코딩 실패", e);
        setTimeout(() => logout(), 0);
      }
    } else {
      localStorage.removeItem("memberInfo");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [memberInfo]);

  // ✅ Axios 요청 인터셉터: 항상 최신 토큰 붙이기
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const saved = localStorage.getItem("memberInfo");
      if (saved) {
        const { access } = JSON.parse(saved);
        if (access) {
          config.headers.Authorization = `Bearer ${access}`;
        }
      }
      return config;
    });
    return () => axios.interceptors.request.eject(reqInterceptor);
  }, []);

  // ✅ Axios 응답 인터셉터: 401 감지 → 토큰 재발급 시도
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const originalRequest = err.config;

        if (err.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const reissueResponse = await axios.post(
              "/api/member/reissue",
              {},
              { withCredentials: true },
            );

            const newAccess = reissueResponse.headers["access"];
            if (newAccess) {
              // memberInfo 갱신
              const saved = localStorage.getItem("memberInfo");
              if (saved) {
                const parsed = JSON.parse(saved);
                parsed.access = newAccess;
                localStorage.setItem("memberInfo", JSON.stringify(parsed));
                setMemberInfo(parsed);
              }

              // 원래 요청 Authorization 교체 후 재시도
              axios.defaults.headers.common["Authorization"] =
                `Bearer ${newAccess}`;
              originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

              // FormData 요청이면 복제
              if (originalRequest.data instanceof FormData) {
                const newData = new FormData();
                for (let [key, value] of originalRequest.data.entries()) {
                  newData.append(key, value);
                }
                originalRequest.data = newData;
              }

              // 재시도
              return axios(originalRequest);
            }
          } catch (reissueErr) {
            console.warn("🚨 토큰 재발급 실패 → 로그아웃");
            logout();
          }
        }

        return Promise.reject(err);
      },
    );

    return () => axios.interceptors.response.eject(resInterceptor);
  }, []);

  return (
    <LoginContext.Provider value={{ memberInfo, user, setMemberInfo, logout }}>
      {children}
    </LoginContext.Provider>
  );
}
