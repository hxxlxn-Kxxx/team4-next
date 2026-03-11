"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, CircularProgress, Grid, Stack, Typography, Button } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import FullCalendar from "@fullcalendar/react";
import daygridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";

import AssignmentModal from "../../../src/components/AssignmentModal";
import AtomButton from "@/src/components/atoms/AtomButton";
import PageHeader from "@/src/components/admin/PageHeader";
import StatCard from "@/src/components/StatCard";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import { apiClient } from "@/src/lib/apiClient";
import { LESSON_STATUS_MAP, type LessonStatus, type ContractStatus } from "@/src/types/backend";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type LessonRow = {
  lessonId: string;
  lectureTitle?: string;
  startsAt: string;
  endsAt: string;
  status: LessonStatus;
  museum?: string;
  venueName?: string;
  region?: string;
  requestedInstructorId?: string | null;
};

type ContractRow = {
  contractId?: string;
  id?: string;
  status: ContractStatus;
};

// ─────────────────────────────────────────────
// 상태별 캘린더 이벤트 색상
// ─────────────────────────────────────────────
const STATUS_COLOR_MAP: Record<LessonStatus, string> = {
  PENDING: "#E65100",       // 빨강 계열 (미배정)
  ACCEPTED: "#1565C0",      // 파랑 (요청중)
  CONTRACT_SIGNED: "#2E7D32", // 초록 (확정)
  UPDATED: "#6A1B9A",       // 보라 (수정됨)
  IN_PROGRESS: "#00838F",   // 청록 (진행중)
  COMPLETED: "#546E7A",     // 회색 (완료)
  CANCELLED: "#9E9E9E",     // 연회색 (취소)
};

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function isToday(isoStr: string): boolean {
  const d = new Date(isoStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("2026년 3월");
  const calendarRef = useRef<FullCalendar | null>(null);

  // 데이터 상태
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 추천 현황 상태
  const [recStats, setRecStats] = useState({
    hasRecsCount: 0,
    topRecReadyCount: 0,
    firstLessonIdWithRec: null as string | null,
  });
  const [isRecLoading, setIsRecLoading] = useState(false);

  // 선택된 이벤트 툴팁
  const [selectedEvent, setSelectedEvent] = useState<{ title: string; location: string; status: LessonStatus } | null>(null);

  // ── 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [lessonData, contractData] = await Promise.all([
          apiClient.getLessons(""),
          apiClient.getContracts(""),
        ]);

        const lessonList: LessonRow[] = Array.isArray(lessonData)
          ? lessonData
          : Array.isArray(lessonData?.data)
          ? lessonData.data
          : [];

        const contractList: ContractRow[] = Array.isArray(contractData)
          ? contractData
          : Array.isArray(contractData?.contracts)
          ? contractData.contracts
          : Array.isArray(contractData?.data)
          ? contractData.data
          : [];

        setLessons(lessonList);
        setContracts(contractList);
      } catch (err) {
        console.error("대시보드 데이터 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 미배정 수업
  const unassignedLessons = lessons.filter(
    (l) => l.status === "PENDING" || l.status === "ACCEPTED"
  );

  // ── 추천 데이터 독립 로드 (미배정 수업 기준)
  useEffect(() => {
    if (unassignedLessons.length === 0) {
      setRecStats({ hasRecsCount: 0, topRecReadyCount: 0, firstLessonIdWithRec: null });
      return;
    }

    const loadRecs = async () => {
      setIsRecLoading(true);
      try {
        let hasRecsCount = 0;
        let topRecReadyCount = 0;
        let firstLessonIdWithRec: string | null = null;

        // 미배정 수업(최대 10개 등 너무 많지 않다고 가정, MVP 수준)
        const promises = unassignedLessons.map(async (lesson) => {
          try {
            const data = await apiClient.getRecommendations(lesson.lessonId);
            const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            if (list.length > 0) {
              if (!firstLessonIdWithRec) firstLessonIdWithRec = lesson.lessonId;
              hasRecsCount++;
              // 최고 추천 강사(1순위) 점수가 70 이상이거나 confidenceLabel 이 있는 경우 '준비됨'으로 카운트
              if (list[0].score >= 70 || list[0].confidenceLabel) {
                topRecReadyCount++;
              }
            }
          } catch (e) {
            // 무시 (오류난 수업은 추천 없는 것으로 간주)
          }
        });

        await Promise.all(promises);

        setRecStats({
          hasRecsCount,
          topRecReadyCount,
          firstLessonIdWithRec,
        });
      } catch (err) {
        console.error("추천 데이터 로드 실패:", err);
      } finally {
        setIsRecLoading(false);
      }
    };
    
    // 로딩이 완료되고 unassignedLessons가 세팅된 직후 한번만 실행되도록
    // (간단 구현 위해 unassignedLessons.length를 의존성으로 하되 단순화)
    loadRecs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unassignedLessons.length]);

  // ── 통계 계산 (프론트 계산)
  const todayLessons = lessons.filter(
    (l) => l.status !== "CANCELLED" && isToday(l.startsAt)
  );
  // 미서명 계약 = DRAFT | SENT | INSTRUCTOR_SIGNED
  const unsignedContracts = contracts.filter(
    (c) => c.status === "DRAFT" || c.status === "SENT" || c.status === "INSTRUCTOR_SIGNED"
  );
  const activeLessons = lessons.filter(
    (l) => l.status !== "CANCELLED" && l.status !== "COMPLETED"
  );

  // ── FullCalendar 이벤트 변환
  const calendarEvents = lessons
    .filter((l) => l.status !== "CANCELLED")
    .map((l) => ({
      id: l.lessonId,
      title: l.lectureTitle || "수업",
      start: l.startsAt,
      end: l.endsAt,
      backgroundColor: STATUS_COLOR_MAP[l.status] ?? "#546E7A",
      borderColor: STATUS_COLOR_MAP[l.status] ?? "#546E7A",
      extendedProps: {
        location: l.museum || l.venueName || l.region || "",
        status: l.status,
      },
    }));

  // ── 오늘 수업 Live 섹션
  const todayEvents = lessons
    .filter((l) => l.status !== "CANCELLED" && isToday(l.startsAt))
    .slice(0, 5); // 최대 5건만 표시

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const label = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
    }).format(dateInfo.view.currentStart);
    setCalendarTitle(label.replace(" ", " "));
  };

  const handleEventClick = (info: EventClickArg) => {
    setSelectedEvent({
      title: info.event.title,
      location: info.event.extendedProps.location,
      status: info.event.extendedProps.status,
    });
  };

  return (
    <Box>
      <PageHeader
        title="종합 대시보드"
        description="오늘 운영 이슈와 배정 흐름을 한 화면에서 빠르게 확인합니다."
      />

      {/* ── 통계 카드 */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="오늘 수업"
              value={`${todayLessons.length}건`}
              subValue={todayLessons.length > 0 ? "오늘 예정된 수업" : "오늘 수업 없음"}
              progress={Math.min(todayLessons.length * 10, 100)}
              color="#8C6C1B"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="미배정/요청중"
              value={`${unassignedLessons.length}건`}
              subValue={unassignedLessons.length > 0 ? "강사 배정 필요" : "모두 배정됨"}
              progress={
                activeLessons.length > 0
                  ? Math.round((unassignedLessons.length / activeLessons.length) * 100)
                  : 0
              }
              color="#E1B73E"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="미서명 계약"
              value={`${unsignedContracts.length}건`}
              subValue={unsignedContracts.length > 0 ? "서명 대기 중" : "모두 서명 완료"}
              progress={
                contracts.length > 0
                  ? Math.round((unsignedContracts.length / contracts.length) * 100)
                  : 0
              }
              color="#D45D43"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="전체 활성 수업"
              value={`${activeLessons.length}건`}
              subValue="취소·완료 제외"
              progress={
                lessons.length > 0
                  ? Math.round((activeLessons.length / lessons.length) * 100)
                  : 0
              }
              color="#6F8C52"
            />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* ── FullCalendar */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <SurfaceCard sx={{ p: 3, minHeight: 680 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              sx={{ mb: 2.5 }}
            >
              <Typography variant="h6">월간 배정 현황</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AtomButton
                  atomVariant="outline"
                  size="small"
                  sx={{ minWidth: 40, px: 1.25, minHeight: 38 }}
                  onClick={() => calendarRef.current?.getApi().prev()}
                >
                  <ChevronLeftRoundedIcon />
                </AtomButton>
                <Box
                  sx={{
                    px: 2.25, py: 1,
                    borderRadius: "16px 0 16px 16px",
                    backgroundColor: "#FBF7ED",
                    border: "1px solid #EFD9A2",
                    fontWeight: 700,
                    color: "#251B10",
                  }}
                >
                  {calendarTitle}
                </Box>
                <AtomButton
                  atomVariant="outline"
                  size="small"
                  sx={{ minWidth: 40, px: 1.25, minHeight: 38 }}
                  onClick={() => calendarRef.current?.getApi().next()}
                >
                  <ChevronRightRoundedIcon />
                </AtomButton>
                <AtomButton atomVariant="ghost" size="small" sx={{ minHeight: 38, px: 2 }}>
                  월간
                </AtomButton>
              </Stack>
            </Stack>

            {/* 이벤트 클릭 툴팁 */}
            {selectedEvent && (
              <Box
                sx={{
                  mb: 2, p: 1.5, borderRadius: 2,
                  bgcolor: "#FBF7ED", border: "1px solid #EFD9A2",
                  display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" fontWeight={700}>{selectedEvent.title}</Typography>
                {selectedEvent.location && (
                  <Typography variant="body2" color="text.secondary">
                    📍 {selectedEvent.location}
                  </Typography>
                )}
                <Chip
                  label={LESSON_STATUS_MAP[selectedEvent.status]?.label ?? selectedEvent.status}
                  color={LESSON_STATUS_MAP[selectedEvent.status]?.color as any ?? "default"}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <AtomButton
                  atomVariant="ghost"
                  size="small"
                  sx={{ ml: "auto", minHeight: 28 }}
                  onClick={() => setSelectedEvent(null)}
                >
                  닫기
                </AtomButton>
              </Box>
            )}

            <FullCalendar
              ref={calendarRef}
              plugins={[daygridPlugin]}
              initialView="dayGridMonth"
              height="auto"
              locale="ko"
              headerToolbar={false}
              datesSet={handleDatesSet}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventDisplay="block"
              dayMaxEvents={3}
              moreLinkText={(n) => `+${n}건 더보기`}
            />
          </SurfaceCard>
        </Grid>

        {/* ── 사이드 패널 */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* 오늘 수업 Live */}
            <SurfaceCard sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                오늘 수업 현황
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={28} />
                </Box>
              ) : todayEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  오늘 예정된 수업이 없습니다.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {todayEvents.map((lesson) => {
                    const location = lesson.museum || lesson.venueName || lesson.region || "-";
                    const startTime = new Date(lesson.startsAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit", minute: "2-digit", hour12: false,
                    });
                    const statusInfo = LESSON_STATUS_MAP[lesson.status];
                    return (
                      <Box
                        key={lesson.lessonId}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "auto 1fr auto",
                          gap: 1.5,
                          alignItems: "center",
                          px: 2, py: 1.5,
                          borderRadius: 4,
                          backgroundColor: "#FFFCF5",
                          borderLeft: `3px solid ${STATUS_COLOR_MAP[lesson.status] ?? "#9E9E9E"}`,
                        }}
                      >
                        <PlaceRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {lesson.lectureTitle || "수업"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {location}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {startTime}
                          </Typography>
                          <Chip
                            label={statusInfo?.label ?? lesson.status}
                            size="small"
                            sx={{
                              fontSize: "0.65rem", height: 18,
                              bgcolor: STATUS_COLOR_MAP[lesson.status] + "22",
                              color: STATUS_COLOR_MAP[lesson.status],
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </SurfaceCard>

            {/* AI 대강 추천 */}
            <SurfaceCard
              sx={{
                p: 3,
                color: "#FFF9EF",
                background: "linear-gradient(145deg, rgba(48, 35, 18, 0.96), rgba(92, 63, 25, 0.92))",
              }}
            >
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 3,
                      display: "grid", placeItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <AutoAwesomeRoundedIcon />
                  </Box>
                  {recStats.firstLessonIdWithRec && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => router.push(`/schedules/lessons/${recStats.firstLessonIdWithRec}`)}
                      sx={{ 
                        bgcolor: "rgba(255, 255, 255, 0.15)", 
                        color: "#fff", 
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        '&:hover': { bgcolor: "rgba(255, 255, 255, 0.25)" }
                      }}
                    >
                      추천 내역 확인
                    </Button>
                  )}
                </Box>
                <Typography variant="h6" sx={{ color: "inherit" }}>AI 대강 추천</Typography>
                
                {isRecLoading ? (
                   <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                     <CircularProgress size={16} sx={{ color: "rgba(255,255,255,0.5)" }} />
                     <Typography variant="body2" sx={{ opacity: 0.85 }}>추천 데이터를 불러오는 중...</Typography>
                   </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }}>
                      미배정 수업에 적합한 강사를 자동 추천합니다.
                    </Typography>
                    <Stack spacing={1.25} sx={{ pt: 1, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                        <CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">미배정 대기: <strong>{unassignedLessons.length}</strong>건</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                        <BoltRoundedIcon sx={{ fontSize: 18, color: recStats.hasRecsCount > 0 ? "#FFD54F" : "inherit" }} />
                        <Typography variant="body2">추천 가능 수업: <strong>{recStats.hasRecsCount}</strong>건</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                        <Typography variant="body2" sx={{ pl: 3.5, opacity: 0.85 }}>
                          ↳ 1순위 강사 매칭 완료: <strong>{recStats.topRecReadyCount}</strong>건
                        </Typography>
                      </Box>
                    </Stack>
                  </>
                )}
              </Stack>
            </SurfaceCard>

            {/* 운영 메모 */}
            <SurfaceCard sx={{ p: 3, backgroundColor: "#FFF6DC" }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>운영 현황 요약</Typography>
              <Typography variant="body2" color="text.secondary">
                전체 수업 {lessons.length}건 중 활성 {activeLessons.length}건,
                미배정/요청중 {unassignedLessons.length}건,
                미서명 계약 {unsignedContracts.length}건이 확인됩니다.
              </Typography>
            </SurfaceCard>
          </Stack>
        </Grid>
      </Grid>

      <AssignmentModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Box>
  );
}
