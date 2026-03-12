import { ApiError } from "./apiError";
import { LessonGpsStatus } from "../types/backend";

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
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
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
          const newRefresh = refreshData.data?.refreshToken || refreshData.refreshToken;
          
          // 새 토큰 저장 (로컬 + 쿠키)
          localStorage.setItem("accessToken", newAccess);
          document.cookie = `accessToken=${newAccess}; path=/; max-age=3600; SameSite=Lax;`;
          
          if (newRefresh) {
            localStorage.setItem("refreshToken", newRefresh);
            document.cookie = `refreshToken=${newRefresh}; path=/; max-age=604800; SameSite=Lax;`;
          }
          
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
    console.error(`[API Error] ${response.status} ${url}:`, errorData);
    throw new ApiError(response.status, errorData.message || "API Error", errorData.code);
  }

  // 204 No Content 혹은 빈 응답 처리
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));
  // console.log(`[API Success] ${url}:`, data);
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

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      document.cookie = "accessToken=; path=/; max-age=0;";
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

  // 완료 계약 PDF 파일 열람 (Blob) - GET /contracts/:contractId/final-pdf/file
  getContractFinalPdfFile: async (contractId: string) => {
    const token = getToken();
    const url = `${BASE_URL}/contracts/${contractId}/final-pdf/file`;
    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (!response.ok) throw new Error("PDF 파일을 불러오지 못했습니다.");
    return await response.blob();
  },

  // PDF 수동 재생성 - POST /contracts/:contractId/final-pdf/regenerate
  regenerateContractFinalPdf: (contractId: string) =>
    request<any>(`/contracts/${contractId}/final-pdf/regenerate`, { method: "POST" }),

  // --- Settlements ---
  // 월별 정산 조회 - GET /settlements?month=YYYY-MM
  getSettlements: (month?: string) =>
    request<any>(`/settlements${month ? `?month=${month}` : ""}`),

  // --- Notification Settings ---
  // 알림 설정 조회 - GET /notification-settings/me
  getNotificationSettings: () => request<any>("/notification-settings/me"),
  updateNotificationSettings: (payload: { 
    pushEnabled?: boolean; 
    lessonReminder?: boolean;
    paymentNotification?: boolean;
    chatNotification?: boolean;
  }) =>
    request<any>("/notification-settings/me", { method: "PATCH", body: JSON.stringify(payload) }),

  // --- Company ---
  // 현재 회사 정보 조회 - GET /companies/current (OwnerGuard)
  getCurrentCompany: () => request<any>("/companies/current"),

  // 회사 대표 도장 메타데이터 조회 - GET /companies/current/seal-image
  getCompanySealMetadata: () => request<any>("/companies/current/seal-image"),

  // 회사 대표 도장 업로드 - PUT /companies/current/seal-image
  updateCompanySeal: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<any>("/companies/current/seal-image", {
      method: "PUT",
      body: formData,
    });
  },

  // 회사 대표 도장 파일 조회 (Blob 형식) - GET /companies/current/seal-image/file
  getCompanySealFile: async () => {
    const token = getToken();
    const url = `${BASE_URL}/companies/current/seal-image/file`;
    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (!response.ok) throw new Error("도장 파일을 불러오지 못했습니다.");
    return await response.blob();
  },

  // --- Attendance ---
  getAttendances: () => request<any>("/attendances"),
  // 오늘 수업 GPS 요약 상태 - GET /lessons/gps-status?date=YYYY-MM-DD
  getGpsStatus: (date: string) => 
    request<LessonGpsStatus[]>(`/lessons/gps-status?date=${date}`),

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