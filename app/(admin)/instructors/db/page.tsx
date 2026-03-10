"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, MenuItem, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Typography
} from "@mui/material";
import { Add, Search, UploadFile } from "@mui/icons-material";

import FilterBar from "@/src/components/admin/FilterBar";
import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import { apiClient } from "@/src/lib/apiClient";

const LEVEL_OPTIONS = ["전체", "주니어", "시니어", "마스터"];

type InstructorRow = {
  instructorId: string;
  name: string;
  phone: string | null;
  residenceArea: string | null;
  majorField: string | null;
  isActive: boolean;
};

export default function InstructorDBPage() {
  const router = useRouter();
  
  const [filterRegion, setFilterRegion] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterLevel, setFilterLevel] = useState("전체");
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getInstructors();
        const data = response.data || response;
        
        setInstructors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("강사 목록 DB 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const handleReset = () => {
    setFilterRegion(""); setFilterMajor(""); setFilterName(""); setFilterLevel("전체");
  };

  return (
    <Box>
      <PageHeader
        title="전체 강사 DB"
        description="강사 프로필, 레벨, 가능 일정과 계약 자료를 탐색합니다."
        action={
          <Stack direction="row" spacing={1}>
            <AtomButton atomVariant="outline" startIcon={<UploadFile />}>엑셀 업로드</AtomButton>
            <AtomButton startIcon={<Add />}>강사 추가</AtomButton>
          </Stack>
        }
      />

      <FilterBar>
        <AtomInput label="강사명" placeholder="이름 입력" value={filterName} onChange={(e) => setFilterName(e.target.value)} size="small" sx={{ flex: 1 }} />
        <AtomInput label="거주지역" placeholder="예: 경기" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} size="small" sx={{ flex: 1 }} />
        <AtomInput label="전공" placeholder="예: 컴퓨터공학" value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} size="small" sx={{ flex: 1 }} />
        <AtomInput select label="레벨" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} size="small" sx={{ flex: 1 }}>
          {LEVEL_OPTIONS.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
        </AtomInput>
        <Stack direction="row" spacing={1}>
          <AtomButton atomVariant="outline" onClick={handleReset}>초기화</AtomButton>
          <AtomButton startIcon={<Search />}>검색</AtomButton>
        </Stack>
      </FilterBar>

      <TableContainer component={SurfaceCard}>
        <Table>
          <TableHead sx={{ bgcolor: "#FBF7ED" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>이름</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>연락처</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>거주지역</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>전공</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>상세</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                  <Typography color="textSecondary" sx={{ mt: 2 }}>DB에서 강사 데이터를 불러오는 중입니다...</Typography>
                </TableCell>
              </TableRow>
            ) : instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography color="textSecondary">등록된 강사가 없습니다.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((instructor) => (
                <TableRow key={instructor.instructorId} hover>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{instructor.name}</TableCell>
                  <TableCell align="center">{instructor.isActive ? "활동 중" : "비활동"}</TableCell>
                  <TableCell align="center">{instructor.phone || "미등록"}</TableCell>
                  <TableCell align="center">{instructor.residenceArea || "미등록"}</TableCell>
                  <TableCell align="center">{instructor.majorField || "미등록"}</TableCell>
                  <TableCell align="center">
                    <AtomButton atomVariant="outline" size="small" onClick={() => router.push(`/instructors/db/${instructor.instructorId}`)}>
                      보기
                    </AtomButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}