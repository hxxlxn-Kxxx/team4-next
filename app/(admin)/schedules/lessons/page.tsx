"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  Grid,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import FilterBar from "@/src/components/admin/FilterBar";
import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomBadge from "@/src/components/atoms/AtomBadge";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import type { LessonStatus } from "@/src/types/backend";
import { LESSON_STATUS_MAP } from "@/src/types/backend";

type LessonRow = {
  lessonId: string;
  lectureTitle: string;
  museum?: string;
  venueName?: string;
  startsAt: string;
  status: LessonStatus;
  requestedInstructorId?: string | null;
  requestedInstructor?: { 
    name: string;
  } | null;
};

type AvailableInstructor = {
  instructorId: string;
  name: string;
  matchingSlotCount?: number;
};

type LessonFormData = {
  lectureTitle: string;
  startsAt: string;
  endsAt: string;
  payAmount: string;
  studentCount: string;
  region: string;
  museum: string;
  guideNotionUrl: string;
  lessonDetails: string;
  deliveryNotes: string;
  instructorId: string;
};

const STATUS_OPTIONS: Array<{ value: "ALL" | LessonStatus; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: LESSON_STATUS_MAP.PENDING },
  { value: "ACCEPTED", label: LESSON_STATUS_MAP.ACCEPTED },
  { value: "CONTRACT_SIGNED", label: LESSON_STATUS_MAP.CONTRACT_SIGNED },
  { value: "UPDATED", label: LESSON_STATUS_MAP.UPDATED },
  { value: "IN_PROGRESS", label: LESSON_STATUS_MAP.IN_PROGRESS },
  { value: "COMPLETED", label: LESSON_STATUS_MAP.COMPLETED },
  { value: "CANCELLED", label: LESSON_STATUS_MAP.CANCELLED },
];

const STATUS_TONE_MAP: Record<LessonStatus, string> = {
  PENDING: "requested",
  ACCEPTED: "sent",
  CONTRACT_SIGNED: "confirmed",
  UPDATED: "viewed",
  IN_PROGRESS: "sent",
  COMPLETED: "signed",
  CANCELLED: "cancelled",
};

const initialFormData: LessonFormData = {
  lectureTitle: "",
  startsAt: "",
  endsAt: "",
  payAmount: "",
  studentCount: "",
  region: "",
  museum: "",
  guideNotionUrl: "",
  lessonDetails: "",
  deliveryNotes: "",
  instructorId: "",
};

const formatUtcToLocal = (utcString: string) => {
  const date = new Date(utcString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

export default function ClassManagementPage() {
  const [filterStatus, setFilterStatus] = useState<"ALL" | LessonStatus>("ALL");
  const [searchName, setSearchName] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [classes, setClasses] = useState<LessonRow[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<AvailableInstructor[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [listError, setListError] = useState("");
  const [formData, setFormData] = useState<LessonFormData>(initialFormData);

  const router = useRouter();

  const fetchLessons = useCallback(async () => {
    setIsLoadingList(true);
    setListError("");

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token || !apiUrl) {
        throw new Error("API 또는 로그인 토큰이 없습니다.");
      }

      const query = new URLSearchParams();
      if (filterStatus !== "ALL") {
        query.set("status", filterStatus);
      }

      const url = query.toString() ? `${apiUrl}/lessons?${query.toString()}` : `${apiUrl}/lessons`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `목록 조회 실패 (${response.status})`);
      }

      const data = await response.json();
      const rows = Array.isArray(data) ? data : data.data || [];
      const normalizedName = searchName.trim();
      const filteredRows = normalizedName
        ? rows.filter((row: LessonRow) => row.lectureTitle.includes(normalizedName))
        : rows;

      setClasses(filteredRows);
    } catch (error) {
      console.error("lessons list error:", error);
      setClasses([]);
      setListError(error instanceof Error ? error.message : "수업 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoadingList(false);
    }
  }, [filterStatus, searchName]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    const fetchInstructors = async () => {
      if (!formData.startsAt || !formData.endsAt) {
        setAvailableInstructors([]);
        return;
      }

      const start = new Date(formData.startsAt);
      const end = new Date(formData.endsAt);
      if (start >= end) {
        setAvailableInstructors([]);
        return;
      }

      setIsFetchingInstructors(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        if (!token || !apiUrl) {
          throw new Error("가용 강사 조회에 필요한 인증 정보가 없습니다.");
        }

        const response = await fetch(
          `${apiUrl}/lessons/available-instructors?startsAt=${start.toISOString()}&endsAt=${end.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "가용 강사 조회 실패");
        }

        const data = await response.json();
        const rows = Array.isArray(data) ? data : data.data || [];
        setAvailableInstructors(rows);
      } catch (error) {
        console.error("available instructors error:", error);
        setAvailableInstructors([]);
      } finally {
        setIsFetchingInstructors(false);
      }
    };

    fetchInstructors();
  }, [formData.startsAt, formData.endsAt]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const isDateValid =
    Boolean(formData.startsAt) &&
    Boolean(formData.endsAt) &&
    new Date(formData.startsAt) < new Date(formData.endsAt);
  const isRequiredFilled = Boolean(
    formData.lectureTitle &&
      formData.startsAt &&
      formData.endsAt &&
      formData.payAmount &&
      formData.studentCount &&
      formData.region &&
      formData.museum &&
      formData.guideNotionUrl &&
      formData.lessonDetails,
  );
  const isFormValid = isRequiredFilled && isDateValid;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token || !apiUrl) {
        throw new Error("수업 생성에 필요한 인증 정보가 없습니다.");
      }

      const createPayload = {
        lectureTitle: formData.lectureTitle,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        payAmount: Number(formData.payAmount),
        studentCount: Number(formData.studentCount),
        region: formData.region,
        museum: formData.museum,
        guideNotionUrl: formData.guideNotionUrl,
        lessonDetails: formData.lessonDetails,
        deliveryNotes: formData.deliveryNotes || undefined,
      };

      const createResponse = await fetch(`${apiUrl}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createPayload),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `수업 생성 실패 (${createResponse.status})`);
      }

      const createdData = await createResponse.json();
      const createdLesson: LessonRow = createdData.data || createdData;

      if (formData.instructorId) {
        const assignResponse = await fetch(`${apiUrl}/lessons/${createdLesson.lessonId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instructorId: formData.instructorId }),
        });

        if (!assignResponse.ok) {
          const errorData = await assignResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "수업 생성 후 강사 요청에 실패했습니다.");
        }
      }

      setIsDrawerOpen(false);
      setFormData(initialFormData);
      fetchLessons();
    } catch (error) {
      console.error("lesson create error:", error);
      setListError(error instanceof Error ? error.message : "수업 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="수업 관리"
        description="실제 수업 목록과 신규 등록 흐름을 같은 운영 패턴으로 관리합니다."
        action={
          <AtomButton startIcon={<Add />} onClick={() => router.push("/schedules/lessons/create")}>
            새 수업 등록
          </AtomButton>
        }
      />

      <FilterBar>
        <AtomInput
          label="수업명"
          size="small"
          sx={{ minWidth: 220 }}
          placeholder="수업명 입력"
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
        />
        <AtomInput
          select
          label="수업 상태"
          size="small"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as "ALL" | LessonStatus)}
          sx={{ minWidth: 220 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </AtomInput>
        <AtomButton startIcon={<Search />} onClick={fetchLessons}>
          검색
        </AtomButton>
      </FilterBar>

      {listError ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "16px 0 16px 16px" }}>
          {listError}
        </Alert>
      ) : null}

      <TableContainer component={SurfaceCard}>
        <Table>
          <TableHead sx={{ bgcolor: "#FBF7ED" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                수업명
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                장소
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                담당 강사
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                시작 시간
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                상태
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoadingList ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} sx={{ mb: 1.5, color: "#B7791F" }} />
                  <Typography variant="body2" color="text.secondary">
                    데이터를 불러오는 중입니다...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    표시할 수업이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              classes.map((row) => (
                <TableRow
                  key={row.lessonId}
                  hover
                  onClick={() => router.push(`/schedules/lessons/${row.lessonId}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {row.lectureTitle}
                  </TableCell>
                  <TableCell align="center">{row.museum || row.venueName || "-"}</TableCell>
                  <TableCell align="center">
  {row.requestedInstructor?.name || "미배정"}
</TableCell>
                  <TableCell align="center">{formatUtcToLocal(row.startsAt)}</TableCell>
                  <TableCell align="center">
                    <AtomBadge
                      tone={STATUS_TONE_MAP[row.status]}
                      label={LESSON_STATUS_MAP[row.status]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Box
          sx={{
            width: 540,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: "#FFF9EF",
          }}
        >
          <Box sx={{ p: 4, borderBottom: "1px solid #EBDDC3" }}>
            <Typography variant="h4">새 수업 등록</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              수업 정보 등록 후 선택된 강사에게 별도 요청을 생성합니다.
            </Typography>
          </Box>

          <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12 }}>
                <AtomInput
                  label="수업명"
                  name="lectureTitle"
                  value={formData.lectureTitle}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  type="datetime-local"
                  label="시작 일시"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={Boolean(formData.startsAt && formData.endsAt && !isDateValid)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  type="datetime-local"
                  label="종료 일시"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={Boolean(formData.startsAt && formData.endsAt && !isDateValid)}
                  helperText={
                    formData.startsAt && formData.endsAt && !isDateValid
                      ? "종료 시각은 시작 이후여야 합니다."
                      : ""
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <AtomInput
                  select
                  label="담당 강사 요청"
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleChange}
                  fullWidth
                  disabled={!isDateValid || isFetchingInstructors}
                  helperText={
                    !formData.startsAt || !formData.endsAt
                      ? "시작 및 종료 시간을 먼저 입력해주세요."
                      : isFetchingInstructors
                        ? "가능한 강사를 찾는 중입니다."
                        : "선택 시 생성 직후 해당 강사에게 요청을 보냅니다."
                  }
                >
                  <MenuItem value="">나중에 배정하기</MenuItem>
                  {availableInstructors.map((instructor) => (
                    <MenuItem key={instructor.instructorId} value={instructor.instructorId}>
                      {instructor.name}
                      {instructor.matchingSlotCount
                        ? ` · 겹치는 슬롯 ${instructor.matchingSlotCount}개`
                        : ""}
                    </MenuItem>
                  ))}
                </AtomInput>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  type="number"
                  label="지급액"
                  name="payAmount"
                  value={formData.payAmount}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  type="number"
                  label="학생 수"
                  name="studentCount"
                  value={formData.studentCount}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">명</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  label="지역"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AtomInput
                  label="박물관/장소"
                  name="museum"
                  value={formData.museum}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <AtomInput
                  type="url"
                  label="가이드 노션 링크"
                  name="guideNotionUrl"
                  value={formData.guideNotionUrl}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="https://notion.so/..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <AtomInput
                  label="수업 상세 내용"
                  name="lessonDetails"
                  value={formData.lessonDetails}
                  onChange={handleChange}
                  fullWidth
                  multilineRows={4}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <AtomInput
                  label="전달 사항"
                  name="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  fullWidth
                  multilineRows={3}
                  placeholder="선택 사항"
                />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              p: 3,
              borderTop: "1px solid #EBDDC3",
              backgroundColor: "#FFFDF6",
              display: "flex",
              gap: 1.5,
            }}
          >
            <AtomButton
              atomVariant="outline"
              sx={{ flex: 1 }}
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </AtomButton>
            <AtomButton sx={{ flex: 1 }} onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "수업 등록하기"}
            </AtomButton>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
