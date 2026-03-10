"use client";

import { useRef, useState } from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import FullCalendar from "@fullcalendar/react";
import daygridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg } from "@fullcalendar/core";

import AssignmentModal from "../../../src/components/AssignmentModal";
import AtomButton from "@/src/components/atoms/AtomButton";
import PageHeader from "@/src/components/admin/PageHeader";
import StatCard from "@/src/components/StatCard";
import SurfaceCard from "@/src/components/admin/SurfaceCard";

const liveCheckins = [
  { location: "강남역 지점", instructor: "김철수", time: "10:05", state: "도착 완료" },
  { location: "홍대 지점", instructor: "이영희", time: "09:55", state: "교실 입실" },
  { location: "분당 수업지", instructor: "박지민", time: "11:20", state: "출발 대기" },
];

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("2026년 3월");
  const calendarRef = useRef<FullCalendar | null>(null);

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const label = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
    }).format(dateInfo.view.currentStart);

    setCalendarTitle(label.replace(" ", " "));
  };

  return (
    <Box>
      <PageHeader
        title="종합 대시보드"
        description="오늘 운영 이슈와 배정 흐름을 한 화면에서 빠르게 확인합니다."
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="오늘 수업"
            value="12건"
            subValue="어제 대비 15% 증가"
            progress={70}
            color="#8C6C1B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="미확정 일정"
            value="5건"
            subValue="긴급 확인 필요"
            progress={40}
            color="#E1B73E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="체크인 경고"
            value="2건"
            subValue="미체크인 강사 존재"
            progress={20}
            color="#D45D43"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="계약 만료"
            value="3건"
            subValue="이번 달 만료 예정"
            progress={80}
            color="#6F8C52"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
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
                    px: 2.25,
                    py: 1,
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
            <FullCalendar
              ref={calendarRef}
              plugins={[daygridPlugin]}
              initialView="dayGridMonth"
              height="100%"
              locale="ko"
              headerToolbar={false}
              datesSet={handleDatesSet}
            />
          </SurfaceCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SurfaceCard sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Live 체크인
              </Typography>
              <Stack spacing={1.5}>
                {liveCheckins.map((item) => (
                  <Box
                    key={`${item.location}-${item.instructor}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 1.5,
                      alignItems: "center",
                      px: 2,
                      py: 1.5,
                      borderRadius: 4,
                      backgroundColor: "#FFFCF5",
                    }}
                  >
                    <PlaceRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {item.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.instructor} · {item.state}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </SurfaceCard>

            <SurfaceCard
              sx={{
                p: 3,
                color: "#FFF9EF",
                background:
                  "linear-gradient(145deg, rgba(48, 35, 18, 0.96), rgba(92, 63, 25, 0.92))",
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                  }}
                >
                  <AutoAwesomeRoundedIcon />
                </Box>
                <Typography variant="h6" sx={{ color: "inherit" }}>
                  AI 대강 추천
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  수학 강의에 이영희 강사 추천 (적합도 98%)
                </Typography>
                <Stack spacing={1.25} sx={{ pt: 1 }}>
                  <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                    <CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">오늘 14:00 · 강남 본원</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                    <BoltRoundedIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">최근 응답속도 4분 · 긴급 대강 가능</Typography>
                  </Box>
                </Stack>
              </Stack>
            </SurfaceCard>

            <SurfaceCard sx={{ p: 3, backgroundColor: "#FFF6DC" }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                운영 메모
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3월 둘째 주는 계약 갱신 대상이 몰려 있습니다. 대시보드에서 만료 임박
                강사를 우선 확인하도록 카드 순서를 유지합니다.
              </Typography>
            </SurfaceCard>
          </Stack>
        </Grid>
      </Grid>

      <AssignmentModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Box>
  );
}
