"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  CssBaseline,
  Divider,
  CircularProgress,
} from "@mui/material";
import { LockOutlined, Google } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: "sample" }), // 현재는 Mock 데이터 전송
      });

      const data = await response.json();

      // 2. 응답 상태에 따른 처리
      if (response.ok) {
        // 성공 시 명세서대로 accessToken과 userInfo를 로컬 스토리지에 저장
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("로그인 성공! 환영합니다,", data.user.name);

        // 3. 대시보드로 이동
        router.push("/dashboard");
      } else {
        // 명세서의 에러 응답 포맷({ code, message, ... }) 처리
        alert(
          `로그인 실패: ${data.message || "알 수 없는 오류가 발생했습니다."}`,
        );
      }
    } catch (error) {
      console.error("API 통신 에러:", error);
      alert(
        "서버와 연결할 수 없습니다. CORS 이슈이거나 서버가 꺼져있는지 확인해주세요!",
      );
    } finally {
      setIsLoading(false);
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

      {/* 2. 오른쪽 구글 로그인 영역 (40%) */}
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
            sx={{ mb: 5, textAlign: "center" }}
          >
            SETTLY 운영 관리를 위해
            <br />
            구글 워크스페이스 계정으로 로그인해주세요.
          </Typography>

          <Box sx={{ width: "100%" }}>
            {/* 구글 로그인 전용 버튼 */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Google sx={{ color: "#DB4437" }} />
                )
              }
              onClick={handleGoogleLogin}
              disabled={isLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                color: "#3c4043",
                borderColor: "#dadce0",
                bgcolor: "white",
                "&:hover": {
                  bgcolor: "#f8f9fa",
                  borderColor: "#dadce0",
                },
              }}
            >
              {isLoading ? "인증 진행 중..." : "Google 계정으로 계속하기"}
            </Button>

            <Divider sx={{ my: 4 }}>
              <Typography variant="body2" color="textSecondary">
                또는
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="text"
              onClick={() => alert("다른 이메일 로그인 기능은 준비 중입니다.")}
              sx={{ color: "text.secondary" }}
            >
              기타 이메일로 로그인
            </Button>

            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 5 }}
            >
              © 2026 Settly Corp. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
