import axios from "axios";

// 🔐 กำหนด URL ของ Backend API (ใช้จาก .env)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// 👉 สามารถเพิ่ม interceptor ได้ (เช่น token, error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
