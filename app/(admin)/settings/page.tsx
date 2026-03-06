"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  Divider,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";
import { Save, Tune, NotificationsActive, Person } from "@mui/icons-material";

export default function SettingsPage() {
  const [tabIndex, setTabIndex] = useState(0);

  // 알림 설정 State (토글 스위치용)
  const [alerts, setAlerts] = useState({
    lateCheckIn: true,
    contractExpiry: true,
    newClassRequest: false,
    systemError: true,
  });

  const handleToggle = (key: keyof typeof alerts) => {
    setAlerts({ ...alerts, [key]: !alerts[key] });
  };

  const handleSave = () => {
    alert("설정이 성공적으로 저장되었습니다!");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* 1. 상단 타이틀 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          환경 설정
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disableElevation
        >
          변경사항 저장
        </Button>
      </Box>

      {/* 2. 메인 설정 패널 (탭 구조) */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* 탭 헤더 */}
        <Box
          sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8f9fa" }}
        >
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
            variant="fullWidth"
          >
            <Tab
              icon={<Tune />}
              iconPosition="start"
              label="운영 기본 설정"
              sx={{ py: 2 }}
            />
            <Tab
              icon={<NotificationsActive />}
              iconPosition="start"
              label="알림 설정"
              sx={{ py: 2 }}
            />
            <Tab
              icon={<Person />}
              iconPosition="start"
              label="내 계정 관리"
              sx={{ py: 2 }}
            />
          </Tabs>
        </Box>

        {/* 탭 콘텐츠 영역 */}
        <Box sx={{ p: 4 }}>
          {/* 탭 1: 운영 기본 설정 */}
          {tabIndex === 0 && (
            <Stack spacing={4}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  강사 정산 및 계약 기준
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 2 }}
                >
                  신규 강사 등록 시 기본으로 세팅되는 금액과 기준을 설정합니다.
                </Typography>
                <Stack direction="row" spacing={3}>
                  <TextField
                    label="초기 기본 시급"
                    defaultValue="30,000"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">원</InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                  <TextField
                    label="계약 만료 알림 기준"
                    defaultValue="30"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">일 전</InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  수업 및 체크인 기준
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    label="도착 체크인 허용 반경"
                    defaultValue="50"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">m (미터)</InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                  <TextField
                    label="지각 처리 기준"
                    defaultValue="수업 시작 10분 전"
                    fullWidth
                  />
                </Stack>
              </Box>
            </Stack>
          )}

          {/* 탭 2: 알림 설정 */}
          {tabIndex === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                시스템 알림 (Push / Dashboard)
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography fontWeight="medium">
                    강사 현장 체크인 지각 알림
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    수업 시작 전까지 체크인하지 않은 경우 경고를 띄웁니다.
                  </Typography>
                </Box>
                <Switch
                  checked={alerts.lateCheckIn}
                  onChange={() => handleToggle("lateCheckIn")}
                  color="primary"
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography fontWeight="medium">
                    전자계약 만료 임박 알림
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    강사의 계약 종료일이 다가오면 대시보드에 표시합니다.
                  </Typography>
                </Box>
                <Switch
                  checked={alerts.contractExpiry}
                  onChange={() => handleToggle("contractExpiry")}
                  color="primary"
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography fontWeight="medium">
                    강사의 대강(대체강사) 요청 알림
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    강사가 앱에서 긴급 대강을 요청했을 때 알림을 받습니다.
                  </Typography>
                </Box>
                <Switch
                  checked={alerts.newClassRequest}
                  onChange={() => handleToggle("newClassRequest")}
                  color="primary"
                />
              </Paper>
            </Stack>
          )}

          {/* 탭 3: 내 계정 관리 */}
          {tabIndex === 2 && (
            <Stack spacing={4}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  관리자 프로필
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    label="이름"
                    defaultValue="최고 관리자"
                    fullWidth
                  />
                  <TextField
                    label="이메일 주소"
                    defaultValue="admin@settly.com"
                    fullWidth
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  보안 설정
                </Typography>
                <Stack spacing={2} sx={{ mt: 2, maxWidth: 400 }}>
                  <TextField
                    label="현재 비밀번호"
                    type="password"
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="새 비밀번호"
                    type="password"
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="새 비밀번호 확인"
                    type="password"
                    size="small"
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    sx={{ mt: 1, alignSelf: "flex-start" }}
                  >
                    비밀번호 변경
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
