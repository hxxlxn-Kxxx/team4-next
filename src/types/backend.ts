/**
 * Backend Mock API Types (free-b 기준)
 *
 * 이 파일은 백엔드(free-b)의 service-plan.mock.ts에서 정의된 enum과 타입들을
 * 프론트엔드에서 일관되게 사용하기 위한 참조 파일입니다.
 *
 * 규칙:
 * - 시간: UTC ISO 8601 형식 (예: 2026-03-10T01:00:00Z)
 * - 상태값/필드명은 모두 영문 enum 기준
 * - UI 표시용 한국어 변환은 각 페이지에서 수행
 */

// ============ Lesson Status Enum ============
export type LessonStatus =
  | "PENDING" // 미배정: 강사 배정 대기 중
  | "ACCEPTED" // 요청중: 강사 요청 상태
  | "CONTRACT_SIGNED" // 확정: 계약 완료
  | "UPDATED" // 수정됨: 수업 정보 변경됨
  | "IN_PROGRESS" // 진행중: 현재 진행 중
  | "COMPLETED" // 완료: 수업 종료
  | "CANCELLED"; // 취소: 수업 취소

export const LESSON_STATUS_MAP: Record<LessonStatus, string> = {
  PENDING: "미배정",
  ACCEPTED: "요청중",
  CONTRACT_SIGNED: "확정",
  UPDATED: "수정됨",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

// ============ Lesson Request Status Enum ============
export type LessonRequestStatus =
  | "PENDING" // 요청 대기
  | "ACCEPTED" // 승인됨
  | "REJECTED" // 거절됨
  | "CANCELLED"; // 취소됨

export const LESSON_REQUEST_STATUS_MAP: Record<LessonRequestStatus, string> = {
  PENDING: "대기중",
  ACCEPTED: "승인",
  REJECTED: "거절",
  CANCELLED: "취소",
};

// ============ Contract Status Enum ============
export type ContractStatus =
  | "DRAFT" // 초안: 계약서 작성 중
  | "SENT" // 발송: 강사에게 발송됨
  | "INSTRUCTOR_SIGNED" // 열람: 강사 서명 대기
  | "FULLY_SIGNED" // 서명완료: 계약 체결 완료
  | "VOID"; // 무효: 계약 파기

export const CONTRACT_STATUS_MAP: Record<ContractStatus, string> = {
  DRAFT: "초안",
  SENT: "발송",
  INSTRUCTOR_SIGNED: "열람",
  FULLY_SIGNED: "서명완료",
  VOID: "무효",
};

// ============ Attendance Event Type Enum ============
export type AttendanceEventType =
  | "DEPART" // 출발
  | "ARRIVE" // 도착
  | "FINISH"; // 종료

export const ATTENDANCE_EVENT_TYPE_MAP: Record<AttendanceEventType, string> = {
  DEPART: "출발",
  ARRIVE: "도착",
  FINISH: "종료",
};

// ============ Field Name Constants ============
export const FIELD_NAMES = {
  lectureTitle: "lectureTitle", // 수업 제목
  region: "region", // 지역
  museum: "museum", // 박물관/장소
  guideNotionUrl: "guideNotionUrl", // 지도안 노션 URL
  lessonDetails: "lessonDetails", // 수업 상세 내용
  deliveryNotes: "deliveryNotes", // 전달사항
  rejectionReason: "rejectionReason", // 거절 사유
  cooldownUntil: "cooldownUntil", // 재요청 가능 시간
  availableStartAt: "availableStartAt", // 가용 시작 시간
  availableEndAt: "availableEndAt", // 가용 종료 시간
} as const;

// ============ UTC ISO 8601 Conversion Utils ============
/**
 * 로컬 날짜-시간을 UTC ISO 8601 형식으로 변환
 * @param date ISO 8601 날짜 형식 (YYYY-MM-DD)
 * @param time HH:MM 형식 시간
 * @returns UTC ISO 8601 형식 (YYYY-MM-DDTHH:MM:00Z)
 */
export const convertToUTCISO8601 = (date: string, time: string): string => {
  if (!date || !time) return "";
  return `${date}T${time}:00Z`;
};

/**
 * UTC ISO 8601 형식을 파싱하여 로컬 표시용 날짜-시간으로 변환
 * @param iso8601 UTC ISO 8601 형식 (2026-03-10T01:00:00Z)
 * @returns { date: string, time: string } 날짜(YYYY-MM-DD)와 시간(HH:MM)
 */
export const parseUTCISO8601 = (
  iso8601: string,
): { date: string; time: string } => {
  const date = new Date(iso8601);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

// ============ Color Mapping Utils ============
/**
 * 계약 상태에 따른 MUI Chip 색상 반환
 */
export const getContractStatusColor = (
  status: ContractStatus,
): "default" | "primary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case "FULLY_SIGNED":
      return "success"; // 초록색
    case "INSTRUCTOR_SIGNED":
      return "warning"; // 주황색
    case "SENT":
      return "info"; // 파란색
    case "DRAFT":
      return "default"; // 회색
    case "VOID":
      return "error"; // 빨간색
    default:
      return "default";
  }
};

/**
 * 수업 상태에 따른 MUI Chip 색상 반환
 */
export const getLessonStatusColor = (
  status: LessonStatus,
): "default" | "primary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case "CONTRACT_SIGNED":
    case "COMPLETED":
      return "success"; // 초록색
    case "ACCEPTED":
    case "IN_PROGRESS":
      return "warning"; // 주황색
    case "PENDING":
      return "error"; // 빨간색
    case "CANCELLED":
      return "error"; // 빨간색
    default:
      return "default";
  }
};
