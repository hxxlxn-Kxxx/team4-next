"use client";

import { useState, useEffect, useCallback } from "react";
import {
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

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 드로어 전용 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerContract, setDrawerContract] = useState<ContractRow | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // 필터 상태
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── 새 계약 생성 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLessonId, setCreateLessonId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // ── 드로어 액션 로딩 상태
  const [isSending, setIsSending] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // 재인증 토큰 (sign 직전 reauth 결과 보관)
  const [reauthToken, setReauthToken] = useState<string | null>(null);

  // ── 목록 API 조회
  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterName) params.set("instructorName", filterName);
      const qs = params.toString();

      const data = await apiClient.getContracts(qs);
      const list: ContractRow[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.contracts)
        ? data.contracts
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setContracts(list);
    } catch (err) {
      console.error("계약 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterName]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // ── 상세 API 조회 (드로어 열릴 때)
  useEffect(() => {
    if (!selectedId) {
      setDrawerContract(null);
      setReauthToken(null);
      return;
    }
    const fetchDetail = async () => {
      setIsDrawerLoading(true);
      try {
        const data = await apiClient.getContractById(selectedId);
        setDrawerContract(data?.data ?? data);
      } catch (err) {
        console.error("계약 상세 조회 실패:", err);
        setDrawerContract(null);
      } finally {
        setIsDrawerLoading(false);
      }
    };
    fetchDetail();
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

  // ── 새 계약 생성 핸들러
  const handleCreateContract = async () => {
    if (!createLessonId.trim()) return alert("수업 ID를 입력해주세요.");
    setIsCreating(true);
    try {
      await apiClient.createContract({ lessonId: createLessonId.trim() });
      alert("계약이 생성되었습니다. (DRAFT 상태)");
      setIsCreateOpen(false);
      setCreateLessonId("");
      fetchContracts();
    } catch (err: any) {
      alert(err.message || "계약 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  // ── 발송 핸들러
  const handleSend = async () => {
    if (!contractId) return;
    if (!window.confirm("강사에게 계약서를 발송하시겠습니까?")) return;
    setIsSending(true);
    try {
      const updated = await apiClient.sendContract(contractId);
      alert("계약서가 발송되었습니다.");
      setDrawerContract((prev) => (prev ? { ...prev, ...(updated?.data ?? updated) } : prev));
      fetchContracts();
    } catch (err: any) {
      alert(err.message || "발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  // ── 재인증 후 관리자 서명 핸들러
  const handleReauthAndSign = async () => {
    if (!contractId) return;
    // Step 1: 재인증 토큰 발급
    if (!reauthToken) {
      setIsReauthing(true);
      try {
        const res = await apiClient.reauthContract(contractId);
        const token = res?.reauthToken ?? res?.token ?? res;
        if (!token || typeof token !== "string") {
          throw new Error("재인증 토큰을 받지 못했습니다.");
        }
        setReauthToken(token);
        alert("재인증 완료. 아래 '서명하기' 버튼을 눌러 관리자 서명을 완료하세요.");
      } catch (err: any) {
        alert(err.message || "재인증에 실패했습니다.");
      } finally {
        setIsReauthing(false);
      }
      return;
    }

    // Step 2: 서명
    setIsSigning(true);
    try {
      const updated = await apiClient.signContract(contractId, { reauthToken });
      alert("관리자 서명이 완료되었습니다!");
      setDrawerContract((prev) => (prev ? { ...prev, ...(updated?.data ?? updated) } : prev));
      setReauthToken(null);
      fetchContracts();
    } catch (err: any) {
      alert(err.message || "서명에 실패했습니다.");
    } finally {
      setIsSigning(false);
    }
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
          <AtomButton atomVariant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>취소</AtomButton>
          <AtomButton onClick={handleCreateContract} disabled={isCreating || !createLessonId.trim()}>
            {isCreating ? "생성 중..." : "생성하기"}
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
        <AtomButton startIcon={<Search />} onClick={fetchContracts}>
          검색
        </AtomButton>
      </FilterBar>

      {/* ── 목록 테이블 */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
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
                  const cId = row.contractId ?? row.id;
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
                    disabled={isSending}
                  >
                    {isSending ? "발송 중..." : "계약서 발송하기"}
                  </AtomButton>
                )}

                {/* SENT → 재발송 (재인증 없이 다시 발송) */}
                {drawerContract.status === "SENT" && (
                  <AtomButton
                    atomVariant="outline"
                    startIcon={<Send />}
                    sx={{ width: "100%", mb: 1.25 }}
                    onClick={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? "재발송 중..." : "재발송 (서명 요청)"}
                  </AtomButton>
                )}

                {/* INSTRUCTOR_SIGNED → 관리자 재인증 & 서명 */}
                {drawerContract.status === "INSTRUCTOR_SIGNED" && !adminSig && (
                  <AtomButton
                    sx={{ width: "100%", mb: 1.25 }}
                    onClick={handleReauthAndSign}
                    disabled={isReauthing || isSigning}
                  >
                    {isReauthing
                      ? "재인증 중..."
                      : isSigning
                      ? "서명 처리 중..."
                      : reauthToken
                      ? "관리자 서명하기 (재인증 완료)"
                      : "재인증 후 서명하기"}
                  </AtomButton>
                )}
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
