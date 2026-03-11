"use client";

import { useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomBadge from "@/src/components/atoms/AtomBadge";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import { apiClient } from "@/src/lib/apiClient";
import { localDateAndTimeToUtcIso } from "@/src/lib/dateTime";

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const steps = ["기본 정보/시간", "장소 및 지도안", "강사 배정"];

const START_TIME_OPTIONS = Array.from({ length: (22 - 8) * 2 + 1 }, (_, index) => {
  const hours = 8 + Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
});

const END_TIME_OPTIONS = Array.from({ length: (24 - 8) * 2 + 1 }, (_, index) => {
  const hours = 8 + Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
});

export default function AssignmentModal({ open, onClose, onSuccess }: AssignmentModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  
  const [lectureTitle, setLectureTitle] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [guideUrl, setGuideUrl] = useState("");

  const [region, setRegion] = useState("");
  const [museum, setMuseum] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [lessonDetails, setLessonDetails] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearInstructorSelection = () => {
    setSelectedInstructorId("");
    setAvailableInstructors([]);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    clearInstructorSelection();
    if (!value) {
      setEndTime("");
      return;
    }
    const [hourString, minuteString] = value.split(":");
    const nextHour = (parseInt(hourString, 10) + 2) % 24;
    setEndTime(`${nextHour.toString().padStart(2, "0")}:${minuteString}`);
  };

  const handleLessonDateChange = (value: string) => {
    setLessonDate(value);
    clearInstructorSelection();
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    clearInstructorSelection();
  };

  const handleVenueSelect = (venue: any) => {
    setSelectedVenue(venue);
    clearInstructorSelection();
  };

  const resetState = () => {
    setActiveStep(0);
    setLectureTitle("");
    setLessonDate("");
    setStartTime("09:00");
    setEndTime("11:00");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedVenue(null);
    setAvailableInstructors([]);
    setGuideUrl("");
    setRegion("");
    setMuseum("");
    setPayAmount("");
    setStudentCount("");
    setLessonDetails("");
    setDeliveryNotes("");
    setSelectedInstructorId("");
  };

  const handleCloseModal = () => {
    resetState();
    onClose();
  };

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

  const fetchAvailableInstructors = async () => {
    setIsFetchingInstructors(true);
    try {
      const startsAt = localDateAndTimeToUtcIso(lessonDate, startTime);
      const endsAt = localDateAndTimeToUtcIso(lessonDate, endTime);
      const data = await apiClient.getAvailableInstructors(startsAt, endsAt);
      setAvailableInstructors(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("강사 조회 에러:", error);
    } finally {
      setIsFetchingInstructors(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !lectureTitle) return alert("수업명을 입력해주세요.");
    if (activeStep === 0 && !lessonDate) return alert("날짜를 선택해주세요.");
    if (activeStep === 1 && !selectedVenue) return alert("수업 장소를 검색하고 선택해주세요.");
    
    if (activeStep === 1) fetchAvailableInstructors();
    
    setActiveStep((prev) => prev + 1);
  };

  const handleCreateLesson = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        lectureTitle,
        startsAt: localDateAndTimeToUtcIso(lessonDate, startTime),
        endsAt: localDateAndTimeToUtcIso(lessonDate, endTime),
        venueName: selectedVenue.venueName,
        venueAddress: selectedVenue.venueAddress,
        venueLat: selectedVenue.venueLat,
        venueLng: selectedVenue.venueLng,
        kakaoPlaceId: selectedVenue.kakaoPlaceId,
        guideNotionUrl: guideUrl,
        region,
        museum,
        lessonDetails,
        deliveryNotes,
        payAmount: Number(payAmount) || 0,
        studentCount: Number(studentCount) || 0,
      };
      const createdLesson = await apiClient.createLesson(payload);
      const newLessonId = createdLesson.lessonId || createdLesson.id;
      if (selectedInstructorId && newLessonId) {
        await apiClient.assignInstructor(newLessonId, selectedInstructorId);
      }

      alert("수업이 성공적으로 생성되었습니다!");
      if (onSuccess) onSuccess(); // 목록 새로고침
      handleCloseModal();
    } catch (error: any) {
      console.error("생성 에러:", error);
      alert(error.message || "수업 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 렌더링 함수들 ---

  const renderStepPills = () => (
    <Stack direction="row" spacing={1.25} sx={{ mb: 4, flexWrap: "wrap" }}>
      {steps.map((label, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        return (
          <Box key={label} sx={{ px: 2, py: 1, borderRadius: "16px 0 16px 16px", border: "1px solid #EFD9A2", backgroundColor: isActive ? "#FFF0C2" : isCompleted ? "#FBF7ED" : "#FFFFFF", color: "#251B10", fontWeight: 700, fontSize: 13 }}>
            {index + 1}. {label}
          </Box>
        );
      })}
    </Stack>
  );

  const renderDateStep = () => (
    <Stack spacing={2.5}>
      <Typography variant="subtitle2" color="text.secondary">수업명과 일정을 선택해주세요.</Typography>
      <AtomInput label="수업명" value={lectureTitle} onChange={(e) => setLectureTitle(e.target.value)} placeholder="예: [초등] 신라의 달밤 투어" fullWidth required />
      
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <AtomInput label="지역" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 서울" fullWidth />
        <AtomInput label="분류 (박물관/기관)" value={museum} onChange={(e) => setMuseum(e.target.value)} placeholder="예: 국립중앙박물관" fullWidth />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <AtomInput type="number" label="강사 지급액(원)" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="예: 120000" fullWidth />
        <AtomInput type="number" label="배정 학생 수(명)" value={studentCount} onChange={(e) => setStudentCount(e.target.value)} placeholder="예: 10" fullWidth />
      </Stack>

      <AtomInput type="date" label="날짜" value={lessonDate} onChange={(e) => handleLessonDateChange(e.target.value)} fullWidth required />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <AtomInput select label="시작시간" value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} fullWidth required>
          {START_TIME_OPTIONS.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
        </AtomInput>
        <AtomInput select label="종료시간" value={endTime} onChange={(e) => handleEndTimeChange(e.target.value)} fullWidth required>
          {END_TIME_OPTIONS.map((opt) => (<MenuItem key={opt} value={opt}>{opt === "24:00" ? "24:00 (자정)" : opt}</MenuItem>))}
        </AtomInput>
      </Stack>
    </Stack>
  );

  const renderLocationStep = () => (
    <Stack spacing={2.5}>
      <Typography variant="subtitle2" color="text.secondary">수업 장소를 카카오 장소 검색으로 찾아주세요.</Typography>
      
      <Stack direction="row" spacing={1}>
        <AtomInput 
          label="장소 검색" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="예: 국립중앙박물관" 
          fullWidth 
          onKeyPress={(e) => e.key === 'Enter' && handleSearchVenue()}
        />
        <AtomButton onClick={handleSearchVenue} disabled={isSearchingVenue || !searchQuery} sx={{ minWidth: 80 }}>
          {isSearchingVenue ? <CircularProgress size={20} /> : "검색"}
        </AtomButton>
      </Stack>

      {searchResults.length > 0 && (
        <SurfaceCard sx={{ maxHeight: 200, overflowY: "auto", p: 1, border: "1px solid #EBDDC3", boxShadow: "none" }}>
          {searchResults.map((place) => (
            <Box
              key={place.kakaoPlaceId}
              onClick={() => handleVenueSelect(place)}
              sx={{
                p: 1.5, cursor: "pointer", borderRadius: 1,
                bgcolor: selectedVenue?.kakaoPlaceId === place.kakaoPlaceId ? "#FFF8E1" : "transparent",
                "&:hover": { bgcolor: "#FBF7ED" }
              }}
            >
              <Typography variant="body2" fontWeight="bold">{place.venueName}</Typography>
              <Typography variant="caption" color="text.secondary">{place.venueAddress}</Typography>
            </Box>
          ))}
        </SurfaceCard>
      )}

      {selectedVenue && (
        <Box sx={{ p: 2, bgcolor: "#E8F5E9", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" fontWeight="bold" color="success.main">✔ 선택된 장소:</Typography>
          <Typography variant="body2">{selectedVenue.venueName}</Typography>
        </Box>
      )}

      <Divider />
      <AtomInput label="지도안 링크 (노션 URL)" value={guideUrl} onChange={(e) => setGuideUrl(e.target.value)} placeholder="https://notion.so/..." fullWidth />
      <AtomInput label="수업 상세 내용" value={lessonDetails} onChange={(e) => setLessonDetails(e.target.value)} placeholder="예: 연표 카드를 이용한 체험형 활동" multiline rows={3} fullWidth />
      <AtomInput label="강사 전달 사항" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="예: 수업 10분 전 집결할 수 있도록 안내" multiline rows={2} fullWidth />
    </Stack>
  );

  const renderInstructorStep = () => (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">해당 일정과 장소에 투입 가능한 강사 목록입니다. (건너뛰기 가능)</Typography>
      
      {isFetchingInstructors ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : availableInstructors.length === 0 ? (
        <SurfaceCard sx={{ p: 3, textAlign: "center", boxShadow: "none" }}><Typography color="text.secondary">가용 가능한 강사가 없습니다.</Typography></SurfaceCard>
      ) : (
        availableInstructors.map((instructor) => {
          const isSelected = selectedInstructorId === (instructor.instructorId || instructor.id);
          return (
            <SurfaceCard key={instructor.instructorId || instructor.id} sx={{ p: 2.5, borderRadius: "18px 0 18px 18px", backgroundColor: isSelected ? "#FFF8E1" : "#FFFFFF", borderColor: isSelected ? "#D8B457" : "divider", boxShadow: "none" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <Typography variant="subtitle2">{instructor.instructorName || instructor.name} 강사</Typography>
                  </Stack>
                </Box>
                <AtomButton atomVariant={isSelected ? "secondary" : "outline"} size="small" onClick={() => setSelectedInstructorId(isSelected ? "" : (instructor.instructorId || instructor.id))}>
                  {isSelected ? "선택됨" : "선택"}
                </AtomButton>
              </Stack>
            </SurfaceCard>
          );
        })
      )}
    </Stack>
  );

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "28px 0 28px 28px", overflow: "hidden", backgroundColor: "#FFF9EF" } }}>
      <DialogTitle component="div" sx={{ px: 4, py: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EBDDC3" }}>
        <Typography variant="h4" component="div">새 수업 생성</Typography>
        <Tooltip title="가장 최근에 만든 수업 정보를 그대로 가져옵니다">
          <Box><AtomButton atomVariant="outline" size="small" startIcon={<ContentCopyIcon />}>이전 수업 복제</AtomButton></Box>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3.5 }}>
        {renderStepPills()}
        {activeStep === 0 && renderDateStep()}
        {activeStep === 1 && renderLocationStep()}
        {activeStep === 2 && renderInstructorStep()}
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 3, borderTop: "1px solid #EBDDC3" }}>
        <AtomButton atomVariant="ghost" onClick={handleCloseModal} disabled={isSubmitting}>취소</AtomButton>
        <Box sx={{ flexGrow: 1 }} />
        <AtomButton atomVariant="outline" disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep((prev) => prev - 1)}>이전</AtomButton>
        {activeStep === steps.length - 1 ? (
          <AtomButton onClick={handleCreateLesson} disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : (selectedInstructorId ? "생성 및 배정하기" : "수업만 생성하기")}
          </AtomButton>
        ) : (
          <AtomButton onClick={handleNext}>다음</AtomButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
