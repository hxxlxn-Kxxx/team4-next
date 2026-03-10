"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Divider, Tab, Tabs, Typography, Avatar, Chip, CircularProgress,
  List, ListItem, ListItemText, Stack, Button
} from "@mui/material";
import { School, WorkspacePremium, LocationOn, ArrowBack, Edit, Notes } from "@mui/icons-material";

import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomButton from "@/src/components/atoms/AtomButton";
import { apiClient } from "@/src/lib/apiClient";

// 💡 Prisma Json 스키마에 맞춘 타입 정의
type Education = {
  schoolName?: string;
  major?: string;
  graduationYear?: string;
};

type Certificate = {
  id?: string;
  name?: string;
  year?: string;
};

// 💡 Prisma InstructorProfile 모델 완벽 반영
type InstructorDetail = {
  instructorId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  residenceArea?: string | null;
  photoUrl?: string | null;
  majorField?: string | null;
  profileNote?: string | null;
  isActive: boolean;
  
  // JSON 컬럼들 (null 가능성 대비)
  education?: Education | null;
  preferredRegions?: string[] | null;
  
  // 백엔드 DTO(certifications)와 실제 DB 컬럼(certificates) 모두 대응
  certificates?: Certificate[] | null;
  certifications?: Certificate[] | null; 
};

export default function InstructorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [tabIndex, setTabIndex] = useState(0);
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await apiClient.getInstructorById(id as string);
        const instructorData = response.data || response;
        setInstructor(instructorData);
      } catch (error) {
        console.error("상세 프로필 조회 실패:", error);
        alert("강사 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!instructor) {
    return <Typography color="error" sx={{ p: 3 }}>강사 정보를 찾을 수 없습니다.</Typography>;
  }

  // 💡 실제 데이터 안전하게 추출 (DB 컬럼명과 DTO명 둘 다 체크)
  const safeCerts = instructor.certifications || instructor.certificates || [];
  const safeRegions = instructor.preferredRegions || [];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", pb: 10 }}>
      {/* 상단 액션 바 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mr: 2 }}>목록</Button>
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>강사 상세 프로필</Typography>
        <AtomButton startIcon={<Edit />}>정보 수정하기</AtomButton>
      </Box>

      {/* 🟢 프로필 요약 카드 */}
      <SurfaceCard sx={{ p: 4, display: "flex", alignItems: "center", gap: 4, mb: 4 }}>
        <Avatar src={instructor.photoUrl || undefined} sx={{ width: 120, height: 120, border: "3px solid #EBDDC3" }} />
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">{instructor.name} 강사</Typography>
            {instructor.isActive && <Chip label="활동 중" color="success" size="small" sx={{ fontWeight: "bold" }} />}
            {instructor.majorField && (
              <Chip label={instructor.majorField} color="primary" variant="outlined" size="small" sx={{ fontWeight: "bold" }} />
            )}
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            📞 {instructor.phone || "연락처 미등록"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ✉️ {instructor.email}
          </Typography>
        </Box>
      </SurfaceCard>

      {/* 정보 탭 메뉴 */}
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} sx={{ mb: 3, borderBottom: "1px solid #eee" }}>
        <Tab label="기본 정보" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
        <Tab label="가용시간" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
        <Tab label="수업 및 계약" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
      </Tabs>

      {/* 🟢 탭 0: 기본 정보 */}
      <Box>
        {tabIndex === 0 && (
          <Stack spacing={3}>
            {/* 거주지 & 선호 지역 */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <SurfaceCard sx={{ p: 4, flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn color="primary" /> 거주 지역
                </Typography>
                <Chip label={instructor.residenceArea || "미등록"} sx={{ bgcolor: "#F0E8DA", color: "#5F5445", fontWeight: "bold" }} />
              </SurfaceCard>

              {safeRegions.length > 0 && (
                <SurfaceCard sx={{ p: 4, flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn color="secondary" /> 선호 출강 지역
                </Typography>
                
                {safeRegions.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {safeRegions.map((region, idx) => (
                      <Chip key={idx} label={region} variant="outlined" sx={{ fontWeight: "bold", color: "text.secondary" }} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    등록된 선호 출강 지역이 없습니다.
                  </Typography>
                )}
              </SurfaceCard>
              )}
            </Stack>

            {/* 학력 정보 */}
            <SurfaceCard sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <School color="primary" /> 학력 정보
              </Typography>
              {instructor.education && instructor.education.schoolName ? (
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`• ${instructor.education.schoolName} ${instructor.education.major || ""}`} 
                      secondary={instructor.education.graduationYear ? `졸업 연도: ${instructor.education.graduationYear}년` : ""}
                      primaryTypographyProps={{ fontSize: "1rem", fontWeight: "medium" }} 
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">등록된 학력 정보가 없습니다.</Typography>
              )}
            </SurfaceCard>

            {/* 자격증 정보 */}
            <SurfaceCard sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <WorkspacePremium color="primary" /> 보유 자격증
              </Typography>
              {safeCerts.length > 0 ? (
                <List disablePadding>
                  {safeCerts.map((cert, idx) => (
                    <ListItem key={cert.id || idx} disableGutters sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={`• ${cert.name || "자격증명 없음"}`} 
                        secondary={cert.year ? `취득 연도: ${cert.year}년` : ""}
                        primaryTypographyProps={{ fontSize: "1rem", fontWeight: "medium" }} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">등록된 자격증 정보가 없습니다.</Typography>
              )}
            </SurfaceCard>

            {/* 프로필 메모 */}
            {instructor.profileNote && (
              <SurfaceCard sx={{ p: 4, bgcolor: "#FAFAFA" }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Notes color="action" /> 관리자 프로필 메모
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {instructor.profileNote}
                </Typography>
              </SurfaceCard>
            )}
          </Stack>
        )}

        {tabIndex === 1 && (
          <SurfaceCard sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>투입 가능 스케줄</Typography>
            <Typography variant="body1" color="text.secondary">DB의 `InstructorAvailabilitySlot` 데이터를 불러와 달력 형태로 표시할 영역입니다.</Typography>
          </SurfaceCard>
        )}

        {tabIndex === 2 && (
          <SurfaceCard sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>수업 이력 및 계약 정보</Typography>
            <Typography variant="body1" color="text.secondary">DB의 `Lesson` 테이블과 `Contract` 테이블 데이터를 조회하여 표시할 영역입니다.</Typography>
          </SurfaceCard>
        )}
      </Box>
    </Box>
  );
}