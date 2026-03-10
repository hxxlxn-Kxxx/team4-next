// src/lib/apiClient.ts
import { ApiError } from "./apiError";

// 백엔드 명세에는 API_URL이지만, 기존에 쓰시던 API_BASE_URL도 호환되게 함.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      try {
        // 재발급 API 찌르기
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccess = refreshData.data?.accessToken || refreshData.accessToken;
          
          // 새 토큰 저장 (로컬 + 쿠키)
          localStorage.setItem("accessToken", newAccess);
          document.cookie = `accessToken=${newAccess}; path=/; max-age=3600;`;
          
          // 막혔던 원래 요청에 새 토큰 끼워서 다시 보내기!
          headers.set("Authorization", `Bearer ${newAccess}`);
          response = await fetch(url, { ...options, headers });
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        // 재발급도 실패하면 토큰 다 지우고 쫓아내기
        localStorage.clear();
        document.cookie = "accessToken=; path=/; max-age=0;";
        window.location.href = "/login";
      }
    } else {
      // 리프레시 토큰조차 없으면 쫓아내기
      localStorage.clear();
      document.cookie = "accessToken=; path=/; max-age=0;";
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || "API Error", errorData.code);
  }

  const data = await response.json();
  return data.data !== undefined ? data.data : data;
}

// 컴포넌트에서 가져다 쓸 실제 API 메서드들
export const apiClient = {
  // --- Auth & User ---
  // postAuthGoogle: (idToken: string) => 
  //   request<any>("/auth/google", { method: "POST", body: JSON.stringify({ idToken }) }),
  // getMe: () => request<any>("/me"),
  // getMeCompany: () => request<any>("/me/company"),

  postAuthDemo: (email: string) => 
    request<any>("/auth/demo-login", { 
      method: "POST", 
      body: JSON.stringify({ channel: "web", email })
    }),

  // --- Lessons ---
  getLessons: (queryString: string = "") => 
    request<any>(`/lessons${queryString ? `?${queryString}` : ""}`),

  // --- Instructors (강사 DB) ---
  getInstructorById: (id: string) => request<any>(`/instructors/${id}`),

  // --- Contracts (뼈대) ---
  getContracts: () => request<any>("/contracts"),

  // --- Attendance (뼈대) ---
  getAttendances: () => request<any>("/attendances"),

  // --- Chat (뼈대) ---
  getChatRooms: () => request<any>("/chat/rooms"),
};