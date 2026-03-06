"use client";

import React, { useState } from "react";
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
  Checkbox,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  Download,
  CheckCircle,
} from "@mui/icons-material";

// 임시 정산 데이터 (기획서 5번 테이블 항목 완벽 반영 )
const MOCK_SETTLEMENTS = [
  {
    id: 1,
    name: "김철수",
    classCount: 8,
    hours: 16,
    basePay: 480000,
    manualBonus: 50000,
    totalPay: 530000,
    status: "지급 대기",
  },
  {
    id: 2,
    name: "이영희",
    classCount: 4,
    hours: 8,
    basePay: 280000,
    manualBonus: 0,
    totalPay: 280000,
    status: "지급 완료",
  },
  {
    id: 3,
    name: "박지민",
    classCount: 12,
    hours: 24,
    basePay: 600000,
    manualBonus: 100000,
    totalPay: 700000,
    status: "지급 대기",
  },
];

export default function SettlementPage() {
  const [currentMonth, setCurrentMonth] = useState("2026-03");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // 체크박스 전체 선택/해제 로직
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(MOCK_SETTLEMENTS.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  return (
    <Box>
      {/* 1. 상단 타이틀 및 월 선택 (기획서 반영 ) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          월별 정산 관리
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

      {/* 2. 요약 카드 영역 (실무 꿀팁: 총액을 먼저 보여주면 아주 좋습니다!) */}
      <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
        <Paper
          sx={{
            p: 3,
            flex: 1,
            borderRadius: 3,
            borderLeft: "4px solid #1976d2",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            이번 달 총 지급 예정액
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            1,510,000원
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 3,
            flex: 1,
            borderRadius: 3,
            borderLeft: "4px solid #2e7d32",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            지급 완료
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            280,000원
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 3,
            flex: 1,
            borderRadius: 3,
            borderLeft: "4px solid #ed6c02",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            지급 대기 (미처리)
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            1,230,000원
          </Typography>
        </Paper>
      </Stack>

      {/* 3. 정산 테이블 (기획서 테이블 컬럼 완벽 반영 ) */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          mb: 3,
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < MOCK_SETTLEMENTS.length
                  }
                  checked={selectedRows.length === MOCK_SETTLEMENTS.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                강사명
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                수업 수
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                근무시간
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                기본 지급액
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", color: "#ed6c02" }}
              >
                수동 수당 (조정)
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  color: "#1976d2",
                  fontSize: "1.1rem",
                }}
              >
                최종 지급액
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상태
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_SETTLEMENTS.map((row) => {
              const isSelected = selectedRows.includes(row.id);
              return (
                <TableRow key={row.id} hover selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectOne(row.id)}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "medium" }}>
                    {row.name}
                  </TableCell>
                  <TableCell align="center">{row.classCount}회</TableCell>
                  <TableCell align="center">{row.hours}시간</TableCell>
                  <TableCell align="center">
                    {row.basePay.toLocaleString()}원
                  </TableCell>

                  {/* 💡 수동 수당은 관리자가 직접 입력할 수 있도록 TextField 적용! */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      defaultValue={row.manualBonus}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">원</InputAdornment>
                        ),
                      }}
                      sx={{ width: 130 }}
                      disabled={row.status === "지급 완료"} // 완료된 건은 수정 불가
                    />
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "#1976d2",
                      fontSize: "1.1rem",
                    }}
                  >
                    {row.totalPay.toLocaleString()}원
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      color={row.status === "지급 완료" ? "success" : "warning"}
                      size="small"
                      variant={
                        row.status === "지급 완료" ? "filled" : "outlined"
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. 하단 액션 버튼 (기획서 하단 영역 반영 ) */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Download />}
          size="large"
        >
          엑셀 다운로드
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          size="large"
          disabled={selectedRows.length === 0} // 선택된 항목이 없으면 비활성화
        >
          {selectedRows.length > 0 ? `${selectedRows.length}건 ` : ""}지급 완료
          처리
        </Button>
      </Box>
    </Box>
  );
}
