"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  Stack,
  Link,
} from "@mui/material";
import {
  ArrowBack,
  CalendarMonth,
  LocationOn,
  Person,
  AttachMoney,
  People,
  Description,
} from "@mui/icons-material";

const CLASS_STATUS_MAP: Record<string, string> = {
  SCHEDULED: "배정 완료",
  PENDING: "강사 대기",
  IN_PROGRESS: "수업 진행중",
  COMPLETED: "수업 완료",
  CANCELED: "취소됨",
};

const formatUtcToLocal = (utcString: string) => {
  if (!utcString) return "-";
  const d = new Date(utcString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

export default function ClassDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonDetail = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${apiUrl}/lessons/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404)
            throw new Error("존재하지 않거나 삭제된 수업입니다.");
          throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
        }

        const data = await response.json();
        setLesson(data.data || data);
      } catch (err: any) {
        console.error("상세 조회 에러:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchLessonDetail();
  }, [id]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="textSecondary">
          수업 상세 정보를 불러오는 중입니다...
        </Typography>
      </Box>
    );
  }

  if (error || !lesson) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()}>
          목록으로 돌아가기
        </Button>
        <Alert severity="error" sx={{ fontSize: "1.1rem", py: 2 }}>
          {error || "데이터를 찾을 수 없습니다."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* 상단 뒤로가기 & 헤더 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          목록
        </Button>
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          수업 상세 정보
        </Typography>
        <Chip
          label={
            CLASS_STATUS_MAP[lesson.classStatus || lesson.status] ||
            lesson.classStatus ||
            lesson.status
          }
          color={
            ["SCHEDULED", "COMPLETED"].includes(
              lesson.classStatus || lesson.status,
            )
              ? "primary"
              : "warning"
          }
          sx={{ fontWeight: "bold", fontSize: "1rem", py: 2.5, px: 1 }}
        />
      </Box>

      {/* 기본 정보 카드 */}
      <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {lesson.lectureTitle}
        </Typography>
        <Typography
          variant="subtitle1"
          color="textSecondary"
          sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}
        >
          <LocationOn fontSize="small" /> {lesson.region}{" "}
          {lesson.museum && `> ${lesson.museum}`}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <CalendarMonth fontSize="small" /> 수업 시작 시간
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatUtcToLocal(lesson.startsAt)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <CalendarMonth fontSize="small" /> 수업 종료 시간
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatUtcToLocal(lesson.endsAt)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <Person fontSize="small" /> 담당 강사
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {lesson.instructorName || "현재 미배정 상태입니다."}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <AttachMoney fontSize="small" /> 강사 지급액
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {lesson.payAmount
                    ? lesson.payAmount.toLocaleString() + "원"
                    : "미정"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <People fontSize="small" /> 배정 학생 수
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {lesson.studentCount}명
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.5}
                >
                  <Description fontSize="small" /> 가이드 노션
                </Typography>
                {lesson.guideNotionUrl ? (
                  <Link
                    href={lesson.guideNotionUrl}
                    target="_blank"
                    underline="hover"
                    color="primary"
                  >
                    지도안 열기
                  </Link>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    등록된 링크가 없습니다.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* 상세 내용 및 메모 카드 */}
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          수업 상세 내용
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: "#f8f9fa",
            borderRadius: 2,
            mb: 4,
            minHeight: 80,
            whiteSpace: "pre-wrap",
          }}
        >
          {lesson.lessonDetails || "등록된 상세 내용이 없습니다."}
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          전달 사항
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: "#fff4e5",
            borderRadius: 2,
            minHeight: 80,
            whiteSpace: "pre-wrap",
          }}
        >
          {lesson.deliveryNotes || "등록된 전달 사항이 없습니다."}
        </Box>
      </Paper>
    </Box>
  );
}
