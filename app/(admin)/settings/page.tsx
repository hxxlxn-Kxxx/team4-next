"use client";

import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Business, NotificationsActive, Person, Save, Tune, CloudUpload, Image as ImageIcon, Refresh } from "@mui/icons-material";

import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import { apiClient } from "@/src/lib/apiClient";

// ─────────────────────────────────────────────
// 알림 설정 타입 (백엔드 NotificationSettingsDto 기반)
// ─────────────────────────────────────────────
type NotificationSettings = {
  pushEnabled: boolean;
  updatedAt?: string;
};

// ─────────────────────────────────────────────
// 회사 정보 타입 (GET /companies/current 응답)
// ─────────────────────────────────────────────
type CompanyInfo = {
  companyId?: string;
  id?: string;
  name?: string;
  businessNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  [key: string]: any;
};

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function SettingsPage() {
  const [tabIndex, setTabIndex] = useState(0);

  // ── 알림 설정 상태
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({ pushEnabled: true });
  const [isNotifLoading, setIsNotifLoading] = useState(true);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // ── 회사 정보 상태
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // ── 회사 도장 상태
  const [sealMetadata, setSealMetadata] = useState<any>(null);
  const [isSealLoading, setIsSealLoading] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);
  const [isUploadingSeal, setIsUploadingSeal] = useState(false);
  const [sealVersion, setSealVersion] = useState(0); // 미리보기 캐시 방지용
  const [hasSealImageError, setHasSealImageError] = useState(false);
  const [sealImageUrl, setSealImageUrl] = useState<string | null>(null);

  // ── 알림 설정 로드
  useEffect(() => {
    const load = async () => {
      setIsNotifLoading(true);
      try {
        const data = await apiClient.getNotificationSettings();
        setNotifSettings(data?.data ?? data);
      } catch (err: any) {
        setNotifError(err.message || "알림 설정을 불러오지 못했습니다.");
      } finally {
        setIsNotifLoading(false);
      }
    };
    load();
  }, []);

  // ── 회사 정보 로드
  useEffect(() => {
    const load = async () => {
      setIsCompanyLoading(true);
      try {
        const data = await apiClient.getCurrentCompany();
        setCompany(data?.data ?? data);
      } catch (err: any) {
        setCompanyError(err.message || "회사 정보를 불러오지 못했습니다.");
      } finally {
        setIsCompanyLoading(false);
      }
    };
    load();
  }, []);

  // ── 회사 도장 정보 로드
  const loadSealMetadata = async () => {
    setIsSealLoading(true);
    setSealError(null);
    setHasSealImageError(false);
    try {
      const data = await apiClient.getCompanySealMetadata();
      setSealMetadata(data?.data ?? data);
    } catch (err: any) {
      // 도장이 없는 경우 404가 날 수 있으므로 에러 처리는 유연하게
      console.log("Seal metadata fetch error (likely no seal):", err);
      setSealMetadata(null);
    } finally {
      setIsSealLoading(false);
    }
  };

  useEffect(() => {
    loadSealMetadata();
  }, []);

  // ── 도장 이미지 Blob 로드 (인증 헤더 포함을 위해 fetch 사용)
  useEffect(() => {
    let objectUrl: string | null = null;
    
    const loadFile = async () => {
      if (!sealMetadata) {
        setSealImageUrl(null);
        return;
      }
      try {
        const blob = await apiClient.getCompanySealFile();
        objectUrl = URL.createObjectURL(blob);
        setSealImageUrl(objectUrl);
        setHasSealImageError(false);
      } catch (err) {
        console.error("Failed to load seal image blob:", err);
        setHasSealImageError(true);
      }
    };

    loadFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sealMetadata, sealVersion]);

  // ── 도장 업로드 핸들러
  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 형식 체크 (PNG)
    if (file.type !== "image/png") {
      alert("PNG 파일만 업로드 가능합니다.");
      return;
    }

    // 2. 용량 체크 (1MB)
    if (file.size > 1024 * 1024) {
      alert("파일 용량은 1MB 이하여야 합니다.");
      return;
    }

    setIsUploadingSeal(true);
    setSealError(null);
    setHasSealImageError(false);
    try {
      await apiClient.updateCompanySeal(file);
      await loadSealMetadata();
      setSealVersion((v) => v + 1); // 이미지 캐시 갱신
      alert("회사 도장이 성공적으로 업로드되었습니다.");
    } catch (err: any) {
      setSealError(err.message || "도장 업로드에 실패했습니다.");
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setIsUploadingSeal(false);
      // input 초기화
      e.target.value = "";
    }
  };

  // ── 알림 저장
  const handleSaveNotif = async () => {
    setIsSavingNotif(true);
    setNotifError(null);
    setNotifSuccess(false);
    try {
      await apiClient.updateNotificationSettings({ pushEnabled: notifSettings.pushEnabled });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err: any) {
      setNotifError(err.message || "알림 설정 저장에 실패했습니다.");
    } finally {
      setIsSavingNotif(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 960 }}>
      <PageHeader title="설정" />

      <SurfaceCard sx={{ overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", backgroundColor: "#FBF7ED" }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth">
            <Tab icon={<Tune />} iconPosition="start" label="운영 기본 설정" sx={{ py: 2 }} />
            <Tab icon={<NotificationsActive />} iconPosition="start" label="알림 설정" sx={{ py: 2 }} />
            <Tab icon={<Business />} iconPosition="start" label="회사 정보" sx={{ py: 2 }} />
            <Tab icon={<Person />} iconPosition="start" label="내 계정 관리" sx={{ py: 2 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* ── Tab 0: 운영 기본 설정 (백엔드 미지원 → UI 유지, placeholder 명시) */}
          {tabIndex === 0 && (
            <Stack spacing={4}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                아래 항목은 현재 백엔드 저장이 지원되지 않는 참고용 설정입니다. 추후 API 연동 예정입니다.
              </Alert>
              <Box>
                <Box sx={{ fontWeight: 700, mb: 1 }}>강사 정산 및 계약 기준</Box>
                <Box sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.6, mb: 2 }}>
                  신규 강사 등록 시 기본으로 세팅되는 금액과 기준을 설정합니다.
                </Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <AtomInput
                    label="초기 기본 시급"
                    defaultValue="30,000"
                    InputProps={{ endAdornment: <InputAdornment position="end">원</InputAdornment> }}
                    fullWidth
                    disabled
                  />
                  <AtomInput
                    label="계약 만료 알림 기준"
                    defaultValue="30"
                    InputProps={{ endAdornment: <InputAdornment position="end">일 전</InputAdornment> }}
                    fullWidth
                    disabled
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ fontWeight: 700, mb: 2 }}>수업 및 체크인 기준</Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <AtomInput
                    label="도착 체크인 허용 반경"
                    defaultValue="50"
                    InputProps={{ endAdornment: <InputAdornment position="end">m (미터)</InputAdornment> }}
                    fullWidth
                    disabled
                  />
                  <AtomInput label="지각 처리 기준" defaultValue="수업 시작 10분 전" fullWidth disabled />
                </Stack>
              </Box>
            </Stack>
          )}

          {/* ── Tab 1: 알림 설정 (GET/PUT /me/notification-settings) */}
          {tabIndex === 1 && (
            <Stack spacing={3}>
              <Box sx={{ fontWeight: 700 }}>시스템 알림 (Push / Dashboard)</Box>

              {notifError && <Alert severity="error" sx={{ borderRadius: 2 }}>{notifError}</Alert>}
              {notifSuccess && <Alert severity="success" sx={{ borderRadius: 2 }}>알림 설정이 저장되었습니다.</Alert>}

              {isNotifLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <>
                  {/* 백엔드가 pushEnabled 단일 필드만 지원: 통합 ON/OFF 토글 */}
                  <SurfaceCard sx={{ p: 3, boxShadow: "none" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Box sx={{ fontWeight: 600 }}>푸시 알림 전체</Box>
                        <Box sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
                          모든 시스템 알림(체크인 지각, 계약 만료, 대강 요청, 오류 알림 등)을 한 번에 켜거나 끕니다.
                        </Box>
                        {notifSettings.updatedAt && (
                          <Box sx={{ fontSize: 12, color: "text.disabled", mt: 0.75 }}>
                            마지막 저장: {new Date(notifSettings.updatedAt).toLocaleString("ko-KR")}
                          </Box>
                        )}
                      </Box>
                      <Switch
                        checked={notifSettings.pushEnabled}
                        onChange={(e) => setNotifSettings((prev) => ({ ...prev, pushEnabled: e.target.checked }))}
                        color="primary"
                      />
                    </Stack>
                  </SurfaceCard>

                  {/* 세부 항목: 백엔드 미지원으로 UI 참고 표시만 */}
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    아래 세부 알림 항목은 현재 백엔드에서 개별 저장을 지원하지 않습니다. 위 토글로 전체를 제어합니다.
                  </Alert>

                  {[
                    { title: "강사 현장 체크인 지각 알림", description: "수업 시작 전까지 체크인하지 않은 경우 경고를 띄웁니다." },
                    { title: "전자계약 만료 임박 알림", description: "강사의 계약 종료일이 다가오면 대시보드에 표시합니다." },
                    { title: "강사의 대강(대체강사) 요청 알림", description: "강사가 앱에서 긴급 대강을 요청했을 때 알림을 받습니다." },
                    { title: "시스템 오류 보고 알림", description: "백엔드 장애 또는 서명 오류가 발생했을 때 관리자에게 전달합니다." },
                  ].map((item) => (
                    <SurfaceCard key={item.title} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "none", opacity: 0.55 }}>
                      <Box>
                        <Box sx={{ fontWeight: 600 }}>{item.title}</Box>
                        <Box sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>{item.description}</Box>
                      </Box>
                      <Switch checked={notifSettings.pushEnabled} disabled color="primary" />
                    </SurfaceCard>
                  ))}

                  {/* 저장 버튼 */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                    <AtomButton startIcon={<Save />} onClick={handleSaveNotif} disabled={isSavingNotif}>
                      {isSavingNotif ? "저장 중..." : "알림 설정 저장"}
                    </AtomButton>
                  </Box>
                </>
              )}
            </Stack>
          )}

          {/* ── Tab 2: 회사 정보 (GET /companies/current) */}
          {tabIndex === 2 && (
            <Stack spacing={4}>
              <Box sx={{ fontWeight: 700 }}>회사 정보</Box>

              {companyError && <Alert severity="error" sx={{ borderRadius: 2 }}>{companyError}</Alert>}

              {isCompanyLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : !company ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>회사 정보를 불러오지 못했습니다.</Alert>
              ) : (
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    <AtomInput
                      label="회사명"
                      value={company.name ?? ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                    <AtomInput
                      label="사업자 번호"
                      value={company.businessNumber ?? "-"}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    <AtomInput
                      label="대표 연락처"
                      value={company.contactPhone ?? "-"}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                    <AtomInput
                      label="대표 이메일"
                      value={company.contactEmail ?? "-"}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Stack>
                  {company.address && (
                    <AtomInput label="주소" value={company.address} fullWidth InputProps={{ readOnly: true }} />
                  )}
                  <Typography variant="caption" color="text.disabled">
                    회사 정보 수정은 관리자 문의를 통해 진행해주세요.
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  {/* 도장 관리 섹션 */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Box sx={{ fontWeight: 700 }}>회사 대표 도장 관리</Box>
                        <Box sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                          전자계약 체결 시 사용되는 회사의 공식 인감 이미지입니다.
                        </Box>
                      </Box>
                      <AtomButton
                        size="small"
                        atomVariant="outline"
                        startIcon={<Refresh />}
                        onClick={loadSealMetadata}
                        disabled={isSealLoading}
                      >
                        새로고침
                      </AtomButton>
                    </Stack>

                    <SurfaceCard sx={{ p: 3, border: "1px dashed #EFD9A2", backgroundColor: "rgba(239, 217, 162, 0.05)", boxShadow: "none" }}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="center">
                        {/* 미리보기 영역 */}
                        <Box
                          sx={{
                            width: 140,
                            height: 140,
                            border: "1px solid #EBDDC3",
                            borderRadius: "12px",
                            backgroundColor: "#FFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            position: "relative",
                            flexShrink: 0,
                            backgroundImage: "radial-gradient(#EEE 10%, transparent 10%), radial-gradient(#EEE 10%, transparent 10%)",
                            backgroundPosition: "0 0, 8px 8px",
                            backgroundSize: "16px 16px"
                          }}
                        >
                          {isSealLoading ? (
                            <CircularProgress size={24} />
                          ) : (sealMetadata && sealImageUrl && !hasSealImageError) ? (
                            <Box
                              component="img"
                              src={sealImageUrl}
                              alt="Company Seal"
                              sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain"
                              }}
                              onError={() => setHasSealImageError(true)}
                            />
                          ) : (
                            <Stack alignItems="center" spacing={1} color="text.disabled">
                              <ImageIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                              <Typography variant="caption">{sealMetadata ? "이미지 오류" : "미등록"}</Typography>
                            </Stack>
                          )}
                        </Box>

                        {/* 업로드 컨트롤 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                            {sealMetadata ? "도장 교체하기" : "도장 등록하기"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: "keep-all" }}>
                            • <strong>PNG 형식</strong>의 이미지 파일만 허용됩니다.<br />
                            • 서명 시 깔끔한 노출을 위해 <strong>투명 배경</strong> 처리를 권장합니다.<br />
                            • 파일 용량 제한: <strong>최대 1MB</strong>
                          </Typography>
                          
                          <input
                            type="file"
                            accept="image/png"
                            id="seal-upload-input"
                            style={{ display: "none" }}
                            onChange={handleSealUpload}
                            disabled={isUploadingSeal}
                          />
                          <label htmlFor="seal-upload-input">
                            <AtomButton
                              component="span"
                              startIcon={<CloudUpload />}
                              loading={isUploadingSeal}
                              disabled={isUploadingSeal}
                            >
                              {isUploadingSeal ? "업로드 중..." : sealMetadata ? "새 도장 업로드" : "도장 업로드"}
                            </AtomButton>
                          </label>
                        </Box>
                      </Stack>
                    </SurfaceCard>
                  </Box>
                </Stack>
              )}
            </Stack>
          )}

          {/* ── Tab 3: 내 계정 관리 (백엔드 미구현 영역 명시) */}
          {tabIndex === 3 && (
            <Stack spacing={4}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                현재 프로필 수정 / 비밀번호 변경 API는 준비 중입니다. 계정 변경은 관리자 문의를 이용해주세요.
              </Alert>
              <Box>
                <Box sx={{ fontWeight: 700, mb: 1 }}>관리자 프로필</Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2 }}>
                  <AtomInput label="이름" placeholder="관리자 이름" fullWidth disabled />
                  <AtomInput label="이메일 주소" placeholder="admin@example.com" fullWidth disabled />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ fontWeight: 700, mb: 2 }}>보안 설정</Box>
                <Stack spacing={2} sx={{ maxWidth: 480 }}>
                  <AtomInput label="현재 비밀번호" type="password" size="small" fullWidth disabled />
                  <AtomInput label="새 비밀번호" type="password" size="small" fullWidth disabled />
                  <AtomInput label="새 비밀번호 확인" type="password" size="small" fullWidth disabled />
                  <FormControlLabel control={<Switch disabled />} label="2단계 인증 활성화 (준비 중)" />
                  <AtomButton atomVariant="outline" sx={{ alignSelf: "flex-start" }} disabled>
                    비밀번호 변경 (준비 중)
                  </AtomButton>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </SurfaceCard>
    </Box>
  );
}
