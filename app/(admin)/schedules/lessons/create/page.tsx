"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Button, Paper, Grid, TextField, InputAdornment,
  MenuItem, CircularProgress, Stack, Divider
} from "@mui/material";
import { ArrowBack, Save, AddBox, Search, CheckCircle } from "@mui/icons-material";

// 💡 전담 우체국 임포트!
import { apiClient } from "@/src/lib/apiClient";

export default function CreateLessonPage() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 강사 배정 State
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);

  // 장소 검색 State 💡
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);

  const initialFormState = {
    lectureTitle: "", startsAt: "", endsAt: "", payAmount: "", studentCount: "", 
    region: "", museum: "", guideNotionUrl: "", lessonDetails: "", deliveryNotes: "", instructorId: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 💡 장소 검색 핸들러
  const handleSearchVenue = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingVenue(true);
    try {
      const results = await apiClient.searchVenue(searchQuery);
      setSearchResults(Array.isArray(results) ? results : results.data || []);
    } catch (error) {
      console.error("장소 검색 에러:", error);
      alert("장소를 검색하는 중 오류가 발생했습니다.");
    } finally {
      setIsSearchingVenue(false);
    }
  };

  // 💡 장소 선택 시 폼 자동 채우기 (UX 디테일)
  const handleSelectVenue = (place: any) => {
    setSelectedVenue(place);
    setFormData((prev) => ({
      ...prev,
      museum: place.venueName,
      region: place.venueAddress.split(" ")[0] || prev.region, // 주소의 첫 부분(예: 서울, 경기)을 지역으로!
    }));
    setSearchResults([]); // 선택 후 리스트 닫기
  };

  // 💡 가용 강사 조회 (apiClient로 교체)
  useEffect(() => {
    const fetchInstructors = async () => {
      if (!formData.startsAt || !formData.endsAt) return;
      const start = new Date(formData.startsAt);
      const end = new Date(formData.endsAt);
      if (start >= end) return;

      setIsFetchingInstructors(true);
      try {
        const data = await apiClient.getAvailableInstructors(start.toISOString(), end.toISOString());
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
  
  // 💡 필수값 체크 (장소 검색 객체도 포함)
  const isRequiredFilled = !!(
    formData.lectureTitle && formData.startsAt && formData.endsAt && 
    formData.payAmount && formData.studentCount && formData.region && 
    formData.museum && formData.guideNotionUrl && formData.lessonDetails && selectedVenue
  );
  const isFormValid = isRequiredFilled && isDateValid;

  const handleSubmit = async (isContinue: boolean) => {
    if (!isFormValid) return;
    setIsSubmitting(true);

    try {
      // 💡 1. 백엔드 요구사항에 맞춘 통합 Payload
      const payload = {
        ...formData,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        payAmount: Number(formData.payAmount),
        studentCount: Number(formData.studentCount),
        // 장소 검색 데이터 추가
        venueName: selectedVenue.venueName,
        venueAddress: selectedVenue.venueAddress,
        venueLat: selectedVenue.venueLat,
        venueLng: selectedVenue.venueLng,
        kakaoPlaceId: selectedVenue.kakaoPlaceId,
      };

      // 💡 2. 수업 생성 (apiClient 사용)
      const createdLesson = await apiClient.createLesson(payload);
      const newLessonId = createdLesson.lessonId || createdLesson.id;

      // 💡 3. 강사 배정 API 연달아 찌르기
      if (formData.instructorId && newLessonId) {
        await apiClient.assignInstructor(newLessonId, formData.instructorId);
      }

      alert("새 수업이 성공적으로 등록되었습니다!");
      
      if (isContinue) {
        // 연속 등록 시 상태 초기화
        setFormData(initialFormState);
        setSelectedVenue(null);
        setSearchQuery("");
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
          
          {/* 💡 카카오 장소 검색 UI 추가 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>수업 장소 검색 (카카오)</Typography>
            <Stack direction="row" spacing={1}>
              <TextField 
                label="장소 검색 (예: 국립중앙박물관)" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                fullWidth 
                onKeyPress={(e) => e.key === 'Enter' && handleSearchVenue()}
                InputProps={{
                  endAdornment: isSearchingVenue ? <CircularProgress size={20} /> : null
                }}
              />
              <Button variant="contained" onClick={handleSearchVenue} disabled={isSearchingVenue || !searchQuery} sx={{ minWidth: 100 }}>
                <Search />
              </Button>
            </Stack>

            {/* 검색 결과 리스트 */}
            {searchResults.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflowY: "auto", border: "1px solid #e0e0e0" }}>
                {searchResults.map((place) => (
                  <Box
                    key={place.kakaoPlaceId}
                    onClick={() => handleSelectVenue(place)}
                    sx={{ p: 2, cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" }, borderBottom: "1px solid #eee" }}
                  >
                    <Typography variant="body1" fontWeight="bold">{place.venueName}</Typography>
                    <Typography variant="body2" color="text.secondary">{place.venueAddress}</Typography>
                  </Box>
                ))}
              </Paper>
            )}

            {/* 선택된 장소 표시 */}
            {selectedVenue && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#E8F5E9", borderRadius: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="success.main">장소가 선택되었습니다.</Typography>
                  <Typography variant="body1">{selectedVenue.venueName} <Typography component="span" variant="caption" color="text.secondary">({selectedVenue.venueAddress})</Typography></Typography>
                </Box>
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="지역 (예: 서울, 경기)" name="region" value={formData.region} onChange={handleChange} fullWidth required helperText="검색 시 자동 입력됩니다." />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="박물관 / 장소명" name="museum" value={formData.museum} onChange={handleChange} fullWidth required helperText="검색 시 자동 입력됩니다." />
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
            <TextField select label="담당 강사 배정 (선택)" name="instructorId" value={formData.instructorId} onChange={handleChange} fullWidth disabled={!isDateValid || isFetchingInstructors} helperText={!formData.startsAt || !formData.endsAt ? "일정을 입력하면 가용 강사가 조회됩니다." : isFetchingInstructors ? "강사 조회 중..." : "미배정 시 '배정 대기' 상태로 등록됩니다."}>
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
            <Button variant="outlined" color="primary" startIcon={<Save />} onClick={() => handleSubmit(false)} disabled={!isFormValid || isSubmitting}>
              저장 후 목록으로
            </Button>
            <Button variant="contained" color="primary" startIcon={<AddBox />} onClick={() => handleSubmit(true)} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "저장 후 계속 등록하기"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}