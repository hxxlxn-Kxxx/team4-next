"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack,
  CalendarMonth,
  LocationOn,
  Person,
  AttachMoney,
  People,
  Description,
  Edit,
  Block,
} from "@mui/icons-material";
import { LESSON_STATUS_MAP, type LessonStatus } from "@/src/types/backend";

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
};

type AvailableInstructor = {
  instructorId?: string;
  id?: string;
  instructorName?: string;
  name?: string;
};

const CLASS_STATUS_MAP: Record<string, { label: string; color: any }> = {
  ...LESSON_STATUS_MAP,
  SCHEDULED: { label: "배정 완료", color: "primary" },
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
};

const formatUtcToLocal = (utcString?: string) => {
  if (!utcString) return "-";
  const d = new Date(utcString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

const formatForInput = (utcString?: string) => {
  if (!utcString) return "";
  const d = new Date(utcString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

export default function ClassDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableInstructors, setAvailableInstructors] = useState<AvailableInstructor[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [editFormData, setEditFormData] = useState({
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

  const fetchLessonDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiUrl}/lessons/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404)
          throw new Error("존재하지 않거나 삭제된 수업입니다.");
        throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
      }
      const data = await response.json();
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
    if (!lesson?.startsAt || !lesson?.endsAt) {
      alert("수업 시간이 없어 강사 목록을 조회할 수 없습니다.");
      return;
    }

    setIsAssignModalOpen(true);
    setIsFetchingInstructors(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const startUtc = new Date(lesson.startsAt).toISOString();
      const endUtc = new Date(lesson.endsAt).toISOString();

      const response = await fetch(
        `${apiUrl}/lessons/available-instructors?startsAt=${startUtc}&endsAt=${endUtc}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok)
        throw new Error("가용 강사 목록을 불러오지 못했습니다.");

      const data = await response.json();
      setAvailableInstructors(Array.isArray(data) ? data : data.data || []);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setIsFetchingInstructors(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedInstructorId) return;
    setIsAssigning(true);

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiUrl}/lessons/${id}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instructorId: selectedInstructorId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "강사 배정 요청에 실패했습니다.");
      }

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
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiUrl}/lessons/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("수업 취소 처리에 실패했습니다.");

      alert("수업이 취소되었습니다.");
      fetchLessonDetail();
    } catch (err: unknown) {
      alert(`취소 실패: ${getErrorMessage(err)}`);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOpenEdit = () => {
    if (!lesson) {
      return;
    }

    setEditFormData({
      lectureTitle: lesson.lectureTitle || "",
      startsAt: formatForInput(lesson.startsAt),
      endsAt: formatForInput(lesson.endsAt),
      payAmount: lesson.payAmount != null ? String(lesson.payAmount) : "",
      studentCount: lesson.studentCount != null ? String(lesson.studentCount) : "",
      region: lesson.region || "",
      museum: lesson.museum || "",
      guideNotionUrl: lesson.guideNotionUrl || "",
      lessonDetails: lesson.lessonDetails || "",
      deliveryNotes: lesson.deliveryNotes || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

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
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const payload = {
        ...editFormData,
        payAmount: Number(editFormData.payAmount),
        studentCount: Number(editFormData.studentCount),
        startsAt: new Date(editFormData.startsAt).toISOString(),
        endsAt: new Date(editFormData.endsAt).toISOString(),
      };

      const response = await fetch(`${apiUrl}/lessons/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("수업 수정에 실패했습니다.");

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
  const isCanceled =
    lesson.classStatus === "CANCELLED" || lesson.status === "CANCELLED";
  const currentStatus = lesson.classStatus || lesson.status || "";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 10 }}>
      {/* 상단 뒤로가기 & 헤더 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mr: 2 }} disabled={isEditing}>
          목록
        </Button>
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          수업 상세 정보
        </Typography>
        
        {!isCanceled && (
          <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
            {isEditing ? (
              <>
                <Button variant="outlined" color="inherit" onClick={handleCancelEdit} disabled={isUpdating}>취소</Button>
                <Button variant="contained" color="primary" onClick={handleUpdateLesson} disabled={isUpdating}>
                  {isUpdating ? "저장 중..." : "저장 완료"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" color="primary" startIcon={<Edit />} onClick={handleOpenEdit}>수정</Button>
                <Button variant="outlined" color="error" startIcon={<Block />} onClick={handleCancelLesson} disabled={isCanceling}>
                  {isCanceling ? "취소 중..." : "수업 취소"}
                </Button>
              </>
            )}
          </Stack>
        )}
        <Chip
          label={CLASS_STATUS_MAP[currentStatus]?.label || currentStatus}
          color={CLASS_STATUS_MAP[currentStatus]?.color || "warning"}
          sx={{ fontWeight: "bold", fontSize: "1rem", py: 2.5, px: 1 }}
        />
      </Box>

      {/* 기본 정보 카드 */}
      <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        {isEditing ? (
          <Box sx={{ mb: 3 }}>
            <TextField label="수업명" name="lectureTitle" value={editFormData.lectureTitle} onChange={handleEditChange} fullWidth sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField label="지역" name="region" value={editFormData.region} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="박물관/장소" name="museum" value={editFormData.museum} onChange={handleEditChange} fullWidth />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{lesson.lectureTitle}</Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn fontSize="small" /> {lesson.region} {lesson.museum && `> ${lesson.museum}`}
            </Typography>
          </>
        )}

        <Divider sx={{ mb: 4 }} />

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

      {/* 상세 내용 및 메모 카드 */}
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
