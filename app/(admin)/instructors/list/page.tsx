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
  IconButton,
} from "@mui/material";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  School,
} from "@mui/icons-material";

// 백엔드 기준 ContractStatus (참고)
type ContractStatus =
  | "DRAFT"
  | "SENT"
  | "INSTRUCTOR_SIGNED"
  | "FULLY_SIGNED"
  | "VOID";

// NOTE: 프론트 로컬 상태 (실제 ContractStatus enum과 별개)
const CONTRACT_STATUS = ["전체", "서명완료", "계약대기", "만료임박"];

const MOCK_OPERATIONS = [
  {
    id: 1,
    name: "김철수",
    phone: "010-1234-5678",
    classCount: 6,
    hours: 12,
    status: "서명완료",
  },
  {
    id: 2,
    name: "이영희",
    phone: "010-9876-5432",
    classCount: 4,
    hours: 8,
    status: "만료임박",
  },
  {
    id: 3,
    name: "박지민",
    phone: "010-5555-4444",
    classCount: 0,
    hours: 0,
    status: "계약대기",
  },
  {
    id: 4,
    name: "정민수",
    phone: "010-1111-2222",
    classCount: 12,
    hours: 24,
    status: "서명완료",
  }, // 에이스 강사 추가!
];

export default function InstructorListPage() {
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState("2026-03");
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");

  const handleSearch = () => {
    console.log("검색 조건:", { currentMonth, filterName, filterStatus });
    alert(`${currentMonth}월 데이터 검색이 실행되었습니다!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "서명완료":
        return "success";
      case "만료임박":
        return "warning";
      case "계약대기":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* 1. 상단 타이틀 및 월 선택 컨트롤 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          강사 운영 리스트
        </Typography>

        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 0.5,
            borderRadius: 5,
            border: "1px solid #eee",
            boxShadow: "none",
          }}
        >
          <IconButton size="small">
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ mx: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <CalendarMonth fontSize="small" color="action" />
            2026년 3월
          </Typography>
          <IconButton size="small">
            <ChevronRight />
          </IconButton>
        </Paper>
      </Box>

      {/* 2. 필터 영역 */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="강사명"
            placeholder="이름 입력"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="계약 상태"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {CONTRACT_STATUS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            disableElevation
          >
            검색
          </Button>
        </Stack>
      </Paper>

      {/* 3. 리스트 테이블 (금액 제거, 출강 횟수 강조) */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                이름
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                연락처
              </TableCell>
              {/* 💡 핵심 데이터: 출강 횟수와 근무시간을 나란히 배치하여 가동률 파악 */}
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                이번달 출강 횟수
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                이번달 근무시간
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                계약 상태
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                스케줄
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_OPERATIONS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell align="center" sx={{ fontWeight: "medium" }}>
                  {row.name}
                </TableCell>
                <TableCell align="center">{row.phone}</TableCell>
                {/* 💡 출강 횟수 뱃지 강조 */}
                <TableCell align="center">
                  <Chip
                    icon={<School />}
                    label={`${row.classCount}회`}
                    color={row.classCount > 0 ? "primary" : "default"}
                    variant={row.classCount > 0 ? "filled" : "outlined"}
                    size="small"
                    sx={{ fontWeight: "bold", px: 1 }}
                  />
                </TableCell>
                <TableCell align="center">{row.hours}시간</TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.status}
                    color={getStatusColor(row.status) as any}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedInstructor(row)}
                  >
                    일정 보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. 이번 달 스케줄 요약 패널 */}
      <Drawer
        anchor="right"
        open={!!selectedInstructor}
        onClose={() => setSelectedInstructor(null)}
      >
        <Box sx={{ width: 400, p: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {selectedInstructor?.name} 강사 - 이번 달 일정
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              bgcolor: "#f0f7ff",
              textAlign: "center",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <Box>
              <Typography variant="body2" color="textSecondary">
                총 출강 횟수
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color="primary"
                sx={{ mt: 1 }}
              >
                {selectedInstructor?.classCount}회
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="body2" color="textSecondary">
                총 근무 시간
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color="primary"
                sx={{ mt: 1 }}
              >
                {selectedInstructor?.hours}시간
              </Typography>
            </Box>
          </Paper>

          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            진행 완료 및 예정된 수업 리스트가 여기에 표시됩니다.
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
}
