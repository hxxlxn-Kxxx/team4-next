// src/lib/apiClient.ts
import { ApiError } from "./apiError";

// 백엔드 명세에는 API_URL이지만, 기존에 쓰시던 API_BASE_URL도 호환되게 함.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

const setCookie = (name: string, value: string, maxAge: number) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax;`;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax;`;
};

export const persistAuthSession = (accessToken: string, refreshToken?: string | null) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_COOKIE, accessToken);
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_COOKIE, refreshToken);
    setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE);
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_COOKIE);
  localStorage.removeItem(REFRESH_TOKEN_COOKIE);
  localStorage.removeItem("user");
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
};

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_COOKIE);
  }
  return null;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_COOKIE);
    
    if (refreshToken) {
      try {
        // 재발급 API 찌르기
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await parseResponseBody(refreshRes) as
            | { data?: { accessToken?: string; refreshToken?: string }; accessToken?: string; refreshToken?: string }
            | null;
          const newAccess = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefresh = refreshData?.data?.refreshToken || refreshData?.refreshToken || refreshToken;

          if (!newAccess) {
            throw new Error("Refresh response missing access token");
          }
          
          persistAuthSession(newAccess, newRefresh);
          
          // 막혔던 원래 요청에 새 토큰 끼워서 다시 보내기!
          headers.set("Authorization", `Bearer ${newAccess}`);
          response = await fetch(url, { ...options, headers });
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        // 재발급도 실패하면 토큰 다 지우고 쫓아내기
        clearAuthSession();
        window.location.href = "/login";
      }
    } else {
      // 리프레시 토큰조차 없으면 쫓아내기
      clearAuthSession();
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const errorData = await parseResponseBody(response);
    if (errorData && typeof errorData === "object" && !Array.isArray(errorData)) {
      const normalized = errorData as { message?: string; code?: string };
      throw new ApiError(response.status, normalized.message || "API Error", normalized.code);
    }

    throw new ApiError(
      response.status,
      typeof errorData === "string" ? errorData : "API Error",
    );
  }

  const data = await parseResponseBody(response);

  if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
    return (data as { data: T }).data;
  }

  return data as T;
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

  logout: () => {
    if (typeof window !== "undefined") {
      clearAuthSession();
      window.location.href = "/login";
    }
  },

  // --- Lessons ---
  getLessons: (queryString: string = "") => 
    request<any>(`/lessons${queryString ? `?${queryString}` : ""}`),

  // --- Instructors (강사 DB) ---
  getInstructorById: (id: string) => request<any>(`/instructors/${id}`),
  // 강사 목록 조회 API
  getInstructors: () => 
    request<any>("/instructors"),

  // 강사 운영 리스트 - GET /instructors/operations?month=YYYY-MM
  getInstructorOperations: (month: string) =>
    request<any>(`/instructors/operations?month=${month}`),

  // 강사 주간 가용성 매트릭스 - GET /instructors/weekly-availability?startDate=YYYY-MM-DD
  getInstructorWeeklyAvailability: (startDate: string) =>
    request<any>(`/instructors/weekly-availability?startDate=${startDate}`),

  // --- Contracts ---
  getContracts: (queryString: string = "") => request<any>(`/contracts${queryString ? `?${queryString}` : ""}`),
  getContractById: (contractId: string) => request<any>(`/contracts/${contractId}`),

  // 계약 생성 (관리자) - POST /contracts
  createContract: (payload: { lessonId: string; documentFileKey?: string | null }) =>
    request<any>("/contracts", { method: "POST", body: JSON.stringify(payload) }),

  // 계약 발송 (관리자) - POST /contracts/:contractId/send
  sendContract: (contractId: string) =>
    request<any>(`/contracts/${contractId}/send`, { method: "POST" }),

  // 재인증 토큰 발급 (서명 전 재인증) - POST /contracts/:contractId/reauth
  reauthContract: (contractId: string) =>
    request<any>(`/contracts/${contractId}/reauth`, { method: "POST" }),

  // 관리자 서명 - POST /contracts/:contractId/sign
  signContract: (contractId: string, payload: { consentGiven: boolean; consentTextVersion: string; signToken: string; signatureFileKey?: string; ipAddress?: string }) =>
    request<any>(`/contracts/${contractId}/sign`, { method: "POST", body: JSON.stringify(payload) }),

  // --- Settlements ---
  // 월별 정산 조회 - GET /settlements?month=YYYY-MM
  getSettlements: (month?: string) =>
    request<any>(`/settlements${month ? `?month=${month}` : ""}`),

  // --- Notification Settings ---
  // 알림 설정 조회 - GET /me/notification-settings
  getNotificationSettings: () => request<any>("/me/notification-settings"),
  // 알림 설정 저장 - PUT /me/notification-settings
  updateNotificationSettings: (payload: { pushEnabled: boolean }) =>
    request<any>("/me/notification-settings", { method: "PUT", body: JSON.stringify(payload) }),

  // --- Company ---
  // 현재 회사 정보 조회 - GET /companies/current (OwnerGuard)
  getCurrentCompany: () => request<any>("/companies/current"),

  // --- Attendance ---
  getAttendances: () => request<any>("/attendances"),
  getAttendanceEvents: (params: { lessonId?: string; eventType?: string }) => {
    const qs = new URLSearchParams();
    if (params.lessonId) qs.set("lessonId", params.lessonId);
    if (params.eventType) qs.set("eventType", params.eventType);
    return request<any>(`/attendance-events${qs.toString() ? `?${qs}` : ""}`);
  },

  // --- Chat ---
  getChatRooms: () => request<any>("/chat/rooms"),
  getChatMessages: (roomId: string, cursor?: string) =>
    request<any>(`/chat/rooms/${roomId}/messages${cursor ? `?cursor=${cursor}` : ""}`),
  sendChatMessage: (roomId: string, content: string) =>
    request<any>(`/chat/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  readRoom: (roomId: string) =>
    request<any>(`/chat/rooms/${roomId}/read`, { method: "POST" }),
  getUnreadCount: () => request<any>("/chat/unread-count"),

  //  카카오 장소 검색 API
  searchVenue: (query: string) => 
    request<any>(`/lessons/venue-search?query=${query}`),

  //  수업 생성 API
  createLesson: (payload: any) => 
    request<any>("/lessons", { method: "POST", body: JSON.stringify(payload) }),

  //  가용 강사 조회 API (시작/종료 시간 기준)
  getAvailableInstructors: (startsAt: string, endsAt: string) => 
    request<any>(`/lessons/available-instructors?startsAt=${startsAt}&endsAt=${endsAt}`),

    // --- 배정 및 요청 관련 ---
  
  // 강사 배정 요청 (관리자) - POST /lessons/:lessonId/assign
  assignInstructor: (lessonId: string, instructorId: string) => 
    request<any>(`/lessons/${lessonId}/assign`, { 
      method: "POST", 
      body: JSON.stringify({ instructorId }) 
    }),

  // 배정 요청 응답 (강사/관리자 테스트용) - POST /assignments/:requestId/respond
  // 백엔드 사양: { status: 'ACCEPTED' | 'REJECTED' }
  respondAssignment: (requestId: string, payload: { status: "ACCEPTED" | "REJECTED" }) =>
    request<any>(`/assignments/${requestId}/respond`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

    // --- 수업 상세 및 액션 ---

  // 수업 상세 조회 API
  getLessonDetail: (lessonId: string) => 
    request<any>(`/lessons/${lessonId}`),

  // 수업 수정 API (PATCH)
  updateLesson: (lessonId: string, payload: any) => 
    request<any>(`/lessons/${lessonId}`, { 
      method: "PATCH", 
      body: JSON.stringify(payload) 
    }),

  // 수업 취소 API (POST) - DELETE나 PATCH /cancel이 아님을 주의!
  cancelLesson: (lessonId: string, payload?: any) => 
    request<any>(`/lessons/${lessonId}/cancel`, { 
      method: "POST",
      body: JSON.stringify(payload || {}) 
    }),

  // (선택) 추천 강사 조회 API
  getRecommendations: (lessonId: string) => 
    request<any>(`/lessons/${lessonId}/recommendations`),

  // 강의 보고서 조회 - GET /lesson-reports?lessonId=
  getLessonReports: (lessonId: string) =>
    request<any>(`/lesson-reports?lessonId=${lessonId}`),

  // ==========================================
  // 수업 장소 관리 (Lesson Locations)
  // ==========================================
  getLessonLocations: (params?: { query?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append("query", params.query);
    if (params?.status) searchParams.append("status", params.status);
    const qs = searchParams.toString();
    return request<any>(`/lesson-locations${qs ? `?${qs}` : ""}`);
  },
  getLessonLocationById: (locationId: string) =>
    request<any>(`/lesson-locations/${locationId}`),
  createLessonLocation: (data: any) =>
    request<any>("/lesson-locations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateLessonLocation: (locationId: string, data: any) =>
    request<any>(`/lesson-locations/${locationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ==========================================
  // 외부 계약서 관리 (Documents)
  // ==========================================
  uploadDocument: (file: File, type: "CONTRACT_IMAGE" | "CONTRACT_PDF") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return request<any>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  },
  extractDocumentDraft: (documentId: string, ocrText?: string, clientMetadata?: Record<string, unknown>) =>
    request<any>(`/documents/${documentId}/extract`, {
      method: "POST",
      body: JSON.stringify({ ocrText, clientMetadata }),
    }),
  getDocument: (documentId: string) =>
    request<any>(`/documents/${documentId}`),
  updateDocumentDraft: (documentId: string, parsedJson: object) =>
    request<any>(`/documents/${documentId}/draft`, {
      method: "PATCH",
      body: JSON.stringify({ parsedJson }),
    }),
  confirmDocument: (documentId: string) =>
    request<any>(`/documents/${documentId}/confirm`, {
      method: "POST",
    }),
};
