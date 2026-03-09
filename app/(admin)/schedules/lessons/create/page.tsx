"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Button, Paper, Grid, TextField, InputAdornment,
  Divider, MenuItem, CircularProgress, Stack
} from "@mui/material";
import { ArrowBack, Save, AddBox } from "@mui/icons-material";

export default function CreateLessonPage() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);

  const initialFormState = {
    lectureTitle: "", startsAt: "", endsAt: "", payAmount: "", studentCount: "", 
    region: "", museum: "", guideNotionUrl: "", lessonDetails: "", deliveryNotes: "", instructorId: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchInstructors = async () => {
      if (!formData.startsAt || !formData.endsAt) return;
      const start = new Date(formData.startsAt);
      const end = new Date(formData.endsAt);
      if (start >= end) return;

      setIsFetchingInstructors(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(
          `${apiUrl}/lessons/available-instructors?startsAt=${start.toISOString()}&endsAt=${end.toISOString()}`, 
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("가용 강사 조회 실패");
        const data = await response.json();
        setAvailableInstructors(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        setAvailableInstructors([]);
      } finally {
        setIsFetchingInstructors(false);
      }
    };
    fetchInstructors();
  }, [formData.startsAt, formData.endsAt]);

  const isDateValid = formData.startsAt && formData.endsAt && new Date(formData.startsAt) < new Date(formData.endsAt);
  const isRequiredFilled = !!(
    formData.lectureTitle && formData.startsAt && formData.endsAt && 
    formData.payAmount && formData.studentCount && formData.region && 
    formData.museum && formData.guideNotionUrl && formData.lessonDetails
  );
  const isFormValid = isRequiredFilled && isDateValid;

  const handleSubmit = async (isContinue: boolean) => {
    if (!isFormValid) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        payAmount: Number(formData.payAmount),
        studentCount: Number(formData.studentCount),
        classStatus: formData.instructorId ? "SCHEDULED" : "PENDING", 
      };

      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiUrl}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "서버 에러가 발생했습니다.");
      }

      alert("새 수업이 성공적으로 등록되었습니다!");
      
      if (isContinue) {
        setFormData(initialFormState);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/schedules/lessons");
      }
      
    } catch (error: any) {
      alert(`수업 생성 실패: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", pb: 10 }}>
      {/* 상단 헤더 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4" fontWeight="bold">새 수업 등록</Typography>
      </Box>

      {/* 1. 기본 및 장소 정보 */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>1. 기본 정보 및 장소</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField label="수업명" name="lectureTitle" value={formData.lectureTitle} onChange={handleChange} fullWidth required autoFocus />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="지역 (예: 서울, 경기)" name="region" value={formData.region} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="박물관 / 장소명" name="museum" value={formData.museum} onChange={handleChange} fullWidth required />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. 일정 및 강사 배정 */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>2. 일정 및 강사 배정</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField type="datetime-local" label="시작 일시" name="startsAt" value={formData.startsAt} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} error={formData.startsAt !== "" && formData.endsAt !== "" && !isDateValid} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField type="datetime-local" label="종료 일시" name="endsAt" value={formData.endsAt} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} error={formData.startsAt !== "" && formData.endsAt !== "" && !isDateValid} helperText={formData.startsAt !== "" && formData.endsAt !== "" && !isDateValid ? "종료 오류" : ""} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField select label="담당 강사 배정 (선택)" name="instructorId" value={formData.instructorId} onChange={handleChange} fullWidth disabled={!isDateValid || isFetchingInstructors} helperText={!formData.startsAt || !formData.endsAt ? "일정을 입력하면 가용 강사가 조회됩니다." : isFetchingInstructors ? "강사 조회 중..." : "미배정 시 '강사 대기' 상태로 등록됩니다."}>
              <MenuItem value=""><em>미배정 (나중에 배정하기)</em></MenuItem>
              {availableInstructors.map((inst) => (
                <MenuItem key={inst.instructorId || inst.id} value={inst.instructorId || inst.id}>
                  {inst.instructorName || inst.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. 상세 정보 및 비용 */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>3. 상세 정보 및 비용</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField type="number" label="지급액" name="payAmount" value={formData.payAmount} onChange={handleChange} fullWidth required InputProps={{ endAdornment: <InputAdornment position="end">원</InputAdornment> }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField type="number" label="학생 수" name="studentCount" value={formData.studentCount} onChange={handleChange} fullWidth required InputProps={{ endAdornment: <InputAdornment position="end">명</InputAdornment> }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField type="url" label="가이드 노션 링크" name="guideNotionUrl" value={formData.guideNotionUrl} onChange={handleChange} fullWidth required placeholder="https://notion.so/..." />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="수업 상세 내용" name="lessonDetails" value={formData.lessonDetails} onChange={handleChange} fullWidth multiline rows={3} required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="전달 사항 (메모)" name="deliveryNotes" value={formData.deliveryNotes} onChange={handleChange} fullWidth multiline rows={2} placeholder="강사에게 전달할 추가 메모 (선택)" />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={4} sx={{ position: "fixed", bottom: 0, left: 0, right: 0, p: 2, zIndex: 1000, bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", borderTop: "1px solid #e0e0e0" }}>
        <Box sx={{ maxWidth: 1000, mx: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="textSecondary">
            * 필수 항목을 모두 입력해야 등록할 수 있습니다.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="inherit" onClick={() => router.back()} disabled={isSubmitting}>
              취소
            </Button>
            {/* 단건 등록 후 목록 이동 */}
            <Button variant="outlined" color="primary" startIcon={<Save />} onClick={() => handleSubmit(false)} disabled={!isFormValid || isSubmitting}>
              저장 후 목록으로
            </Button>
            {/* 연속 등록! */}
            <Button variant="contained" color="primary" startIcon={<AddBox />} onClick={() => handleSubmit(true)} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "저장 후 계속 등록하기"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}