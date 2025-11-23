// // src/utils/axiosInstance.js
// import axios from "axios";
//
// const axiosInstance = axios.create({
//   baseURL: "http://localhost:8080", // 백엔드 주소
//   withCredentials: true, // 쿠키 기반 인증 시 필요
// });
//
// axiosInstance.interceptors.request.use((config) => {
//   const memberInfo = JSON.parse(localStorage.getItem("memberInfo"));
//   if (memberInfo?.access) {
//     config.headers.Authorization = `Bearer ${memberInfo.access}`;
//   }
//   return config;
// });
//
// export default axiosInstance;
