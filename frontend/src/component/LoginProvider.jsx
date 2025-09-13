import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

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

  // ✅ Axios 응답 인터셉터: 401 감지 → 자동 로그아웃
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          const msg = err.response.data;
          if (
            msg === "access token expired" ||
            msg === "no token" ||
            msg === "invalid access token"
          ) {
            console.warn("🚨 401 감지 → 자동 로그아웃");
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
