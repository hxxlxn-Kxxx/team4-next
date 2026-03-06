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
  Grid,
} from "@mui/material";
import {
  Add,
  Search,
  PictureAsPdf,
  HistoryEdu,
  VerifiedUser,
} from "@mui/icons-material";

// 백엔드 기준 ContractStatus enum
type ContractStatus =
  | "DRAFT"
  | "SENT"
  | "INSTRUCTOR_SIGNED"
  | "FULLY_SIGNED"
  | "VOID";

// 백엔드 enum → 한국어 텍스트 매핑
const CONTRACT_STATUS_MAP: Record<ContractStatus, string> = {
  DRAFT: "초안",
  SENT: "발송",
  INSTRUCTOR_SIGNED: "열람",
  FULLY_SIGNED: "서명완료",
  VOID: "무효",
};

// 💡 기획서 4-1 반영: 계약 상태 옵션 [cite: 86, 87, 88, 89, 90]
const STATUS_OPTIONS = ["전체", "초안", "발송", "열람", "서명완료"];

// 임시 계약 데이터
const MOCK_CONTRACTS = [
  {
    id: "C-2603-01",
    name: "김철수",
    type: "정규 프리랜서",
    status: "FULLY_SIGNED" as ContractStatus,
    startDate: "2026-03-01",
    endDate: "2026-08-31",
  },
  {
    id: "C-2603-02",
    name: "이영희",
    type: "단기 대강",
    status: "INSTRUCTOR_SIGNED" as ContractStatus,
    startDate: "2026-03-10",
    endDate: "2026-03-31",
  },
  {
    id: "C-2603-03",
    name: "박지민",
    type: "정규 프리랜서",
    status: "SENT" as ContractStatus,
    startDate: "2026-04-01",
    endDate: "2026-09-30",
  },
  {
    id: "C-2603-04",
    name: "강혜린",
    type: "정규 프리랜서",
    status: "DRAFT" as ContractStatus,
    startDate: "2026-03-15",
    endDate: "2026-09-14",
  },
];

export default function ContractsPage() {
  const [selectedContract, setSelectedContract] = useState<any>(null); // 상세 패널용
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");

  // 상태별 칩 색상 지정 (전자계약 UX의 핵심!)
  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case "FULLY_SIGNED":
        return "success"; // 초록색 (안전) [cite: 90]
      case "INSTRUCTOR_SIGNED":
        return "warning"; // 주황색 (진행중) [cite: 89]
      case "SENT":
        return "info"; // 파란색 (대기중) [cite: 88]
      case "DRAFT":
        return "default"; // 회색 (시작 전) [cite: 87]
      case "VOID":
        return "error"; // 빨간색 (무효)
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* 1. 상단 타이틀 및 생성 버튼 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          계약 관리
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          새 계약 생성
        </Button>
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
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<Search />} disableElevation>
            검색
          </Button>
        </Stack>
      </Paper>

      {/* 3. 리스트 테이블 (기획서 4-1 완벽 반영) [cite: 84, 85] */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                강사명
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                계약 유형
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상태
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                시작일
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                종료일
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                상세
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_CONTRACTS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell align="center" sx={{ fontWeight: "medium" }}>
                  {row.name}
                </TableCell>
                <TableCell align="center">{row.type}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={CONTRACT_STATUS_MAP[row.status]}
                    color={getStatusColor(row.status) as any}
                    size="small"
                    variant={
                      row.status === "FULLY_SIGNED" ? "filled" : "outlined"
                    }
                    sx={{ fontWeight: "bold" }}
                  />
                </TableCell>
                <TableCell align="center">{row.startDate}</TableCell>
                <TableCell align="center">{row.endDate}</TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedContract(row)}
                  >
                    보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. 계약 상세 패널 (기획서 4-3 반영) [cite: 102] */}
      <Drawer
        anchor="right"
        open={!!selectedContract}
        onClose={() => setSelectedContract(null)}
      >
        <Box
          sx={{
            width: 450,
            p: 4,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            계약 상세 정보
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            계약 번호: {selectedContract?.id}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {/* 서명 상태 및 로그 영역 [cite: 104, 105, 106, 107] */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: "#f8f9fa", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <VerifiedUser
                color={
                  selectedContract?.status === "FULLY_SIGNED"
                    ? "success"
                    : "disabled"
                }
              />
              <Typography variant="subtitle1" fontWeight="bold">
                {CONTRACT_STATUS_MAP[selectedContract?.status]}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  서명 시간
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {selectedContract?.status === "FULLY_SIGNED"
                    ? "2026-03-05 14:30"
                    : "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  서명 IP
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {selectedContract?.status === "FULLY_SIGNED"
                    ? "192.168.1.104"
                    : "-"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* PDF 미리보기 버튼 [cite: 100, 103] */}
          <Button
            variant="outlined"
            size="large"
            startIcon={<PictureAsPdf />}
            sx={{ py: 2, mb: "auto", borderStyle: "dashed", borderWidth: 2 }}
          >
            계약서 원본 PDF 열람
          </Button>

          {/* 하단 액션 버튼 (상태에 따라 다르게 보임) */}
          <Box sx={{ pt: 3, borderTop: "1px solid #eee" }}>
            {selectedContract?.status !== "서명완료" && (
              <Button variant="contained" fullWidth size="large" sx={{ mb: 1 }}>
                계약서 재발송 (알림톡)
              </Button>
            )}
            <Button variant="text" color="error" fullWidth>
              계약 파기
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
