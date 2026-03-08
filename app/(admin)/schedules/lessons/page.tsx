"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Drawer,
  Divider,
  Grid,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { useRouter } from "next/navigation";

const CLASS_STATUS_MAP: Record<string, string> = {
  SCHEDULED: "배정 완료",
  PENDING: "강사 대기",
  IN_PROGRESS: "수업 진행중",
  COMPLETED: "수업 완료",
  CANCELED: "취소됨",
};

const MOCK_CLASSES = [
  {
    classId: "CLS_1001",
    lectureTitle: "[초등] 역사 탐험대 1기",
    locationName: "송파청소년수련관",
    instructorName: "김철수",
    startsAt: "2026-03-10T05:00:00Z",
    endsAt: "2026-03-10T07:00:00Z",
    classStatus: "SCHEDULED",
  },
  {
    classId: "CLS_1002",
    lectureTitle: "[중등] 근현대사 바로알기",
    locationName: "마포평생학습관",
    instructorName: "-",
    startsAt: "2026-03-12T01:00:00Z",
    endsAt: "2026-03-12T03:00:00Z",
    classStatus: "PENDING",
  },
];

const formatUtcToLocal = (utcString: string) => {
  const d = new Date(utcString);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

export default function ClassManagementPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  const router = useRouter();

  const fetchLessons = async () => {
    setIsLoadingList(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      // 상태 필터가 ALL이 아니면 쿼리 파라미터 추가 (?status=PENDING 등)
      const queryParam =
        filterStatus !== "ALL" ? `?status=${filterStatus}` : "";

      const response = await fetch(`${apiUrl}/lessons${queryParam}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("목록 조회 실패");

      const data = await response.json();
      setClasses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error(error);
      setClasses([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [filterStatus]);

  const [formData, setFormData] = useState({
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDateValid =
    formData.startsAt &&
    formData.endsAt &&
    new Date(formData.startsAt) < new Date(formData.endsAt);
  const isRequiredFilled = !!(
    formData.lectureTitle &&
    formData.startsAt &&
    formData.endsAt &&
    formData.payAmount &&
    formData.studentCount &&
    formData.region &&
    formData.museum &&
    formData.guideNotionUrl &&
    formData.lessonDetails
  );
  const isFormValid = isRequiredFilled && isDateValid;

  // API 연동이 포함된 제출 함수
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        payAmount: Number(formData.payAmount),
        studentCount: Number(formData.studentCount),
        classStatus: "PENDING", // 백엔드 Enum 명세 강제
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("accessToken");

      // POST /lessons API 호출
      const response = await fetch(`${apiUrl}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // 실패 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `서버 에러가 발생했습니다. (${response.status})`,
        );
      }

      // 💡 성공 처리 (완료 조건: 목록으로 이동 / 패널 닫기)
      alert("새 수업이 성공적으로 등록되었습니다!");
      setIsDrawerOpen(false);

      // 폼 초기화
      setFormData({
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
      });

      fetchLessons();

      // 실제 연동 시 여기서 목록 갱신 API(GET /lessons)를 다시 호출합니다.
    } catch (error: any) {
      console.error("API 통신 에러:", error);
      // 실패 시 에러 메시지 표시
      alert(`수업 생성 실패: ${error.message}`);
    } finally {
      setIsSubmitting(false); // 로딩 종료
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          수업 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDrawerOpen(true)}
        >
          새 수업 등록
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="강사명"
            size="small"
            sx={{ width: 200 }}
            placeholder="이름 입력"
          />
          <TextField
            select
            label="수업 상태"
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="ALL">전체</MenuItem>
            {Object.entries(CLASS_STATUS_MAP).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            disableElevation
            startIcon={<Search />}
            onClick={fetchLessons}
          >
            검색
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                수업명
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                장소
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                담당 강사
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                시작 시간
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상태
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoadingList ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    데이터를 불러오는 중입니다...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="textSecondary">
                    등록된 수업이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              classes.map((row) => (
                <TableRow
                  key={row.id || row.classId || row.lectureTitle}
                  hover
                  onClick={() =>
                    router.push(`/schedules/lessons/${row.id || row.lessonId}`)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell align="center" sx={{ fontWeight: "medium" }}>
                    {row.lectureTitle}
                  </TableCell>
                  <TableCell align="center">
                    {row.museum || row.locationName || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {row.instructorName || "미배정"}
                  </TableCell>
                  <TableCell align="center">
                    {formatUtcToLocal(row.startsAt)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        CLASS_STATUS_MAP[row.classStatus || row.status] ||
                        row.classStatus ||
                        row.status
                      }
                      color={
                        ["SCHEDULED", "COMPLETED"].includes(
                          row.classStatus || row.status,
                        )
                          ? "primary"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 새 수업 등록 슬라이드 패널 */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 500,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box sx={{ p: 3, bgcolor: "#1976d2", color: "white" }}>
            <Typography variant="h6" fontWeight="bold">
              새 수업 등록
            </Typography>
          </Box>
          <Divider />

          <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="수업명 (lectureTitle)"
                  name="lectureTitle"
                  value={formData.lectureTitle}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="datetime-local"
                  label="시작 일시 (startsAt)"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={
                    formData.startsAt !== "" &&
                    formData.endsAt !== "" &&
                    !isDateValid
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="datetime-local"
                  label="종료 일시 (endsAt)"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={
                    formData.startsAt !== "" &&
                    formData.endsAt !== "" &&
                    !isDateValid
                  }
                  helperText={
                    formData.startsAt !== "" &&
                    formData.endsAt !== "" &&
                    !isDateValid
                      ? "종료 오류"
                      : ""
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="지급액 (payAmount)"
                  name="payAmount"
                  value={formData.payAmount}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">원</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="학생 수 (studentCount)"
                  name="studentCount"
                  value={formData.studentCount}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">명</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="지역 (region)"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="박물관/장소 (museum)"
                  name="museum"
                  value={formData.museum}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  type="url"
                  label="가이드 노션 링크 (guideNotionUrl)"
                  name="guideNotionUrl"
                  value={formData.guideNotionUrl}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="https://notion.so/..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="수업 상세 내용 (lessonDetails)"
                  name="lessonDetails"
                  value={formData.lessonDetails}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="전달 사항 (deliveryNotes)"
                  name="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="선택 사항"
                />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              p: 3,
              borderTop: "1px solid #eee",
              bgcolor: "#f8f9fa",
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>

            {/* API 호출 중일 때는 로딩 스피너 표시 및 버튼 비활성화 */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "수업 등록하기"
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
