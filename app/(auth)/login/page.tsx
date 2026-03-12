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
import { apiClient } from "@/src/lib/apiClient";

import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomBadge from "@/src/components/atoms/AtomBadge";
import AtomButton from "@/src/components/atoms/AtomButton";

const DEMO_ADMINS = [
  {
    name: "김도윤 관리자",
    email: "admin1@museum-demo.kr",
    description: "전체 시스템 관리자",
  },
  {
    name: "박서연 관리자",
    email: "admin2@museum-demo.kr",
    description: "운영현황 및 정산관리",
  },
];

const highlights = [
  "실시간 운영 현황",
  "스마트 배정 및 계약",
  "효율적인 정산 프로세스",
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
      
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=3600;`;

      router.push("/dashboard");
    } catch (error: any) {
      console.error("login error:", error);
      setErrorMessage(
        error.message || "서버와 연결할 수 없습니다. 관리자에게 문의해주세요.",
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
          "radial-gradient(circle at top left, rgba(243, 199, 66, 0.15), transparent 35%), linear-gradient(180deg, #FFF9EF 0%, #F7F1E4 100%)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <SurfaceCard
          sx={{
            p: { xs: 3, md: 6 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: { lg: "calc(100vh - 64px)" },
            background:
              "linear-gradient(160deg, rgba(255, 246, 220, 0.95), rgba(255, 249, 239, 1))",
          }}
        >
          <Stack spacing={4}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.2em", fontWeight: 700 }}
                >
                  ADMIN PORTAL
                </Typography>
                
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1.5 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "20px 0 20px 20px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#f6e8a4ff",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Image src="/bee.svg" alt="free-b bee logo" width={44} height={36} priority />
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#251B10', lineHeight: 1 }}>
                    free-b
                  </Typography>
                </Stack>
              </Box>
             
            </Stack>

            <Box>
              <Typography
                variant="h1"
                sx={{
                  mb: 3,
                  fontSize: { xs: "2.8rem", md: "3.8rem", xl: "4.5rem" },
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  fontWeight: 900,
                  color: "#251B10",
                }}
              >
                Smart Service
                <br />
                Management
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 480, fontWeight: 500, lineHeight: 1.6, opacity: 0.8 }}>
                관리자 전용 대시보드입니다. <br />
                허가된 계정으로 로그인하여 서비스를 관리해 주세요.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
              {highlights.map((item) => (
                <AtomBadge key={item} tone="draft" label={item} />
              ))}
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
            Authorized access only. Unauthorized attempts are strictly prohibited.
          </Typography>
        </SurfaceCard>

        <SurfaceCard
          sx={{
            p: { xs: 3, md: 5 },
            minHeight: { lg: "calc(100vh - 64px)" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ maxWidth: 440, mx: "auto", width: "100%" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "18px 0 18px 18px",
                display: "grid",
                placeItems: "center",
                color: "#251B10",
                backgroundColor: "#FFF0C2",
                mb: 3,
              }}
            >
              <LockOutlinedIcon />
            </Box>

            <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 800 }}>
              관리자 로그인
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontWeight: 500 }}>
              접속할 계정을 선택하여 관리 포털에 진입합니다.
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