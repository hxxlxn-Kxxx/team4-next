"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Typography, Button, Paper, Grid, Chip, CircularProgress, Divider,
  Alert, Stack, Link, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment,
  Tab, Tabs,
} from "@mui/material";
import {
  ArrowBack, CalendarMonth, LocationOn, Person, AttachMoney,
  People, Description, Edit, Block, Map,
  DirectionsWalk, Place, CheckCircle, AccessTime, MyLocation,
  Refresh, AssignmentInd, InfoOutlined, AutoAwesome,
} from "@mui/icons-material";
import {
  LESSON_STATUS_MAP, type LessonStatus, LESSON_SOURCE_TYPE_MAP, type LessonSourceType,
} from "@/src/types/backend";
import { apiClient } from "@/src/lib/apiClient";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type LessonDetail = {
  lessonId?: string;
  id?: string;
  lectureTitle?: string;
  startsAt?: string;
  endsAt?: string;
  payAmount?: number;
  studentCount?: number;
  region?: string;
  museum?: string;
  guideNotionUrl?: string;
  lessonDetails?: string;
  deliveryNotes?: string;
  instructorName?: string;
  status?: LessonStatus;
  classStatus?: string;
  venueName?: string;
  venueAddress?: string;
  venueLat?: number;
  venueLng?: number;
  kakaoPlaceId?: string;
  sourceType?: LessonSourceType | null;
};

type AvailableInstructor = {
  instructorId?: string;
  id?: string;
  instructorName?: string;
  name?: string;
};

type RecommendationMetrics = {
  matchingSlotCount: number;
  preferredRegionMatched: boolean;
  acceptanceRate: number;
  lateCount90d: number;
  noShowEstimateCount90d: number;
  completedLessonCount90d: number;
};

type Recommendation = {
  instructorId: string;
  name: string;
  email?: string;
  phone?: string;
  residenceArea?: string;
  majorField?: string;
  certificates: string[];
  score: number;
  reasons: string[];
  riskFlags: string[];
  metrics: RecommendationMetrics;
  confidenceLabel?: string;
  fitSummary?: string;
  primaryReason?: string;
  etaMinutes?: number;
  distanceKm?: number;
};

type LessonReport = {
  lessonReportId: string;
  instructorId: string;
  content: string;
  submittedAt: string;
};

type AttendanceEvent = {
  attendanceEventId: string;
  lessonId: string;
  instructorId: string;
  eventType: "DEPART" | "ARRIVE" | "FINISH";
  occurredAt: string;
  lat?: number;
  lng?: number;
  accuracyMeters?: number | null;
  distanceMeters?: number | null;
  timingStatus: "ON_TIME" | "LATE";
  locationStatus: "OK" | "SUSPICIOUS";
  isValid?: boolean;
};

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const CLASS_STATUS_MAP: Record<string, { label: string; color: any }> = {
  ...LESSON_STATUS_MAP,
  SCHEDULED: { label: "배정 완료", color: "primary" },
};

const EVENT_TYPE_MAP: Record<AttendanceEvent["eventType"], { label: string; icon: React.ReactNode; color: string }> = {
  DEPART: { label: "출발", icon: <DirectionsWalk fontSize="small" />, color: "#1565C0" },
  ARRIVE: { label: "도착", icon: <Place fontSize="small" />, color: "#2E7D32" },
  FINISH: { label: "완료", icon: <CheckCircle fontSize="small" />, color: "#6A1B9A" },
};

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
};

const formatUtcToLocal = (utcString?: string) => {
  if (!utcString) return "-";
  const d = new Date(utcString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatForInput = (utcString?: string) => {
  if (!utcString) return "";
  const d = new Date(utcString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

// ─────────────────────────────────────────────
// 추천 강사 패널 컴포넌트
// ─────────────────────────────────────────────
function RecommendationsPanel({
  lessonId,
  onAssign,
  isCanceled,
}: {
  lessonId: string;
  onAssign: () => void;
  isCanceled: boolean;
}) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRecommendations(lessonId);
      const list: Recommendation[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setRecs(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">AI 추천 강사</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            수업 일정·지역·강사 이력을 종합해 추천된 강사 목록입니다.
          </Typography>
        </Box>
        {!isCanceled && (
          <Button variant="outlined" size="small" onClick={onAssign}>직접 배정하기</Button>
        )}
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : recs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, px: 3, bgcolor: "#f8f9fa", borderRadius: 3, border: "1px dashed #E0E0E0" }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#FFF", display: "grid", placeItems: "center", mx: "auto", mb: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", color: "text.secondary" }}>
            <AutoAwesome sx={{ fontSize: 24, opacity: 0.6 }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>적합한 추천 강사를 찾지 못했습니다</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 460, mx: "auto", lineHeight: 1.6 }}>
            현재 조건(일정, 지역, 자격 요건 등)에 완벽히 부합하는 강사 풀이 부족하거나,
            강사들이 아직 일정을 충분히 제출하지 않았을 수 있습니다.
          </Typography>

          {/* 원인 안내 박스 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mb: 5 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "#FFF", border: "1px solid #E8E8E8", borderRadius: 2, width: { xs: "100%", sm: "32%" } }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>가용 강사 부족</Typography>
              <Typography variant="caption" color="text.secondary">동일 시간대 다른 수업에 배정되었거나 가능한 일정이 없습니다.</Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "#FFF", border: "1px solid #E8E8E8", borderRadius: 2, width: { xs: "100%", sm: "32%" } }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>일정 제출 대기</Typography>
              <Typography variant="caption" color="text.secondary">강사들이 아직 이번 주/달 일정을 확정하지 않았을 수 있습니다.</Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "#FFF", border: "1px solid #E8E8E8", borderRadius: 2, width: { xs: "100%", sm: "32%" } }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>수업 조건 확인</Typography>
              <Typography variant="caption" color="text.secondary">수업 장소나 요구 자격이 맞지 않거나 누락되었을 수 있습니다.</Typography>
            </Paper>
          </Stack>

          {/* CTA 버튼들 */}
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" gap={1}>
            {!isCanceled && (
              <Button 
                variant="contained" 
                startIcon={<AssignmentInd />}
                onClick={onAssign}
                sx={{ borderRadius: 2, px: 3, boxShadow: "none" }}
              >
                직접 배정하기
              </Button>
            )}
            <Button 
              variant="outlined" 
              color="inherit"
              startIcon={<InfoOutlined />}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              sx={{ borderRadius: 2, borderColor: "#E0E0E0", color: "text.secondary" }}
            >
              수업 정보 확인
            </Button>
            <Button 
              variant="text" 
              color="inherit"
              startIcon={<Refresh />}
              onClick={loadRecs}
              sx={{ borderRadius: 2, color: "text.secondary" }}
            >
              새로고침
            </Button>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={2}>
          {recs.map((rec, idx) => (
            <Paper
              key={rec.instructorId}
              elevation={0}
              sx={{
                p: 3, border: "1px solid #E8E8E8", borderRadius: 2,
                borderLeft: `4px solid ${idx === 0 ? "#F3C742" : "#E0E0E0"}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    {idx === 0 && (
                      <Chip label="추천 1순위" size="small" sx={{ bgcolor: "#FFF8E1", color: "#B7791F", fontWeight: 700, fontSize: "0.7rem" }} />
                    )}
                    <Typography fontWeight="bold">{rec.name}</Typography>
                    {rec.majorField && (
                      <Typography variant="caption" color="text.secondary">{rec.majorField}</Typography>
                    )}
                    {rec.confidenceLabel && (
                      <Chip label={rec.confidenceLabel} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} color="primary" />
                    )}
                  </Stack>

                  {/* 핵심 추천 사유 및 설명 */}
                  {rec.primaryReason && (
                    <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
                      ✨ {rec.primaryReason}
                    </Typography>
                  )}
                  {rec.fitSummary && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {rec.fitSummary}
                    </Typography>
                  )}

                  {/* 추천 이유 */}
                  {rec.reasons?.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
                      {rec.reasons.map((r) => (
                        <Chip key={r} label={r} size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontSize: "0.7rem" }} />
                      ))}
                    </Stack>
                  )}

                  {/* 리스크 플래그 */}
                  {rec.riskFlags?.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
                      {rec.riskFlags.map((r) => (
                        <Chip key={r} label={r} size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontSize: "0.7rem" }} />
                      ))}
                    </Stack>
                  )}

                  {/* 이동 관련 정보 & metrics */}
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1, alignItems: "center" }}>
                    {(rec.distanceKm !== undefined || rec.etaMinutes !== undefined) && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        🚗 {rec.distanceKm !== undefined ? `${rec.distanceKm.toFixed(1)}km` : ""}
                        {rec.distanceKm !== undefined && rec.etaMinutes !== undefined ? " / " : ""}
                        {rec.etaMinutes !== undefined ? `약 ${rec.etaMinutes}분` : ""}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      수락률 {Math.round((rec.metrics?.acceptanceRate || 0) * 100)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      90일 완료 {rec.metrics?.completedLessonCount90d || 0}건
                    </Typography>
                    <Typography variant="caption" color={(rec.metrics?.lateCount90d || 0) > 0 ? "error" : "text.secondary"}>
                      지각 {rec.metrics?.lateCount90d || 0}건
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      가용 슬롯 {rec.metrics?.matchingSlotCount || 0}개
                    </Typography>
                  </Stack>
                </Box>

                {/* 점수 뱃지 */}
                <Box
                  sx={{
                    ml: 2, minWidth: 52, textAlign: "center",
                    bgcolor: rec.score >= 70 ? "#E8F5E9" : "#FFF3E0",
                    color: rec.score >= 70 ? "#2E7D32" : "#E65100",
                    borderRadius: 2, px: 1.5, py: 0.75,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" lineHeight={1}>{rec.score}</Typography>
                  <Typography variant="caption">점</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ─────────────────────────────────────────────
// 강의 보고서 패널 컴포넌트
// ─────────────────────────────────────────────
function LessonReportsPanel({ lessonId }: { lessonId: string }) {
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getLessonReports(lessonId);
        const list: LessonReport[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setReports(list);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [lessonId]);

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>강의 보고서</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        강사가 수업 완료 후 제출한 보고서입니다.
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : reports.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#f8f9fa", borderRadius: 2 }}>
          <Typography color="text.secondary">제출된 강의 보고서가 없습니다.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            수업 완료 후 강사가 보고서를 제출하면 여기에 표시됩니다.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {reports.map((report) => (
            <Paper
              key={report.lessonReportId}
              elevation={0}
              sx={{ p: 3, border: "1px solid #E8E8E8", borderRadius: 2, bgcolor: "#FAFAFA" }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Chip
                  label="보고서 제출 완료"
                  size="small"
                  sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
                />
                <Typography variant="caption" color="text.secondary">
                  제출일: {new Date(report.submittedAt).toLocaleString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Typography>
              </Stack>
              <Box
                sx={{
                  p: 2, bgcolor: "#fff", borderRadius: 1.5,
                  border: "1px solid #E0E0E0",
                  whiteSpace: "pre-wrap", lineHeight: 1.8,
                }}
              >
                <Typography variant="body2">{report.content}</Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ─────────────────────────────────────────────
// 체크인 타임라인 컴포넌트
// ─────────────────────────────────────────────
function CheckinTimeline({ lessonId }: { lessonId: string }) {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getAttendanceEvents({ lessonId });
        const list: AttendanceEvent[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        // occurredAt 오름차순 정렬
        list.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
        setEvents(list);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [lessonId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  if (events.length === 0) {
    return (
      <Box
        sx={{ textAlign: "center", py: 6, color: "text.secondary", bgcolor: "#f8f9fa", borderRadius: 2 }}
      >
        <MyLocation sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
        <Typography>기록된 체크인 이벤트가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0}>
      {events.map((event, idx) => {
        const meta = EVENT_TYPE_MAP[event.eventType];
        const isLast = idx === events.length - 1;

        return (
          <Box key={event.attendanceEventId} sx={{ display: "flex", gap: 2 }}>
            {/* 타임라인 라인 + 아이콘 */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "50%",
                  bgcolor: meta.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, zIndex: 1,
                }}
              >
                {meta.icon}
              </Box>
              {!isLast && (
                <Box sx={{ width: 2, flexGrow: 1, bgcolor: "#E0E0E0", my: 0.5 }} />
              )}
            </Box>

            {/* 이벤트 카드 */}
            <Paper
              elevation={0}
              sx={{
                flex: 1, p: 2.5, mb: isLast ? 0 : 2,
                border: "1px solid #E8E8E8", borderRadius: 2,
                bgcolor: "#FAFAFA",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography fontWeight={700} sx={{ color: meta.color }}>
                  {meta.label}
                </Typography>
                {/* timingStatus 배지 */}
                <Chip
                  label={event.timingStatus === "ON_TIME" ? "정시" : "지각"}
                  size="small"
                  sx={{
                    fontWeight: 700, fontSize: "0.7rem",
                    bgcolor: event.timingStatus === "ON_TIME" ? "#E8F5E9" : "#FFEBEE",
                    color: event.timingStatus === "ON_TIME" ? "#2E7D32" : "#C62828",
                  }}
                />
                {/* locationStatus 배지 */}
                <Chip
                  label={event.locationStatus === "OK" ? "위치 정상" : "위치 의심"}
                  size="small"
                  sx={{
                    fontWeight: 700, fontSize: "0.7rem",
                    bgcolor: event.locationStatus === "OK" ? "#E8F5E9" : "#FFF3E0",
                    color: event.locationStatus === "OK" ? "#2E7D32" : "#E65100",
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(event.occurredAt)}
                  </Typography>
                </Stack>
                {event.distanceMeters != null && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOn sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      거리 {event.distanceMeters}m
                    </Typography>
                  </Stack>
                )}
                {event.accuracyMeters != null && (
                  <Typography variant="body2" color="text.secondary">
                    정확도 ±{event.accuracyMeters}m
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Box>
        );
      })}
    </Stack>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
export default function ClassDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tabIndex, setTabIndex] = useState(0);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableInstructors, setAvailableInstructors] = useState<AvailableInstructor[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [editFormData, setEditFormData] = useState({
    lectureTitle: "", startsAt: "", endsAt: "", payAmount: "", studentCount: "",
    region: "", museum: "", venueName: "", venueAddress: "",
    guideNotionUrl: "", lessonDetails: "", deliveryNotes: "",
  });

  const fetchLessonDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getLessonDetail(id as string);
      setLesson(data.data || data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchLessonDetail();
  }, [id, fetchLessonDetail]);

  const handleOpenAssignModal = async () => {
    if (!lesson?.startsAt || !lesson?.endsAt) return alert("수업 시간이 없어 강사 목록을 조회할 수 없습니다.");
    setIsAssignModalOpen(true);
    setIsFetchingInstructors(true);
    try {
      const data = await apiClient.getAvailableInstructors(
        new Date(lesson.startsAt).toISOString(),
        new Date(lesson.endsAt).toISOString()
      );
      setAvailableInstructors(Array.isArray(data) ? data : data.data || []);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsFetchingInstructors(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedInstructorId) return;
    setIsAssigning(true);
    try {
      await apiClient.assignInstructor(id as string, selectedInstructorId);
      alert("강사에게 배정 요청을 성공적으로 보냈습니다!");
      setIsAssignModalOpen(false);
      setSelectedInstructorId("");
      fetchLessonDetail();
    } catch (err: unknown) {
      alert(`배정 요청 실패: ${getErrorMessage(err)}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelLesson = async () => {
    if (!window.confirm("정말 이 수업을 취소하시겠습니까?")) return;
    setIsCanceling(true);
    try {
      await apiClient.cancelLesson(id as string);
      alert("수업이 취소되었습니다.");
      fetchLessonDetail();
    } catch (err: unknown) {
      alert(`취소 실패: ${getErrorMessage(err)}`);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOpenEdit = () => {
    if (!lesson) return;
    setEditFormData({
      lectureTitle: lesson.lectureTitle || "",
      startsAt: formatForInput(lesson.startsAt),
      endsAt: formatForInput(lesson.endsAt),
      payAmount: lesson.payAmount != null ? String(lesson.payAmount) : "",
      studentCount: lesson.studentCount != null ? String(lesson.studentCount) : "",
      region: lesson.region || "",
      museum: lesson.museum || "",
      venueName: lesson.venueName || "",
      venueAddress: lesson.venueAddress || "",
      guideNotionUrl: lesson.guideNotionUrl || "",
      lessonDetails: lesson.lessonDetails || "",
      deliveryNotes: lesson.deliveryNotes || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateLesson = async () => {
    if (new Date(editFormData.startsAt) >= new Date(editFormData.endsAt)) {
      return alert("종료 시간이 시작 시간보다 빠를 수 없습니다.");
    }
    setIsUpdating(true);
    try {
      const payload = {
        ...editFormData,
        payAmount: Number(editFormData.payAmount),
        studentCount: Number(editFormData.studentCount),
        startsAt: new Date(editFormData.startsAt).toISOString(),
        endsAt: new Date(editFormData.endsAt).toISOString(),
      };
      await apiClient.updateLesson(id as string, payload);
      alert("정보가 수정되었습니다.");
      setIsEditing(false);
      fetchLessonDetail();
    } catch (err: unknown) {
      alert(`수정 실패: ${getErrorMessage(err)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="textSecondary">수업 상세 정보를 불러오는 중입니다...</Typography>
      </Box>
    );
  }

  if (error || !lesson) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()}>목록으로 돌아가기</Button>
        <Alert severity="error" sx={{ fontSize: "1.1rem", py: 2, mt: 2 }}>{error || "데이터를 찾을 수 없습니다."}</Alert>
      </Box>
    );
  }

  const isCanceled = lesson.classStatus === "CANCELLED" || lesson.status === "CANCELLED";
  const currentStatus = lesson.classStatus || lesson.status || "";
  const lessonId = lesson.lessonId || lesson.id || (id as string);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 10 }}>
      {/* 상단 헤더 및 버튼 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mr: 2 }} disabled={isEditing}>목록</Button>
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>수업 상세 정보</Typography>

        {!isCanceled && (
          <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
            {isEditing ? (
              <>
                <Button variant="outlined" color="inherit" onClick={handleCancelEdit} disabled={isUpdating}>취소</Button>
                <Button variant="contained" color="primary" onClick={handleUpdateLesson} disabled={isUpdating}>{isUpdating ? "저장 중..." : "저장 완료"}</Button>
              </>
            ) : (
              <>
                <Button variant="outlined" color="primary" startIcon={<Edit />} onClick={handleOpenEdit}>수정</Button>
                <Button variant="outlined" color="error" startIcon={<Block />} onClick={handleCancelLesson} disabled={isCanceling}>{isCanceling ? "취소 중..." : "수업 취소"}</Button>
              </>
            )}
          </Stack>
        )}
        <Chip label={CLASS_STATUS_MAP[currentStatus]?.label || currentStatus} color={CLASS_STATUS_MAP[currentStatus]?.color || "warning"} sx={{ fontWeight: "bold", fontSize: "1rem", py: 2.5, px: 1 }} />
      </Box>

      {/* 외부 import 안내 배너 */}
      {lesson.sourceType === "EXTERNAL_DOCUMENT" && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2, "& .MuiAlert-message": { width: "100%" } }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {LESSON_SOURCE_TYPE_MAP.EXTERNAL_DOCUMENT.label}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {LESSON_SOURCE_TYPE_MAP.EXTERNAL_DOCUMENT.description}
          </Typography>
        </Alert>
      )}

      {/* 탭 메뉴 */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{ mb: 3, borderBottom: "1px solid #eee" }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="기본 정보" sx={{ fontWeight: "bold" }} />
        <Tab label="체크인 현황" sx={{ fontWeight: "bold" }} />
        <Tab label="추천 강사" sx={{ fontWeight: "bold" }} />
        <Tab label="강의 보고서" sx={{ fontWeight: "bold" }} />
      </Tabs>

      {/* ── 탭 0: 기본 정보 */}
      {tabIndex === 0 && (
        <>
          {/* 기본 정보 & 장소 카드 */}
          <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            {isEditing ? (
              <Box sx={{ mb: 3 }}>
                <TextField label="수업명" name="lectureTitle" value={editFormData.lectureTitle} onChange={handleEditChange} fullWidth sx={{ mb: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>분류 정보</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}><TextField label="지역" name="region" value={editFormData.region} onChange={handleEditChange} fullWidth /></Grid>
                  <Grid size={{ xs: 6 }}><TextField label="분류 (박물관/기관)" name="museum" value={editFormData.museum} onChange={handleEditChange} fullWidth /></Grid>
                </Grid>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>실제 수업 장소 (선택)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}><TextField label="장소명 (예: 국립중앙박물관 정문)" name="venueName" value={editFormData.venueName} onChange={handleEditChange} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><TextField label="상세 주소" name="venueAddress" value={editFormData.venueAddress} onChange={handleEditChange} fullWidth /></Grid>
                </Grid>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <Typography variant="h4" fontWeight="bold">{lesson.lectureTitle}</Typography>
                  {lesson.sourceType === "EXTERNAL_DOCUMENT" && (
                    <Chip
                      label={LESSON_SOURCE_TYPE_MAP.EXTERNAL_DOCUMENT.label}
                      size="small"
                      sx={{
                        fontSize: "0.75rem",
                        bgcolor: "#FFF3E0",
                        color: "#E65100",
                        fontWeight: 700,
                        border: "1px solid #FFB74D",
                      }}
                    />
                  )}
                </Box>
                <Stack spacing={1} sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" color="textSecondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn fontSize="small" /> {lesson.region} {lesson.museum && `> ${lesson.museum}`}
                  </Typography>
                  {(lesson.venueName || lesson.venueAddress) && (
                    <Typography variant="body2" color="textSecondary" sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f8f9fa", p: 1, borderRadius: 1, width: "fit-content" }}>
                      <Map fontSize="small" color="primary" />
                      {lesson.venueName} {lesson.venueAddress && `(${lesson.venueAddress})`}
                    </Typography>
                  )}
                </Stack>
              </>
            )}

            <Divider sx={{ mb: 4 }} />

            {/* 일정 및 비용 */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><CalendarMonth fontSize="small" /> 수업 시작 시간</Typography>
                    {isEditing ? <TextField type="datetime-local" name="startsAt" value={editFormData.startsAt} onChange={handleEditChange} fullWidth size="small" /> : <Typography variant="body1" fontWeight="medium">{formatUtcToLocal(lesson.startsAt)}</Typography>}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><CalendarMonth fontSize="small" /> 수업 종료 시간</Typography>
                    {isEditing ? <TextField type="datetime-local" name="endsAt" value={editFormData.endsAt} onChange={handleEditChange} fullWidth size="small" /> : <Typography variant="body1" fontWeight="medium">{formatUtcToLocal(lesson.endsAt)}</Typography>}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><Person fontSize="small" /> 담당 강사</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body1" fontWeight="medium" color={isEditing ? "textSecondary" : "textPrimary"}>
                        {lesson.instructorName || "현재 미배정 상태입니다."} {isEditing && "(강사 변경은 배정 기능을 이용해주세요)"}
                      </Typography>
                      {!isCanceled && !isEditing && (
                        <Button variant="outlined" size="small" onClick={handleOpenAssignModal}>강사 배정하기</Button>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><AttachMoney fontSize="small" /> 강사 지급액</Typography>
                    {isEditing ? <TextField type="number" name="payAmount" value={editFormData.payAmount} onChange={handleEditChange} fullWidth size="small" InputProps={{ endAdornment: <InputAdornment position="end">원</InputAdornment> }} /> : <Typography variant="body1" fontWeight="medium">{lesson.payAmount ? lesson.payAmount.toLocaleString() + "원" : "미정"}</Typography>}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><People fontSize="small" /> 배정 학생 수</Typography>
                    {isEditing ? <TextField type="number" name="studentCount" value={editFormData.studentCount} onChange={handleEditChange} fullWidth size="small" InputProps={{ endAdornment: <InputAdornment position="end">명</InputAdornment> }} /> : <Typography variant="body1" fontWeight="medium">{lesson.studentCount}명</Typography>}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} mb={0.5}><Description fontSize="small" /> 가이드 노션</Typography>
                    {isEditing ? <TextField type="url" name="guideNotionUrl" value={editFormData.guideNotionUrl} onChange={handleEditChange} fullWidth size="small" /> : (lesson.guideNotionUrl ? <Link href={lesson.guideNotionUrl} target="_blank" underline="hover" color="primary">지도안 열기</Link> : <Typography variant="body1" color="textSecondary">등록된 링크가 없습니다.</Typography>)}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* 상세 내용 및 메모 */}
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>수업 상세 내용</Typography>
            {isEditing ? (
              <TextField name="lessonDetails" value={editFormData.lessonDetails} onChange={handleEditChange} fullWidth multiline rows={4} sx={{ mb: 4 }} />
            ) : (
              <Box sx={{ p: 2, bgcolor: "#f8f9fa", borderRadius: 2, mb: 4, minHeight: 80, whiteSpace: "pre-wrap" }}>{lesson.lessonDetails || "등록된 상세 내용이 없습니다."}</Box>
            )}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>전달 사항</Typography>
            {isEditing ? (
              <TextField name="deliveryNotes" value={editFormData.deliveryNotes} onChange={handleEditChange} fullWidth multiline rows={3} />
            ) : (
              <Box sx={{ p: 2, bgcolor: "#fff4e5", borderRadius: 2, minHeight: 80, whiteSpace: "pre-wrap" }}>{lesson.deliveryNotes || "등록된 전달 사항이 없습니다."}</Box>
            )}
          </Paper>
        </>
      )}

      {/* ── 탭 1: 체크인 현황 */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            체크인 이벤트 타임라인
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            강사의 출발(DEPART) · 도착(ARRIVE) · 완료(FINISH) 이벤트를 시간순으로 표시합니다.
          </Typography>
          <CheckinTimeline lessonId={lessonId} />
        </Paper>
      )}

      {/* ── 탭 2: 추천 강사 */}
      {tabIndex === 2 && (
        <RecommendationsPanel lessonId={lessonId} onAssign={handleOpenAssignModal} isCanceled={isCanceled} />
      )}

      {/* ── 탭 3: 강의 보고서 */}
      {tabIndex === 3 && (
        <LessonReportsPanel lessonId={lessonId} />
      )}

      {/* 강사 배정 모달 */}
      <Dialog open={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">강사 배정 요청</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>현재 수업 시간에 배정 가능한 강사 목록입니다. 강사를 선택하여 수업을 요청하세요.</Typography>
          {isFetchingInstructors ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={30} /></Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>배정할 강사 선택</InputLabel>
              <Select value={selectedInstructorId} label="배정할 강사 선택" onChange={(e) => setSelectedInstructorId(e.target.value)}>
                {availableInstructors.length === 0 ? (
                  <MenuItem disabled value=""><em>해당 시간에 가능한 강사가 없습니다.</em></MenuItem>
                ) : (
                  availableInstructors.map((inst) => (
                    <MenuItem key={inst.instructorId || inst.id} value={inst.instructorId || inst.id}>{inst.instructorName || inst.name}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsAssignModalOpen(false)} color="inherit" disabled={isAssigning}>취소</Button>
          <Button onClick={handleAssignInstructor} variant="contained" disabled={!selectedInstructorId || isAssigning}>{isAssigning ? "요청 중..." : "요청 보내기"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}