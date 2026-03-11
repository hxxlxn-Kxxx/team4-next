"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  CheckCircle,
} from "@mui/icons-material";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import { apiClient } from "@/src/lib/apiClient";
import {
  localDateTimeToUtcIso,
  utcIsoToLocalDateTimeInputValue,
} from "@/src/lib/dateTime";

export default function DocumentImportPage() {
  const router = useRouter();

  // --- 상태 관리 ---
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: 업로드, 2: 추출 중, 3: 검토 및 확정
  const [isUploading, setIsUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  // OCR 추출 결과 폼 데이터
  const [formData, setFormData] = useState({
    contractTitle: "",
    companyName: "",
    lectureTitle: "",
    startsAt: "",
    endsAt: "",
    venueName: "",
    region: "",
    payAmount: "",
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Step 1: 파일 업로드 ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME 타입에 따른 type 결정
    let type: "CONTRACT_IMAGE" | "CONTRACT_PDF" = "CONTRACT_IMAGE";
    if (file.type === "application/pdf") {
      type = "CONTRACT_PDF";
    }

    setIsUploading(true);
    try {
      const res = await apiClient.uploadDocument(file, type);
      const docId = res.documentId || res.data?.documentId;
      if (!docId) throw new Error("문서 ID를 응답받지 못했습니다.");
      
      setDocumentId(docId);
      setStep(2);
      
      // Step 2로 이동하자마자 OCR 추출 요청 시작
      startExtraction(docId);
    } catch (err: any) {
      console.error("문서 업로드 실패:", err);
      alert(err.message || "문서 업로드에 실패했습니다.");
      setIsUploading(false);
    }
  };

  // --- Step 2: OCR 추출 ---
  const startExtraction = async (docId: string) => {
    try {
      // 서버사이드 추출을 가정 (ocrText 미전달)
      const res = await apiClient.extractDocumentDraft(docId);
      const parsed = res.parsedJson || res.data?.parsedJson || {};
      
      // 추출된 데이터로 폼 초기화
      setFormData({
        contractTitle: parsed.contractTitle || "",
        companyName: parsed.companyName || "",
        lectureTitle: parsed.lectureTitle || "",
        startsAt: utcIsoToLocalDateTimeInputValue(parsed.startsAt),
        endsAt: utcIsoToLocalDateTimeInputValue(parsed.endsAt),
        venueName: parsed.venueName || "",
        region: parsed.region || "",
        payAmount: parsed.payAmount ? String(parsed.payAmount) : "",
        notes: parsed.notes || "",
      });

      setStep(3);
    } catch (err: any) {
      console.error("문서 추출 실패:", err);
      // alert(err.message || "문서 내용 추출에 실패했습니다. 형식에 맞게 직접 입력해주세요.");
      // 실패해도 Step 3으로 넘어가서 수동 입력하게 유도
      setStep(3);
    } finally {
      setIsUploading(false);
    }
  };

  // --- Step 3: 검토 및 확정 ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async () => {
    if (!documentId) return;

    // 1. 임시저장 (updateDocumentDraft)
    try {
      const parsedJson = {
        ...formData,
        startsAt: localDateTimeToUtcIso(formData.startsAt),
        endsAt: localDateTimeToUtcIso(formData.endsAt),
        payAmount: formData.payAmount ? Number(formData.payAmount) : null,
      };

      await apiClient.updateDocumentDraft(documentId, parsedJson);
      
      // 2. 확정 (confirmDocument) -> 새 Lesson / Company 생성
      await apiClient.confirmDocument(documentId);
      
      alert("외부 계약서를 통해 새로운 일정이 등록되었습니다.");
      router.push("/schedules/lessons");
    } catch (err: any) {
      console.error("일정 생성 실패:", err);
      alert(err.message || "일정 확정에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 4 }}>
      <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h3">외부 계약서 일정 등록</Typography>
          <Typography variant="body1" color="text.secondary">
            외부에서 받은 계약서를 업로드하여 일정 자동 생성
          </Typography>
        </Stack>

        <SurfaceCard sx={{ p: 0, overflow: "hidden" }}>
          {/* Step 1: Upload */}
          {step === 1 && (
            <Box
              sx={{
                p: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                backgroundColor: "#FFFDFC",
                border: "2px dashed #EBDDC3",
                m: 3,
                borderRadius: 2,
              }}
            >
              <UploadFileIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1 }}>
                계약서 파일 업로드
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                PDF 또는 이미지(JPG, PNG) 파일을 선택해주세요.
              </Typography>
              
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <AtomButton
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "업로드 중..." : "파일 선택"}
              </AtomButton>
            </Box>
          )}

          {/* Step 2: Extraction Loading */}
          {step === 2 && (
            <Box
              sx={{
                p: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h5">문서 분석 중...</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                계약서 내용을 읽어 일정을 추출하고 있습니다. 잠시만 기다려주세요.
              </Typography>
            </Box>
          )}

          {/* Step 3: Review & Edit */}
          {step === 3 && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle sx={{ color: "#2F6B2F" }} />
                <Typography variant="h5">내용 검토 및 수정</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                추출된 내용을 확인하고 필요한 부분을 수정해주세요. 비어있는 필수값은 직접 채워야 합니다.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="계약 회사명 (필수)"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="계약서/문서명"
                    name="contractTitle"
                    value={formData.contractTitle}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <AtomInput
                    label="수업명 (필수)"
                    name="lectureTitle"
                    value={formData.lectureTitle}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="시작 일시 (필수)"
                    name="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="종료 일시 (필수)"
                    name="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="장소/박물관"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="지역"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <AtomInput
                    label="수업료 (원)"
                    name="payAmount"
                    type="number"
                    value={formData.payAmount}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <AtomInput
                    label="전달 사항 및 메모"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 5 }}>
                <AtomButton atomVariant="outline" onClick={() => router.back()}>
                  취소
                </AtomButton>
                <AtomButton onClick={handleConfirm} disabled={!formData.companyName || !formData.lectureTitle || !formData.startsAt || !formData.endsAt}>
                  등록 확정
                </AtomButton>
              </Box>
            </Box>
          )}
        </SurfaceCard>
    </Box>
  );
}
