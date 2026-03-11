"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Close,
  OpenInNew,
  Search,
} from "@mui/icons-material";

import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import FilterBar from "@/src/components/admin/FilterBar";
import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import { apiClient } from "@/src/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";

// ─────────────────────────────────────────────
// 타입 (백엔드 DTO 기반)
// ─────────────────────────────────────────────
type MonthlyClassSummary = {
  lessonId: string;
  location: string;
  datetime: string;
};

type OperationInstructor = {
  id: string;
  name: string;
  phone: string | null;
  majorField: string | null;
  submissionStatus: "SUBMITTED" | "PENDING";
  assignedCount: number;
  totalAvailableDays: number;
  monthlyClasses: MonthlyClassSummary[];
};

type DailyStatus = {
  date: string; // "2026-03-09"
  status: "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE";
};

type WeeklyInstructor = {
  id: string;
  name: string;
  weeklyStatus: DailyStatus[];
};

const SUBMISSION_STATUS_OPTIONS = ["전체", "제출완료", "미제출"];

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 해당 주의 월요일 구하기 */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatKoreanWeekLabel(monday: Date): string {
  const y = monday.getFullYear();
  const m = monday.getMonth() + 1;
  // 해당 월의 몇 번째 주인지
  const weekNum = Math.ceil(monday.getDate() / 7);
  return `${y}년 ${m}월 ${weekNum}주차`;
}

function formatDayHeader(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dayName} (${dd})`;
}

// ─────────────────────────────────────────────
// 가용성 셀 렌더링
// ─────────────────────────────────────────────
function StatusCell({ status }: { status: DailyStatus["status"] }) {
  const config = {
    AVAILABLE: { color: "#4CAF50", label: "배정 가능" },
    ASSIGNED: { color: "#2196F3", label: "수업 있음" },
    UNAVAILABLE: { color: "#E0E0E0", label: "불가" },
  };
  const { color, label } = config[status] ?? config.UNAVAILABLE;
  return (
    <Tooltip title={label}>
      <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: color, mx: "auto", cursor: "default" }} />
    </Tooltip>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function InstructorListPage() {
  const router = useRouter();

  // 월/주 기준 날짜 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekMonday(new Date()));

  // 탭 (0: 운영 리스트, 1: 주간 매트릭스)
  const [currentTab, setCurrentTab] = useState(0);

  // 필터
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");

  // 드로어
  const [selectedInstructor, setSelectedInstructor] = useState<OperationInstructor | null>(null);

  // ── 데이터 로드 (React Query)
  const monthStr = toYearMonth(currentMonth);
  const { 
    data: operationsDataRaw, 
    isLoading: isOpLoading, 
    error: opQueryError 
  } = useQuery({
    queryKey: queryKeys.instructors.operations(monthStr),
    queryFn: async () => {
      const res = await apiClient.getInstructorOperations(monthStr);
      const list: OperationInstructor[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      return list;
    }
  });
  const operationsData = operationsDataRaw || [];
  const opError = opQueryError ? opQueryError.message || "운영 리스트를 불러오지 못했습니다." : null;

  const startDate = toISODate(weekStart);
  const {
    data: weeklyDataRaw,
    isLoading: isWkLoading,
    error: wkQueryError
  } = useQuery({
    queryKey: queryKeys.instructors.weekly(startDate),
    queryFn: async () => {
      const res = await apiClient.getInstructorWeeklyAvailability(startDate);
      const list: WeeklyInstructor[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      return list;
    }
  });
  const weeklyData = weeklyDataRaw || [];
  const wkError = wkQueryError ? wkQueryError.message || "주간 가용성 데이터를 불러오지 못했습니다." : null;

  // ── 월 이동 (Tab 0)
  const goMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // ── 주 이동 (Tab 1)
  const goWeek = (delta: number) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  };

  // ── 필터링
  const filtered = operationsData.filter((row) => {
    const nameMatch = !filterName || (row.name ?? "").includes(filterName);
    const statusMatch =
      filterStatus === "전체" ||
      (filterStatus === "제출완료" && row.submissionStatus === "SUBMITTED") ||
      (filterStatus === "미제출" && row.submissionStatus === "PENDING");
    return nameMatch && statusMatch;
  });

  // ── 주간 날짜 헤더 (weekStart 기준 7일)
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });

  const monthLabel = (() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth() + 1;
    return `${y}년 ${m}월`;
  })();

  return (
    <Box>
      <PageHeader
        title="강사 운영 리스트"
        description="배정에 필요한 일정 제출 현황과 주간 가용성을 한눈에 확인합니다."
        action={
          currentTab === 0 ? (
            /* 월 이동 */
            <SurfaceCard sx={{ px: 1, py: 0.75, borderRadius: 999 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => goMonth(-1)}><ChevronLeft /></IconButton>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
                  <CalendarMonth fontSize="small" color="action" />
                  <Box component="span" sx={{ fontWeight: 700 }}>{monthLabel}</Box>
                </Stack>
                <IconButton size="small" onClick={() => goMonth(1)}><ChevronRight /></IconButton>
              </Stack>
            </SurfaceCard>
          ) : (
            /* 주 이동 */
            <SurfaceCard sx={{ px: 1, py: 0.75, borderRadius: 999 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => goWeek(-1)}><ChevronLeft /></IconButton>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
                  <CalendarMonth fontSize="small" color="action" />
                  <Box component="span" sx={{ fontWeight: 700 }}>{formatKoreanWeekLabel(weekStart)}</Box>
                </Stack>
                <IconButton size="small" onClick={() => goWeek(1)}><ChevronRight /></IconButton>
              </Stack>
            </SurfaceCard>
          )
        }
      />

      {/* 탭 전환 */}
      <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab label="전체 운영 리스트" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
        <Tab label="주간 가용성 매트릭스" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
      </Tabs>

      {/* 필터바 (Tab 0만) */}
      {currentTab === 0 && (
        <FilterBar>
          <AtomInput
            label="강사명"
            placeholder="이름 입력"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <AtomInput
            select
            label="일정 제출 상태"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: "100%", lg: 220 } }}
          >
            {SUBMISSION_STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </AtomInput>
          <AtomButton startIcon={<Search />} sx={{ minWidth: { xs: "100%", lg: 132 } }}>
            검색
          </AtomButton>
        </FilterBar>
      )}

      <SurfaceCard sx={{ overflow: "hidden" }}>
        {/* ── Tab 0: 운영 리스트 */}
        {currentTab === 0 && (
          isOpLoading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
          ) : opError ? (
            <Alert severity="error" sx={{ m: 3 }}>{opError}</Alert>
          ) : filtered.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">{monthLabel} 운영 강사 데이터가 없습니다.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#FBF7ED" }}>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>이름 / 분야</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>연락처</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>일정 제출 상태</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>이번 달 가용 현황</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>상세 액션</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                      <TableCell align="center">
                        <Typography fontWeight="bold">{row.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{row.majorField ?? "-"}</Typography>
                      </TableCell>
                      <TableCell align="center">{row.phone ?? "-"}</TableCell>
                      <TableCell align="center">
                        {row.submissionStatus === "SUBMITTED" ? (
                          <Chip label="제출완료" color="success" size="small" />
                        ) : (
                          <Chip label="미제출" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {row.submissionStatus === "SUBMITTED" ? (
                          <Box sx={{
                            display: "inline-flex", alignItems: "center",
                            px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700,
                            backgroundColor: row.assignedCount >= row.totalAvailableDays ? "#f5f5f5" : "#FFF4E5",
                          }}>
                            {row.assignedCount} / {row.totalAvailableDays}일 배정됨
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <AtomButton atomVariant="outline" size="small" onClick={() => setSelectedInstructor(row)}>
                          요약 보기
                        </AtomButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {/* ── Tab 1: 주간 가용성 매트릭스 */}
        {currentTab === 1 && (
          isWkLoading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
          ) : wkError ? (
            <Alert severity="error" sx={{ m: 3 }}>{wkError}</Alert>
          ) : weeklyData.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">해당 주의 가용성 데이터가 없습니다.</Typography>
            </Box>
          ) : (
            <>
              {/* 범례 */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }}>
                {[
                  { color: "#4CAF50", label: "배정 가능" },
                  { color: "#2196F3", label: "수업 있음" },
                  { color: "#E0E0E0", label: "불가/미제출" },
                ].map((item) => (
                  <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: item.color }} />
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#FBF7ED" }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: "bold", borderRight: "1px solid #eee" }}>강사명</TableCell>
                      {weekDates.map((date) => (
                        <TableCell key={date} align="center" sx={{ fontWeight: "bold" }}>
                          {formatDayHeader(date)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weeklyData.map((row) => (
                      <TableRow key={row.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                        <TableCell align="center" sx={{ fontWeight: "bold", borderRight: "1px solid #eee" }}>
                          {row.name}
                        </TableCell>
                        {weekDates.map((date, idx) => {
                          const found = row.weeklyStatus.find((s) => s.date === date);
                          const status = found?.status ?? "UNAVAILABLE";
                          return (
                            <TableCell key={idx} align="center">
                              <StatusCell status={status} />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )
        )}
      </SurfaceCard>

      {/* ── 요약 드로어 */}
      <Drawer
        anchor="right"
        open={Boolean(selectedInstructor)}
        onClose={() => setSelectedInstructor(null)}
        PaperProps={{ sx: { width: 500 } }}
      >
        <Box display="flex" justifyContent="flex-end" sx={{ pt: 2, pr: 2 }}>
          <IconButton onClick={() => setSelectedInstructor(null)}><Close /></IconButton>
        </Box>

        {selectedInstructor && (
          <Box sx={{ px: 4, pb: 4, display: "flex", flexDirection: "column", height: "100%" }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              {selectedInstructor.name} 강사
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              전화번호: {selectedInstructor.phone ?? "-"} | 주력: {selectedInstructor.majorField ?? "-"}
            </Typography>

            {/* 배정 현황 카드 */}
            <SurfaceCard sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>이번 달 배정 현황</Typography>
              <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">제출한 가능 일수</Typography>
                  <Typography variant="h4" sx={{ mt: 1, color: "primary.main" }}>
                    {selectedInstructor.totalAvailableDays}일
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">현재 배정된 일수</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>
                    {selectedInstructor.assignedCount}일
                  </Typography>
                </Box>
              </Stack>
            </SurfaceCard>

            {/* 월간 수업 스케줄 */}
            <Typography variant="subtitle2" color="textSecondary" mb={1.5}>이번 달 출강 확정 스케줄</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              {selectedInstructor.monthlyClasses && selectedInstructor.monthlyClasses.length > 0 ? (
                selectedInstructor.monthlyClasses.map((cls) => (
                  <SurfaceCard key={cls.lessonId} sx={{ p: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>{cls.location}</Typography>
                    <Typography variant="body2" color="text.secondary">{cls.datetime}</Typography>
                  </SurfaceCard>
                ))
              ) : (
                <Box sx={{ p: 3, textAlign: "center", bgcolor: "#f8f9fa", borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary">이번 달에 확정된 수업이 없습니다.</Typography>
                </Box>
              )}
            </Stack>

            <Box sx={{ mt: "auto", pt: 4 }}>
              <AtomButton
                fullWidth
                size="large"
                startIcon={<OpenInNew />}
                onClick={() => router.push(`/instructors/db/${selectedInstructor.id}`)}
              >
                전체 프로필 및 이력 보기
              </AtomButton>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}