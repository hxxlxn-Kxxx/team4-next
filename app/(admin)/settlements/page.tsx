"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Download,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import { apiClient } from "@/src/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";

// ─────────────────────────────────────────────
// 타입 (backend SettlementMonthlyDto 기반)
// ─────────────────────────────────────────────
type SettlementLineItem = {
  lessonId: string;
  month: string;
  startsAt: string;
  endsAt: string;
  lectureTitle: string;
  durationHours: number;
  grossAmount: number;
  region?: string;
  museum?: string;
};

type SettlementMonthly = {
  month: string;
  totalHours: number;
  grossAmount: number;
  incomeTaxAmount: number;
  localTaxAmount: number;
  taxAmount: number;
  netAmount: number;
  payDate: string;
  status: "SCHEDULED" | "PAID";
  items: SettlementLineItem[];
  // 강사 정보 (서버 응답이 instructorName을 포함할 경우 대비)
  instructorName?: string;
  instructorId?: string;
};

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatKoreanMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}

function formatDate(iso: string): string {
  return iso?.slice(0, 10) ?? "-";
}

function formatTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSettlementRowKey(row: SettlementMonthly): string {
  const lessonIds = (row.items ?? [])
    .map((item) => item.lessonId)
    .filter(Boolean)
    .sort()
    .join(",");

  return [
    row.month,
    row.instructorId ?? row.instructorName ?? "unknown-instructor",
    lessonIds || "no-lessons",
  ].join(":");
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function SettlementPage() {
  // 월 선택 (기본: 이번 달)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // 드롭다운 등 부가 상태
  const [manualBonus, setManualBonus] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const goMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const monthStr = toYearMonth(currentMonth);

  const {
    data: settlementsData,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: queryKeys.settlements.list({ month: monthStr }),
    queryFn: async () => {
      const data = await apiClient.getSettlements(monthStr);
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
    }
  });

  const settlements: SettlementMonthly[] = settlementsData || [];
  const error = queryError ? "정산 데이터를 불러오지 못했습니다." : null;

  // ── Summary 계산 (실데이터 기반)
  const totalGross = settlements.reduce((s, r) => s + (r.grossAmount ?? 0), 0);
  const totalNet = settlements.reduce((s, r) => s + (r.netAmount ?? 0), 0);
  const totalTax = settlements.reduce((s, r) => s + (r.taxAmount ?? 0), 0);
  const paidRows = settlements.filter((r) => r.status === "PAID");
  const scheduledRows = settlements.filter((r) => r.status === "SCHEDULED");

  const summaryCards = [
    { label: "총 지급 예정 금액 (세전)", value: totalGross.toLocaleString() + "원", accent: "#F3C742" },
    { label: "총 실지급액 (세후)", value: totalNet.toLocaleString() + "원", accent: "#9AD4AF" },
    { label: "공제 세금 합계", value: totalTax.toLocaleString() + "원", accent: "#F5D37B" },
  ];

  const monthLabel = formatKoreanMonth(toYearMonth(currentMonth));

  const toggleExpand = (key: string) =>
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Box>
      <PageHeader
        title="월별 정산 관리"
        description="완료된 수업 기반 강사별 월 정산 내역을 확인합니다."
        action={
          <SurfaceCard sx={{ px: 2.5, py: 1, borderRadius: "18px 0 18px 18px", boxShadow: "none" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AtomButton atomVariant="ghost" size="small" sx={{ minWidth: 36, px: 1.25 }} onClick={() => goMonth(-1)}>
                <ChevronLeft />
              </AtomButton>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
                <CalendarMonth sx={{ color: "#B7791F", fontSize: 18 }} />
                <Typography variant="subtitle2">{monthLabel}</Typography>
              </Stack>
              <AtomButton atomVariant="ghost" size="small" sx={{ minWidth: 36, px: 1.25 }} onClick={() => goMonth(1)}>
                <ChevronRight />
              </AtomButton>
            </Stack>
          </SurfaceCard>
        }
      />

      {/* Summary 카드 */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <SurfaceCard
            key={card.label}
            sx={{ flex: 1, p: 3, borderRadius: "24px 0 24px 24px", position: "relative", overflow: "hidden" }}
          >
            <Box sx={{ position: "absolute", inset: "0 auto 0 0", width: 8, backgroundColor: card.accent }} />
            <Typography variant="body2" color="text.secondary">{card.label}</Typography>
            <Typography variant="h3" sx={{ mt: 1.5 }}>{card.value}</Typography>
          </SurfaceCard>
        ))}
      </Stack>

      {/* 통계 요약 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <SurfaceCard sx={{ px: 2.5, py: 1.5, boxShadow: "none" }}>
          <Typography variant="body2" color="text.secondary">강사 수</Typography>
          <Typography variant="subtitle1" fontWeight={700}>{settlements.length}명</Typography>
        </SurfaceCard>
        <SurfaceCard sx={{ px: 2.5, py: 1.5, boxShadow: "none" }}>
          <Typography variant="body2" color="text.secondary">지급 완료</Typography>
          <Typography variant="subtitle1" fontWeight={700} color="#2F6B2F">{paidRows.length}명</Typography>
        </SurfaceCard>
        <SurfaceCard sx={{ px: 2.5, py: 1.5, boxShadow: "none" }}>
          <Typography variant="body2" color="text.secondary">지급 예정</Typography>
          <Typography variant="subtitle1" fontWeight={700} color="#B7791F">{scheduledRows.length}명</Typography>
        </SurfaceCard>
      </Stack>

      {/* 에러 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* 목록 */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : settlements.length === 0 ? (
        <SurfaceCard sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {monthLabel} 정산 내역이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            완료(COMPLETED) 상태의 수업이 있어야 정산이 생성됩니다.
          </Typography>
        </SurfaceCard>
      ) : (
        <TableContainer component={SurfaceCard} sx={{ mb: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#FBF7ED" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 48 }} />
                <TableCell align="center" sx={{ fontWeight: 700 }}>강사명</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>수업 수</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>근무시간</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>세전 지급액</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#B7791F" }}>공제 세금</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>수동 수당</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>최종 실지급액</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>지급 예정일</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.map((row) => {
                const rowKey = getSettlementRowKey(row);
                const isExpanded = expandedRows[rowKey] ?? false;
                const bonusStr = manualBonus[rowKey] ?? "";
                const bonus = Number(bonusStr) || 0;
                const adjustedNet = row.netAmount + bonus;

                return (
                  <Fragment key={rowKey}>
                    <TableRow
                      hover
                      sx={{ bgcolor: row.status === "PAID" ? "#F0FFF4" : "inherit" }}
                    >
                      {/* 펼치기 */}
                      <TableCell>
                        <AtomButton
                          atomVariant="ghost"
                          size="small"
                          sx={{ minWidth: 32, px: 0.5 }}
                          onClick={() => toggleExpand(rowKey)}
                        >
                          {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </AtomButton>
                      </TableCell>

                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {row.instructorName ?? "-"}
                      </TableCell>
                      <TableCell align="center">{row.items?.length ?? 0}회</TableCell>
                      <TableCell align="center">{row.totalHours}시간</TableCell>
                      <TableCell align="center">{row.grossAmount.toLocaleString()}원</TableCell>
                      <TableCell align="center" sx={{ color: "#B7791F" }}>
                        {row.taxAmount.toLocaleString()}원
                      </TableCell>
                      <TableCell align="center">
                        <AtomInput
                          size="small"
                          value={bonusStr}
                          onChange={(e) =>
                            setManualBonus((prev) => ({ ...prev, [rowKey]: e.target.value }))
                          }
                          disabled={row.status === "PAID"}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                          }}
                          sx={{ width: 130 }}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#251B10" }}>
                        {adjustedNet.toLocaleString()}원
                      </TableCell>
                      <TableCell align="center">
                        {formatDate(row.payDate)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.status === "PAID" ? "지급 완료" : "지급 예정"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: row.status === "PAID" ? "#E8F5E9" : "#FFF3E0",
                            color: row.status === "PAID" ? "#2F6B2F" : "#B7791F",
                          }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* 수업별 상세 펼침 */}
                    <TableRow key={`${rowKey}-detail`}>
                      <TableCell colSpan={10} sx={{ p: 0, bgcolor: "#FAFAFA" }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 6, py: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                              수업 세부 내역
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#F5F5F5" }}>
                                  <TableCell sx={{ fontWeight: 600 }}>수업명</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>날짜</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>시간</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>시간(h)</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>지급액</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>지역/기관</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(row.items ?? []).map((item) => (
                                  <TableRow key={item.lessonId} hover>
                                    <TableCell>{item.lectureTitle}</TableCell>
                                    <TableCell align="center">{formatDate(item.startsAt)}</TableCell>
                                    <TableCell align="center">
                                      {formatTime(item.startsAt)} ~ {formatTime(item.endsAt)}
                                    </TableCell>
                                    <TableCell align="center">{item.durationHours}h</TableCell>
                                    <TableCell align="center">{item.grossAmount.toLocaleString()}원</TableCell>
                                    <TableCell align="center">
                                      {[item.region, item.museum].filter(Boolean).join(" / ") || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 하단 액션 */}
      {!isLoading && settlements.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <AtomButton atomVariant="outline" startIcon={<Download />}>
            엑셀 다운로드
          </AtomButton>
        </Box>
      )}
    </Box>
  );
}
