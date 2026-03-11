"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add,
  CheckCircle,
  HistoryEdu,
  PictureAsPdf,
  RadioButtonUnchecked,
  Search,
  Send,
  VerifiedUser,
} from "@mui/icons-material";

import PageHeader from "@/src/components/admin/PageHeader";
import FilterBar from "@/src/components/admin/FilterBar";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import { apiClient } from "@/src/lib/apiClient";
import {
  ContractStatus,
  CONTRACT_STATUS_MAP,
  getContractStatusColor,
  LESSON_SOURCE_TYPE_MAP,
} from "@/src/types/backend";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type ContractRow = {
  id: string;
  contractId?: string;
  contractNumber?: string;
  title?: string;
  instructorName?: string;
  instructor?: { name?: string };
  lessonTitle?: string;
  lesson?: { title?: string; lectureTitle?: string; sourceType?: string };
  effectiveFrom?: string;
  effectiveTo?: string;
  status: ContractStatus;
  createdAt?: string;
  latestVersion?: {
    documentHashSha256?: string;
    [key: string]: any;
  };
  signatures?: Array<{
    signerRole?: "INSTRUCTOR" | "ADMIN" | string;
    signedAt?: string;
    signerIp?: string;
    [key: string]: any;
  }>;
};

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "전체", value: "" },
  { label: "초안", value: "DRAFT" },
  { label: "발송", value: "SENT" },
  { label: "강사 서명 완료", value: "INSTRUCTOR_SIGNED" },
  { label: "최종 서명 완료", value: "FULLY_SIGNED" },
  { label: "무효", value: "VOID" },
];

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function resolveInstructorName(row: ContractRow): string {
  return row.instructorName || row.instructor?.name || "-";
}

function resolveLessonTitle(row: ContractRow): React.ReactNode {
  const title = row.lessonTitle || row.lesson?.title || row.lesson?.lectureTitle || "-";
  if (row.lesson?.sourceType === "EXTERNAL_DOCUMENT") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
        {title}
        <Chip
          label={LESSON_SOURCE_TYPE_MAP.EXTERNAL_DOCUMENT?.label || "외부 계약서"}
          size="small"
          sx={{
            fontSize: "0.65rem",
            bgcolor: "#FFF3E0",
            color: "#E65100",
            fontWeight: 700,
            border: "1px solid #FFB74D",
            height: 20,
          }}
        />
      </Box>
    );
  }
  return title;
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getContractCanonicalId(row: ContractRow): string | null {
  return row.contractId ?? row.id ?? null;
}

// ─────────────────────────────────────────────
// 메인 컴포넌트 내부 로직 (Suspense용)
// ─────────────────────────────────────────────
function ContractsContent() {
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId");

  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── 새 계약 생성 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLessonId, setCreateLessonId] = useState("");

  // 재인증 토큰 및 동의 상태 (sign 직전 reauth 결과 보관)
  const [signToken, setSignToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // ── 목록 API 조회 (React Query)
  const queryParams: Record<string, string> = {};
  if (filterStatus) queryParams.status = filterStatus;
  if (filterName) queryParams.instructorName = filterName;
  if (lessonIdParam) queryParams.lessonId = lessonIdParam;

  const { data: contractsData, isLoading, error } = useQuery({
    queryKey: queryKeys.contracts.list({ ...queryParams }),
    queryFn: async () => {
      const qs = new URLSearchParams(queryParams).toString();
      const data = await apiClient.getContracts(qs);
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.contracts)
        ? data.contracts
        : Array.isArray(data?.data)
        ? data.data
        : [];
    },
  });

  const contracts: ContractRow[] = contractsData || [];
  const listError = error instanceof Error ? error.message : "계약 목록을 불러오지 못했습니다.";

  // 드로어 전용 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // lessonIdParam이 있고 데이터 로드가 완료되면 해당 계약 상세를 자동으로 연다.
  useEffect(() => {
    if (lessonIdParam && contracts.length > 0 && !selectedId) {
      // lessonId가 명시적으로 달려있으면 해당 계약을 찾아서 연다.
      const match = contracts.find(c => 
        c.id === lessonIdParam || 
        c.contractId === lessonIdParam || 
        (c.lesson as any)?.id === lessonIdParam || 
        (c as any).lessonId === lessonIdParam
      );
      const canonicalId = match ? getContractCanonicalId(match) : null;
      if (canonicalId) {
        setSelectedId(canonicalId);
      }
    }
  }, [lessonIdParam, contracts, selectedId]);

  // ── 상세 API 조회 (React Query)
  const { data: drawerContractData, isLoading: isDrawerLoading } = useQuery({
    queryKey: queryKeys.contracts.detail(selectedId as string),
    queryFn: async () => {
      const data = await apiClient.getContractById(selectedId as string);
      return data?.data ?? data;
    },
    enabled: !!selectedId,
  });

  const drawerContract: ContractRow | null = drawerContractData || null;

  useEffect(() => {
    if (!selectedId) {
      setSignToken(null);
      setExpiresAt(null);
      setConsentGiven(false);
    }
  }, [selectedId]);

  // ── 클라이언트 측 이름 필터
  const filtered = contracts.filter((row) => {
    const nameMatch = !filterName || resolveInstructorName(row).includes(filterName);
    const statusMatch = !filterStatus || row.status === filterStatus;
    return nameMatch && statusMatch;
  });

  // ── 서명 현황 추출
  const instructorSig = drawerContract?.signatures?.find((s) => s.signerRole === "INSTRUCTOR");
  const adminSig = drawerContract?.signatures?.find((s) => s.signerRole === "ADMIN");

  const contractId = drawerContract?.contractId ?? drawerContract?.id ?? "";

  const queryClient = useQueryClient();

  // ── 새 계약 생성 핸들러 (useMutation)
  const createMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await apiClient.createContract({ lessonId });
    },
    onSuccess: () => {
      alert("계약이 생성되었습니다. (DRAFT 상태)");
      setIsCreateOpen(false);
      setCreateLessonId("");
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "계약 생성에 실패했습니다.");
    },
  });

  const handleCreateContract = () => {
    if (!createLessonId.trim()) return alert("수업 ID를 입력해주세요.");
    createMutation.mutate(createLessonId.trim());
  };

  // ── 발송 핸들러 (useMutation)
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("계약 ID가 없습니다.");
      return apiClient.sendContract(contractId);
    },
    onSuccess: () => {
      alert("계약서가 발송되었습니다.");
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(selectedId as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "발송에 실패했습니다.");
    },
  });

  const handleSend = () => {
    if (!contractId) return;
    if (!window.confirm("강사에게 계약서를 발송하시겠습니까?")) return;
    sendMutation.mutate();
  };

  // ── 재인증 후 관리자 서명 핸들러
  const reauthMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("계약 ID가 없습니다.");
      return apiClient.reauthContract(contractId);
    },
    onSuccess: (res) => {
      const token = res?.signToken || res?.reauthToken || res?.token || (typeof res === "string" ? res : null);
      if (!token) throw new Error("재인증 토큰을 받지 못했습니다.");
      setSignToken(token);
      setExpiresAt(res?.expiresAt || null);
      alert("재인증 완료. 내용을 확인하고 아래 동의 체크 후 '최종 서명하기'를 눌러주세요.");
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "재인증에 실패했습니다.");
    },
  });

  const signMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      if (!contractId) throw new Error("계약 ID가 없습니다.");
      return apiClient.signContract(contractId, {
        signToken: token,
        consentGiven: true,
        consentTextVersion: "v1.0",
      });
    },
    onSuccess: () => {
      alert("관리자 서명이 완료되었습니다!");
      setSignToken(null);
      setExpiresAt(null);
      setConsentGiven(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(selectedId as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "서명에 실패했습니다.");
    },
  });

  const handleReauthAndSign = () => {
    if (!contractId) return;
    
    // Step 1: 재인증 토큰 발급 (signToken)
    if (!signToken) {
      reauthMutation.mutate();
      return;
    }

    // Step 2: 서명 동의 여부 체크
    if (!consentGiven) {
      return alert("서명 동의에 체크해주세요.");
    }

    // Step 3: 최종 서명 시연
    signMutation.mutate({ token: signToken });
  };

  return (
    <Box>
      <PageHeader
        title="계약 관리"
        description="계약 생성, 발송, 서명 진행 상태를 한 흐름으로 확인합니다."
        action={
          <AtomButton startIcon={<Add />} onClick={() => setIsCreateOpen(true)}>
            새 계약 생성
          </AtomButton>
        }
      />

      {/* ── 새 계약 생성 다이얼로그 */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">새 계약 생성</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            수업 ID를 입력하면 해당 수업에 대한 초안(DRAFT) 계약서가 생성됩니다.
          </Typography>
          <AtomInput
            label="수업 ID (lessonId)"
            value={createLessonId}
            onChange={(e) => setCreateLessonId(e.target.value)}
            placeholder="예: L_001"
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <AtomButton atomVariant="ghost" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>취소</AtomButton>
          <AtomButton onClick={handleCreateContract} disabled={createMutation.isPending || !createLessonId.trim()}>
            {createMutation.isPending ? "생성 중..." : "생성하기"}
          </AtomButton>
        </DialogActions>
      </Dialog>

      {/* ── 필터바 */}
      <FilterBar>
        <AtomInput
          label="강사명"
          placeholder="이름 입력"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <AtomInput
          select
          label="계약 상태"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </AtomInput>
      </FilterBar>

      {/* ── 목록 테이블 */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "16px 0 16px 16px" }}>
          {listError}
        </Alert>
      ) : (
        <TableContainer component={SurfaceCard}>
          <Table>
            <TableHead sx={{ bgcolor: "#FBF7ED" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700 }}>계약 번호</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>강사명</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>수업명</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>상태</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>생성일</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    조회된 계약이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const cId = getContractCanonicalId(row) ?? `contract-row-${row.contractNumber ?? row.createdAt ?? "unknown"}`;
                  const rowStatus = row.status as ContractStatus;
                  return (
                    <TableRow key={cId} hover>
                      <TableCell align="center" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                        {row.contractNumber ?? cId}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {resolveInstructorName(row)}
                      </TableCell>
                      <TableCell align="center">{resolveLessonTitle(row)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={CONTRACT_STATUS_MAP[rowStatus] ?? rowStatus}
                          color={getContractStatusColor(rowStatus)}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="center">{formatDate(row.createdAt)}</TableCell>
                      <TableCell align="center">
                        <AtomButton
                          atomVariant="outline"
                          size="small"
                          onClick={() => setSelectedId(cId)}
                        >
                          보기
                        </AtomButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── 상세 드로어 */}
      <Drawer anchor="right" open={Boolean(selectedId)} onClose={() => setSelectedId(null)}>
        <Box sx={{ width: 480, p: 4, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#FFF9EF" }}>
          {isDrawerLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
              <CircularProgress />
            </Box>
          ) : !drawerContract ? (
            <Typography color="error" sx={{ mt: 4 }}>계약 정보를 불러올 수 없습니다.</Typography>
          ) : (
            <>
              {/* 헤더 */}
              {drawerContract.title && (
                <Typography variant="h4" sx={{ mb: 0.5 }}>{drawerContract.title}</Typography>
              )}
              {!drawerContract.title && (
                <Typography variant="h4" sx={{ mb: 0.5 }}>계약 상세 정보</Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                계약 번호: {drawerContract.contractNumber ?? drawerContract.contractId ?? drawerContract.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                강사: {resolveInstructorName(drawerContract)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                수업: {resolveLessonTitle(drawerContract)}
              </Typography>
              {drawerContract.effectiveFrom && drawerContract.effectiveTo && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  기간: {formatDate(drawerContract.effectiveFrom)} ~ {formatDate(drawerContract.effectiveTo)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                생성일: {formatDate(drawerContract.createdAt)}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 상태 카드 */}
              <SurfaceCard sx={{ p: 3, mb: 3, backgroundColor: "#FFFCF5", boxShadow: "none" }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                  <VerifiedUser
                    sx={{ color: drawerContract.status === "FULLY_SIGNED" ? "#2F6B2F" : "#B7791F" }}
                  />
                  <Chip
                    label={CONTRACT_STATUS_MAP[drawerContract.status] ?? drawerContract.status}
                    color={getContractStatusColor(drawerContract.status)}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>

                {/* 서명 현황 */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>서명 현황</Typography>
                <Stack spacing={1}>
                  {/* 강사 서명 */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    {instructorSig ? (
                      <CheckCircle sx={{ color: "#2F6B2F", fontSize: 20 }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ color: "#9E9E9E", fontSize: 20 }} />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        강사 서명 {instructorSig ? "완료" : "미완료"}
                      </Typography>
                      {instructorSig && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(instructorSig.signedAt)}
                          {instructorSig.signerIp ? ` · IP: ${instructorSig.signerIp}` : ""}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* 관리자 서명 */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    {adminSig ? (
                      <CheckCircle sx={{ color: "#2F6B2F", fontSize: 20 }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ color: "#9E9E9E", fontSize: 20 }} />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        관리자 서명 {adminSig ? "완료" : "미완료"}
                      </Typography>
                      {adminSig && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(adminSig.signedAt)}
                          {adminSig.signerIp ? ` · IP: ${adminSig.signerIp}` : ""}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Stack>

                {/* 문서 해시 */}
                {drawerContract.latestVersion?.documentHashSha256 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #EBDDC3" }}>
                    <Typography variant="caption" color="text.secondary">문서 해시 (SHA-256)</Typography>
                    <Typography variant="caption" sx={{ display: "block", fontFamily: "monospace", wordBreak: "break-all", color: "text.secondary", mt: 0.5 }}>
                      {drawerContract.latestVersion.documentHashSha256}
                    </Typography>
                  </Box>
                )}
              </SurfaceCard>

              {/* 진행 로그 */}
              <SurfaceCard sx={{ p: 3, mb: 3 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary">진행 로그</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <HistoryEdu sx={{ color: "#B7791F" }} />
                    <Typography variant="body2">
                      {drawerContract.status === "FULLY_SIGNED"
                        ? "강사·관리자 서명 완료 – 계약이 체결되었습니다."
                        : drawerContract.status === "INSTRUCTOR_SIGNED"
                        ? "강사 서명 완료 – 관리자 최종 서명 대기 중입니다."
                        : drawerContract.status === "SENT"
                        ? "계약서 발송 완료 – 강사의 열람·서명을 기다리는 중입니다."
                        : drawerContract.status === "DRAFT"
                        ? "초안 상태입니다 – 발송 전 검토가 필요합니다."
                        : "계약이 무효 처리되었습니다."}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PictureAsPdf sx={{ color: "#7A6A58" }} />
                    <Typography variant="body2">원본 PDF와 전자서명 이력 보관</Typography>
                  </Stack>
                </Stack>
              </SurfaceCard>

              {/* PDF 열람 버튼 */}
              <AtomButton
                atomVariant="outline"
                size="large"
                startIcon={<PictureAsPdf />}
                sx={{ width: "100%", mb: "auto", borderStyle: "dashed", borderWidth: 2 }}
              >
                계약서 원본 PDF 열람
              </AtomButton>

              {/* 액션 버튼 영역 */}
              <Box sx={{ pt: 3, borderTop: "1px solid #EBDDC3" }}>
                {/* DRAFT → 발송 */}
                {drawerContract.status === "DRAFT" && (
                  <AtomButton
                    startIcon={<Send />}
                    sx={{ width: "100%", mb: 1.25 }}
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                  >
                    {sendMutation.isPending ? "발송 중..." : "계약서 발송하기"}
                  </AtomButton>
                )}

                {/* SENT → 재발송 (재인증 없이 다시 발송) */}
                {drawerContract.status === "SENT" && (
                  <AtomButton
                    atomVariant="outline"
                    startIcon={<Send />}
                    sx={{ width: "100%", mb: 1.25 }}
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                  >
                    {sendMutation.isPending ? "재발송 중..." : "재발송 (서명 요청)"}
                  </AtomButton>
                )}

                {/* INSTRUCTOR_SIGNED → 관리자 재인증 & 서명 */}
                {drawerContract.status === "INSTRUCTOR_SIGNED" && !adminSig && (
                  <Box sx={{ mt: 1 }}>
                    {signToken && (
                      <Box sx={{ p: 2, mb: 2, bgcolor: "#FBF7ED", borderRadius: 2, border: "1px solid #EBDDC3" }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                          최종 서명 동의 사항 (v1.0)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, wordBreak: "keep-all" }}>
                          본 계약의 내용(수업 정보, 강사 정보, 서명 일자 등)을 모두 확인하였으며, 회사 측 관리자로서 최종 서명하는 데 동의합니다.
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={consentGiven}
                              onChange={(e) => setConsentGiven(e.target.checked)}
                              size="small"
                              sx={{ py: 0 }}
                            />
                          }
                          label={<Typography variant="body2" fontWeight={600}>위 내용에 동의하며 서명합니다.</Typography>}
                          sx={{ m: 0 }}
                        />
                      </Box>
                    )}
                    <AtomButton
                      sx={{ width: "100%", mb: 1.25 }}
                      onClick={handleReauthAndSign}
                      disabled={reauthMutation.isPending || signMutation.isPending || (signToken !== null && !consentGiven)}
                    >
                      {reauthMutation.isPending
                        ? "재인증 중..."
                        : signMutation.isPending
                        ? "서명 처리 중..."
                        : signToken
                        ? "관리자 최종 서명하기"
                        : "관리자 인증 후 서명 단계 진입"}
                    </AtomButton>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}>
      <ContractsContent />
    </Suspense>
  );
}
