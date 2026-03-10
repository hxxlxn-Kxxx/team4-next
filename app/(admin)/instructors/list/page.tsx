"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Divider, Drawer, IconButton, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress,
  Tabs, Tab, Chip, Tooltip
} from "@mui/material";
import {
  CalendarMonth, ChevronLeft, ChevronRight, Search, Close, OpenInNew
} from "@mui/icons-material";

import AtomButton from "@/src/components/atoms/AtomButton";
import AtomInput from "@/src/components/atoms/AtomInput";
import FilterBar from "@/src/components/admin/FilterBar";
import PageHeader from "@/src/components/admin/PageHeader";
import SurfaceCard from "@/src/components/admin/SurfaceCard";
import { apiClient } from "@/src/lib/apiClient";

const SUBMISSION_STATUS = ["전체", "제출완료", "미제출"];

type MonthlyClass = {
  lessonId: string;
  location: string;
  datetime: string;
};

// Tab 1: 운영 리스트용 타입
type OperationInstructor = {
  id: string | number;
  name: string;
  phone: string;
  majorField: string;
  submissionStatus: "SUBMITTED" | "PENDING";
  assignedCount: number;
  totalAvailableDays: number;
  monthlyClasses: MonthlyClass[];
};

// Tab 2: 주간 가용성 매트릭스용 타입
type DailyStatus = { date: string; status: "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE" };
type WeeklyInstructor = {
  id: string | number;
  name: string;
  weeklyStatus: DailyStatus[];
};

export default function InstructorListPage() {
  const router = useRouter();
  const currentMonth = "2026-03";
  
  // 탭 상태 관리 (0: 리스트, 1: 주간 매트릭스)
  const [currentTab, setCurrentTab] = useState(0);

  // 데이터 상태
  const [operationsData, setOperationsData] = useState<OperationInstructor[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedInstructor, setSelectedInstructor] = useState<OperationInstructor | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");

  // 데이터 패칭 로직
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 실제 API 연동 시 아래 주석 해제 후 사용
        // const opData = await apiClient.request('/instructors/operations');
        // const wkData = await apiClient.request('/instructors/weekly-availability?startDate=2026-03-09');
        
        // [임시 Mock 데이터]
        const mockOpData: OperationInstructor[] = [
          { 
            id: "1", name: "김철수", phone: "010-1111-2222", majorField: "역사/박물관", submissionStatus: "SUBMITTED", assignedCount: 4, totalAvailableDays: 12,
            monthlyClasses: [
              { lessonId: "L1", location: "국립중앙박물관", datetime: "3월 10일 (화) 14:00 - 16:00" },
              { lessonId: "L2", location: "용산 역사관", datetime: "3월 12일 (목) 10:00 - 12:00" }
            ]
          },
          { 
            id: "2", name: "이영희", phone: "010-3333-4444", majorField: "미술/도슨트", submissionStatus: "PENDING", assignedCount: 0, totalAvailableDays: 0,
            monthlyClasses: []
          },
          { 
            id: "3", name: "박지성", phone: "010-5555-6666", majorField: "과학/생태", submissionStatus: "SUBMITTED", assignedCount: 8, totalAvailableDays: 8,
            monthlyClasses: [
              { lessonId: "L3", location: "과천과학관", datetime: "3월 11일 (수) 13:00 - 15:00" },
            ]
          },
        ];
        
        const mockWkData: WeeklyInstructor[] = [
          { id: "1", name: "김철수", weeklyStatus: [
              { date: "03/09", status: "AVAILABLE" }, { date: "03/10", status: "ASSIGNED" }, { date: "03/11", status: "UNAVAILABLE" },
              { date: "03/12", status: "AVAILABLE" }, { date: "03/13", status: "AVAILABLE" }, { date: "03/14", status: "UNAVAILABLE" }, { date: "03/15", status: "UNAVAILABLE" }
          ]},
          { id: "2", name: "이영희", weeklyStatus: Array(7).fill({ status: "UNAVAILABLE" }) }, // 미제출자는 전부 불가
          { id: "3", name: "박지성", weeklyStatus: [
              { date: "03/09", status: "ASSIGNED" }, { date: "03/10", status: "ASSIGNED" }, { date: "03/11", status: "ASSIGNED" },
              { date: "03/12", status: "UNAVAILABLE" }, { date: "03/13", status: "UNAVAILABLE" }, { date: "03/14", status: "UNAVAILABLE" }, { date: "03/15", status: "UNAVAILABLE" }
          ]},
        ];

        setOperationsData(mockOpData);
        setWeeklyData(mockWkData);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    alert(`${filterName} 검색 로직을 실행합니다.`);
  };

  const renderStatusCell = (status: string) => {
    switch(status) {
      case "AVAILABLE": return <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: "#4CAF50", mx: "auto" }} />; // 초록색 (배정가능)
      case "ASSIGNED": return <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: "#2196F3", mx: "auto" }} />; // 파란색 (배정완료)
      default: return <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: "#E0E0E0", mx: "auto" }} />; // 회색 (불가/미제출)
    }
  };

  return (
    <Box>
      <PageHeader
        title="강사 운영 리스트"
        //description="배정에 필요한 일정 제출 현황과 주간 가용성을 한눈에 확인합니다."
        action={
          <SurfaceCard sx={{ px: 1, py: 0.75, borderRadius: 999 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small"><ChevronLeft /></IconButton>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
                <CalendarMonth fontSize="small" color="action" />
                <Box component="span" sx={{ fontWeight: 700 }}>2026년 3월 2주차</Box>
              </Stack>
              <IconButton size="small"><ChevronRight /></IconButton>
            </Stack>
          </SurfaceCard>
        }
      />

      {/* 탭 전환 UI */}
      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab label="전체 운영 리스트" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
        <Tab label="주간 가용성 매트릭스" sx={{ fontWeight: "bold", fontSize: "1rem" }} />
      </Tabs>

      <FilterBar>
        <AtomInput label="강사명" placeholder="이름 입력" value={filterName} onChange={(e) => setFilterName(e.target.value)} size="small" sx={{ flexGrow: 1 }} />
        <AtomInput select label="일정 제출 상태" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: { xs: "100%", lg: 220 } }}>
          {SUBMISSION_STATUS.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
        </AtomInput>
        <AtomButton startIcon={<Search />} onClick={handleSearch} sx={{ minWidth: { xs: "100%", lg: 132 } }}>검색</AtomButton>
      </FilterBar>

      <SurfaceCard sx={{ overflow: "hidden" }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : currentTab === 0 ? (
          // 탭 1: 전체 운영 리스트
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#FBF7ED" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>이름 / 분야</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>연락처</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>일정 제출 상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>이번 달 가용 현황</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>상세 액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {operationsData.map((row) => (
                  <TableRow key={row.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                    <TableCell align="center">
                      <Typography fontWeight="bold">{row.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{row.majorField}</Typography>
                    </TableCell>
                    <TableCell align="center">{row.phone}</TableCell>
                    <TableCell align="center">
                      {row.submissionStatus === "SUBMITTED" ? 
                        <Chip label="제출완료" color="success" size="small" /> : 
                        <Chip label="미제출" color="error" size="small" /> // 독촉 버튼으로 바꿀 수 있는 포인트!
                      }
                    </TableCell>
                    <TableCell align="center">
                      {row.submissionStatus === "SUBMITTED" ? (
                        <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: 1, backgroundColor: row.assignedCount >= row.totalAvailableDays ? "#f5f5f5" : "#FFF4E5", fontWeight: 700 }}>
                          {row.assignedCount} / {row.totalAvailableDays}일 배정됨
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <AtomButton atomVariant="outline" size="small" onClick={() => setSelectedInstructor(row)}>요약 보기</AtomButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // 탭 2: 주간 가용성 매트릭스
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#FBF7ED" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: "bold", borderRight: "1px solid #eee" }}>강사명</TableCell>
                  {["월 (09)", "화 (10)", "수 (11)", "목 (12)", "금 (13)", "토 (14)", "일 (15)"].map(day => (
                    <TableCell key={day} align="center" sx={{ fontWeight: "bold" }}>{day}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {weeklyData.map((row) => (
                  <TableRow key={row.id} hover sx={{ "& td": { borderColor: "divider" } }}>
                    <TableCell align="center" sx={{ fontWeight: "bold", borderRight: "1px solid #eee" }}>{row.name}</TableCell>
                    {row.weeklyStatus.map((statusObj, idx) => (
                      <TableCell key={idx} align="center">
                        <Tooltip title={statusObj.status === "AVAILABLE" ? "배정 가능" : statusObj.status === "ASSIGNED" ? "수업 있음" : "불가"}>
                          {renderStatusCell(statusObj.status)}
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SurfaceCard>

      <Drawer anchor="right" open={Boolean(selectedInstructor)} onClose={() => setSelectedInstructor(null)} PaperProps={{ sx: { width: 500 } }}>
        <Box display="flex" justifyContent="flex-end" sx={{ pt: 2, pr: 2 }}>
          <IconButton onClick={() => setSelectedInstructor(null)}><Close /></IconButton>
        </Box>
        <Box sx={{ px: 4, pb: 4, display: "flex", flexDirection: "column", height: "100%" }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>{selectedInstructor?.name} 강사</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            전화번호: {selectedInstructor?.phone} | 주력: {selectedInstructor?.majorField}
          </Typography>

          <SurfaceCard sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" color="textSecondary" mb={1}>이번 달 배정 현황</Typography>
            <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">제출한 가능 일수</Typography>
                <Typography variant="h4" sx={{ mt: 1, color: "primary.main" }}>{selectedInstructor?.totalAvailableDays ?? 0}일</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">현재 배정된 일수</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{selectedInstructor?.assignedCount ?? 0}일</Typography>
              </Box>
            </Stack>
          </SurfaceCard>

          <Typography variant="subtitle2" color="textSecondary" mb={1.5}>이번 달 출강 확정 스케줄</Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {selectedInstructor?.monthlyClasses && selectedInstructor.monthlyClasses.length > 0 ? (
              selectedInstructor.monthlyClasses.map((cls) => (
                <SurfaceCard key={cls.lessonId} sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {cls.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cls.datetime}
                  </Typography>
                </SurfaceCard>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: "center", bgcolor: "#f8f9fa", borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  이번 달에 확정된 수업이 없습니다.
                </Typography>
              </Box>
            )}
          </Stack>

          <Box sx={{ mt: "auto", pt: 4 }}>
            <AtomButton fullWidth size="large" startIcon={<OpenInNew />} onClick={() => router.push(`/instructors/${selectedInstructor?.id}`)}>
              전체 프로필 및 이력 보기
            </AtomButton>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}