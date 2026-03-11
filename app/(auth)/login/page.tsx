"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/navigation";
import { apiClient, persistAuthSession } from "@/src/lib/apiClient";

import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomBadge from "@/src/components/atoms/AtomBadge";
import AtomButton from "@/src/components/atoms/AtomButton";

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

const highlights = [
  "실시간 수업 운영 현황",
  "강사 배정 및 계약 관리",
  "정산/설정 관리자 워크플로우",
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDemoLogin = async (email: string) => {
    setLoadingEmail(email);
    setErrorMessage("");

    try {
      // const data = await apiClient.postAuthGoogle(email);
      const data = await apiClient.postAuthDemo(email);
      
      persistAuthSession(data.accessToken, data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      router.push("/dashboard");
    } catch (error: any) {
      console.error("demo login error:", error);
      setErrorMessage(
        error.message || "서버와 연결할 수 없습니다. 백엔드 상태를 확인해주세요.",
      );
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        background:
          "radial-gradient(circle at top left, rgba(243, 199, 66, 0.22), transparent 28%), linear-gradient(180deg, #FFF9EF 0%, #F7F1E4 100%)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <SurfaceCard
          sx={{
            p: { xs: 3, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: { lg: "calc(100vh - 64px)" },
            background:
              "linear-gradient(160deg, rgba(255, 246, 220, 0.95), rgba(255, 249, 239, 1))",
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.18em" }}
                >
                  ADMIN CONSOLE
                </Typography>
                <Typography variant="h2" sx={{ mt: 1 }}>
                  free-b
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "22px 0 22px 22px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#F3C742",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image src="/bee.svg" alt="free-b bee logo" width={50} height={40} priority />
              </Box>
            </Stack>

            <Box sx={{ maxWidth: 560 }}>
              <Typography
                variant="h1"
                sx={{
                  mb: 2,
                  fontSize: { xs: "3rem", md: "4.2rem", xl: "5rem" },
                  lineHeight: { xs: 1.08, md: 1.04 },
                  letterSpacing: "-0.04em",
                }}
              >
                발표용 관리자
                <br />
                데모 진입
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
                디자인이 반영된 관리자 화면을 바로 확인할 수 있도록 데모 계정으로 빠르게
                진입합니다.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {highlights.map((item) => (
                <AtomBadge key={item} tone="draft" label={item} />
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              mt: 4,
              p: 3,
              borderRadius: "22px 0 22px 22px",
              background:
                "linear-gradient(140deg, rgba(37, 27, 16, 0.98), rgba(103, 72, 29, 0.94))",
              color: "#FFF9EF",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <AdminPanelSettingsRoundedIcon />
              <Typography variant="h6" sx={{ color: "inherit" }}>
                Demo Access Flow
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.88, maxWidth: 420 }}>
              계정 선택 후 로그인 토큰을 저장하고 `/dashboard`로 이동합니다. 백엔드 서버와
              seed 데이터가 실행 중이어야 합니다.
            </Typography>
          </Box>
        </SurfaceCard>

        <SurfaceCard
          sx={{
            p: { xs: 3, md: 4 },
            minHeight: { lg: "calc(100vh - 64px)" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ maxWidth: 480, mx: "auto", width: "100%" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "18px 0 18px 18px",
                display: "grid",
                placeItems: "center",
                color: "#251B10",
                backgroundColor: "#FFF0C2",
                mb: 2,
              }}
            >
              <LockOutlinedIcon />
            </Box>

            <Typography variant="h2" sx={{ mb: 1.5 }}>
              관리자 접속
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              발표용 데모 계정을 선택하면 바로 관리자 화면으로 진입합니다.
            </Typography>

            <Stack spacing={2}>
              {DEMO_ADMINS.map((admin) => {
                const isLoading = loadingEmail === admin.email;

                return (
                  <SurfaceCard
                    key={admin.email}
                    sx={{
                      p: 0,
                      overflow: "hidden",
                      borderRadius: "22px 0 22px 22px",
                    }}
                  >
                    <AtomButton
                      atomVariant="ghost"
                      fullWidth
                      onClick={() => {
                        void handleDemoLogin(admin.email);
                      }}
                      disabled={loadingEmail !== null}
                      sx={{
                        width: "100%",
                        minHeight: 120,
                        justifyContent: "space-between",
                        alignItems: "stretch",
                        px: 3,
                        py: 2.5,
                        borderRadius: "22px 0 22px 22px",
                        backgroundColor: "#FFFFFF",
                        color: "#251B10",
                        "&:hover": {
                          backgroundColor: "#FFF8E1",
                        },
                      }}
                    >
                      <Stack spacing={1} alignItems="flex-start" sx={{ textAlign: "left" }}>
                        <Typography variant="h6">{admin.name}</Typography>
                        <Typography variant="body1" color="text.secondary">
                          {admin.email}
                        </Typography>
                        <AtomBadge tone="requested" label={admin.description} />
                      </Stack>

                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "16px 0 16px 16px",
                          display: "grid",
                          placeItems: "center",
                          backgroundColor: "#FBF7ED",
                          color: "#B7791F",
                          flexShrink: 0,
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={20} sx={{ color: "#B7791F" }} />
                        ) : (
                          <ArrowOutwardRoundedIcon />
                        )}
                      </Box>
                    </AtomButton>
                  </SurfaceCard>
                );
              })}

              {errorMessage ? (
                <Alert severity="error" sx={{ borderRadius: "16px 0 16px 16px" }}>
                  {errorMessage}
                </Alert>
              ) : null}

              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                © 2026 free-b Corp. All rights reserved.
              </Typography>
            </Stack>
          </Box>
        </SurfaceCard>
      </Box>
    </Box>
  );
}
