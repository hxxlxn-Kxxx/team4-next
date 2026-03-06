"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  Chip,
  Stack,
  MenuItem,
  Divider,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = ["날짜/시간", "장소 및 지도안", "강사 배정"];

// 로컬 시간을 UTC ISO 8601으로 변환
const convertToUTCISO8601 = (date: string, time: string): string => {
  if (!date || !time) return "";
  // date: "2026-03-05", time: "09:00" -> "2026-03-05T09:00:00Z"
  return `${date}T${time}:00Z`;
};

const START_HOUR = 8;
const END_HOUR = 22;

const START_TIME_OPTIONS = Array.from({ length: (22 - 8) * 2 + 1 }, (_, i) => {
  const hours = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
});

const END_TIME_OPTIONS = Array.from({ length: (24 - 8) * 2 + 1 }, (_, i) => {
  const hours = 8 + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
});

export default function AssignmentModal({
  open,
  onClose,
}: AssignmentModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  const [lessonDate, setLessonDate] = useState(""); // 수업 날짜
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");

  const [location, setLocation] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartTime(newStart);

    if (newStart) {
      const [hourStr, minuteStr] = newStart.split(":");
      let hour = (parseInt(hourStr, 10) + 2) % 24;

      const formattedHour = hour.toString().padStart(2, "0");
      setEndTime(`${formattedHour}:${minuteStr}`);
    } else {
      setEndTime("");
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCloseModal = () => {
    setActiveStep(0);
    setLessonDate("");
    setStartTime("09:00");
    setEndTime("11:00");
    setLocation("");
    setSelectedInstructor("");
    onClose();
  };

  const handleCreateLesson = () => {
    // 수업 생성 로직 (백엔드 연동 시 API 호출)
    const lessonData = {
      startsAt: convertToUTCISO8601(lessonDate, startTime),
      endsAt: convertToUTCISO8601(lessonDate, endTime),
      location: location,
      instructorId: selectedInstructor,
    };
    console.log("수업 생성 데이터 (UTC ISO 8601):", lessonData);
    // TODO: API 호출 후 handleCloseModal() 실행
    handleCloseModal();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // 1단계: 날짜/시간
        return (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              수업 일정을 선택해주세요.
            </Typography>
            <Stack spacing={3}>
              <TextField
                type="date"
                label="날짜"
                InputLabelProps={{ shrink: true }}
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                fullWidth
                required
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="시작시간"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                >
                  {START_TIME_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="종료시간"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                >
                  {END_TIME_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option === "24:00" ? "24:00 (자정)" : option}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              {/* UTC 변환 미리보기 */}
              {lessonDate && startTime && endTime && (
                <Box sx={{ p: 2, bgcolor: "#f0f7ff", borderRadius: 1 }}>
                  <Typography variant="caption" color="primary">
                    UTC ISO 8601 형식:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", mt: 1 }}
                  >
                    시작: {convertToUTCISO8601(lessonDate, startTime)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    종료: {convertToUTCISO8601(lessonDate, endTime)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        );
      case 1: // 2단계: 장소, 지도안링크
        return (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              수업 장소와 진행할 지도안(노션) 링크를 입력하세요.
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ display: "block", mb: 1 }}
                ></Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
                >
                  <Chip
                    label="국립중앙박물관"
                    onClick={() => setLocation("국립중앙박물관")}
                    color="primary"
                    variant="outlined"
                    sx={{ cursor: "pointer" }}
                  />
                  <Chip
                    label="국립경주박물관"
                    onClick={() => setLocation("국립경주박물관")}
                    color="primary"
                    variant="outlined"
                    sx={{ cursor: "pointer" }}
                  />
                </Stack>
                <TextField
                  label="장소 (필수)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="직접 입력하거나 위의 버튼을 클릭하세요"
                  fullWidth
                  required
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box>
                <TextField
                  label="지도안 링크 (노션 URL)"
                  placeholder="https://notion.so/..."
                  fullWidth
                  sx={{ mb: 3 }}
                />
              </Box>
            </Stack>
          </Box>
        );
      case 2: // 3단계: 강사 선택
        // db 연결시 수정해야함.
        const mockInstructors = [
          {
            id: "inst_1",
            name: "강혜린",
            status: "가용확인 완료",
            match: "98%",
          },
          {
            id: "inst_2",
            name: "김용관",
            status: "스케줄 확인 필요",
            match: "85%",
          },
          {
            id: "inst_3",
            name: "박지혁",
            status: "긴급 대강 가능",
            match: "70%",
          },
        ];
        return (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              해당 일정과 장소에 투입 가능한 강사 목록입니다.
            </Typography>
            <Stack spacing={2}>
              {mockInstructors.map((inst) => {
                // 💡 현재 순회 중인 강사가 선택된 강사인지 확인
                const isSelected = selectedInstructor === inst.id;

                return (
                  <Box
                    key={inst.id}
                    sx={{
                      p: 2,
                      // 💡 선택되면 테두리 색상과 배경색이 부드럽게 강조됩니다!
                      border: isSelected
                        ? "2px solid #6366f1"
                        : "1px solid #eee",
                      borderRadius: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: isSelected
                        ? "rgba(99, 102, 241, 0.05)"
                        : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <Box>
                      <Typography fontWeight="bold">
                        {inst.name} 강사
                        <Typography
                          component="span"
                          variant="caption"
                          color="primary"
                          sx={{ ml: 1 }}
                        >
                          (적합도 {inst.match})
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {inst.status}
                      </Typography>
                    </Box>

                    {/* 💡 선택 여부에 따라 버튼의 디자인과 텍스트가 바뀝니다 */}
                    <Button
                      variant={isSelected ? "contained" : "outlined"}
                      color={isSelected ? "success" : "primary"}
                      size="small"
                      onClick={() =>
                        setSelectedInstructor(isSelected ? "" : inst.id)
                      } // 다시 누르면 취소도 가능!
                      sx={{ minWidth: "80px" }}
                    >
                      {isSelected ? "선택됨 ✔" : "선택"}
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        새 수업 생성
        {/* 기획서에 명시된 '이전 수업 복제' 버튼  */}
        <Tooltip title="가장 최근에 만든 수업 정보를 그대로 가져옵니다">
          <Button
            size="small"
            startIcon={<ContentCopyIcon />}
            variant="outlined"
            color="inherit"
          >
            이전 수업 복제
          </Button>
        </Tooltip>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 350 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleCloseModal} color="inherit">
          취소
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
          이전
        </Button>
        {activeStep === steps.length - 1 ? (
          // 기획서에 명시된 '수업 생성' 버튼 [cite: 45]
          <Button variant="contained" onClick={handleCreateLesson}>
            수업 생성
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            다음
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
