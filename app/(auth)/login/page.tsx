"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  CssBaseline,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from "@mui/material";
import { LockOutlined, AdminPanelSettings } from "@mui/icons-material";
import { useRouter } from "next/navigation";

const DEMO_ADMINS = [
  {
    name: "김도윤 관리자",
    email: "admin1@museum-demo.kr",
    description: "메인 발표 계정",
  },
  {
    name: "박서연 관리자",
    email: "admin2@museum-demo.kr",
    description: "보조 시나리오 확인용",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDemoLogin = async (email: string) => {
    setLoadingEmail(email);
    setErrorMessage("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiUrl}/auth/demo-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "web",
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        router.push("/dashboard");
      } else {
        setErrorMessage(
          data.message || "데모 로그인에 실패했습니다. 계정 상태를 확인해주세요.",
        );
      }
    } catch (error) {
      console.error("API 통신 에러:", error);
      setErrorMessage(
        "서버와 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.",
      );
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <CssBaseline />

      {/* 1. 왼쪽 브랜드 영역 (60%) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1.5,
          backgroundImage:
            "url(https://images.unsplash.com/photo-1497215728101-856f4ea42174)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(0,0,0,0.6)",
            p: 6,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
            free-b
          </Typography>
          <Typography variant="h5">
            스마트한 프리랜서 강사 관리 시스템
          </Typography>
        </Box>
      </Box>

      {/* 2. 오른쪽 데모 로그인 영역 (40%) */}
      <Box
        component={Paper}
        elevation={6}
        square
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 48, height: 48 }}>
            <LockOutlined />
          </Avatar>
          <Typography
            component="h1"
            variant="h5"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            관리자 접속
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 4, textAlign: "center" }}
          >
            발표용 데모 계정을 선택하면
            <br />
            바로 관리자 화면으로 진입합니다.
          </Typography>

          <Stack spacing={2} sx={{ width: "100%" }}>
            {DEMO_ADMINS.map((admin) => {
              const isLoading = loadingEmail === admin.email;

              return (
                <Button
                  key={admin.email}
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AdminPanelSettings color="primary" />
                    )
                  }
                  onClick={() => {
                    void handleDemoLogin(admin.email);
                  }}
                  disabled={loadingEmail !== null}
                  sx={{
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    py: 2,
                    px: 2.5,
                    borderRadius: 3,
                    textAlign: "left",
                    color: "text.primary",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {admin.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {admin.email}
                    </Typography>
                    <Chip
                      label={admin.description}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ width: "fit-content" }}
                    />
                  </Box>
                </Button>
              );
            })}

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 2 }}
            >
              백엔드 서버와 seed 데이터가 실행 중이어야 로그인할 수 있습니다.
            </Typography>

            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 2 }}
            >
              © 2026 Settly Corp. All rights reserved.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
