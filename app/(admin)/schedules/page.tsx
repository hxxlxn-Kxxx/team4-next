"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Drawer,
  Divider,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import AssignmentModal from "@/src/components/AssignmentModal";

// 백엔드 기준 Lesson/LessonRequest Status enum
type LessonStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONTRACT_SIGNED"
  | "UPDATED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type LessonRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

// 백엔드 enum → 프론트 한국어 매핑
const LESSON_STATUS_MAP: Record<LessonStatus, string> = {
  PENDING: "미배정",
  ACCEPTED: "요청중",
  CONTRACT_SIGNED: "확정",
  UPDATED: "수정됨",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

// 기획서 기반 상태 옵션
const STATUS_OPTIONS = ["전체", "미배정", "요청중", "확정"];

export default function SchedulesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null); // 상세 보기용

  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState(""); // 시간 필터 추가
  const [filterInstructor, setFilterInstructor] = useState(""); // 강사 필터 추가
  const [filterStatus, setFilterStatus] = useState("전체");

  const handleSearch = () => {
    // 실제 백엔드가 붙으면 여기서 API를 호출해 데이터를 다시 불러옵니다!
    console.log("검색 조건:", {
      filterDate,
      filterTime,
      filterInstructor,
      filterStatus,
    });
    alert("검색이 실행되었습니다! (콘솔을 확인해보세요)");
  };

  const handleReset = () => {
    setFilterDate("");
    setFilterTime("");
    setFilterInstructor("");
    setFilterStatus("전체");
  };

  const getStatusColor = (status: LessonStatus | string) => {
    switch (status) {
      case "CONTRACT_SIGNED":
      case "확정":
        return "success";
      case "ACCEPTED":
      case "요청중":
        return "warning";
      case "PENDING":
      case "미배정":
        return "error";
      case "IN_PROGRESS":
      case "진행중":
        return "primary";
      case "COMPLETED":
      case "완료":
        return "success";
      case "CANCELLED":
      case "취소":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* 상단 타이틀 및 생성 버튼 [cite: 30, 33] */}
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
          onClick={() => setIsModalOpen(true)}
        >
          새 수업 생성
        </Button>
      </Box>

      {/* 필터 영역 [cite: 31, 32] */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        {/* 상단: 4개의 필터 입력창 */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            type="date"
            label="날짜"
            InputLabelProps={{ shrink: true }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            type="time"
            label="시간"
            InputLabelProps={{ shrink: true }}
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="강사명"
            placeholder="이름 입력"
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            select
            label="상태"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            fullWidth
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={handleReset}>
            초기화
          </Button>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            disableElevation
          >
            검색
          </Button>
        </Box>
      </Paper>

      {/* 리스트 테이블  */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                날짜
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                시간
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                장소
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                인원
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                강사
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상태
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상세
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 데이터 맵핑 영역 (예시) */}
            <TableRow hover>
              <TableCell align="center">2026-03-05</TableCell>
              <TableCell align="center">10:00 - 12:00</TableCell>
              <TableCell align="center">국립중앙박물관</TableCell>
              <TableCell align="center">8명</TableCell>
              <TableCell align="center">김철수</TableCell>
              <TableCell align="center">
                <Chip label="확정" color="success" size="small" />
              </TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  onClick={() =>
                    setSelectedClass({ title: "[초등] 역사 탐험대" })
                  }
                >
                  보기
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 수업 상세 슬라이드 패널 (기획서 2-3 반영)  */}
      <Drawer
        anchor="right"
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
      >
        <Box sx={{ width: 400, p: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            수업 상세 정보
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* 도착 체크인 영역 [cite: 61] */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
            📍 도착 체크인 현황
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "#f0f7ff" }}>
            <Typography variant="body2">
              체크인 시간: 09:55 (정상) [cite: 63, 66]
            </Typography>
            <Typography variant="body2">
              GPS 거리: 15m 이내 [cite: 65]
            </Typography>
          </Paper>

          <Stack spacing={2} sx={{ mt: 4 }}>
            <Button variant="outlined" fullWidth>
              강사 변경 [cite: 68]
            </Button>
            <Button variant="outlined" color="error" fullWidth>
              수업 취소 [cite: 69]
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <AssignmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  );
}
