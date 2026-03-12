"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Stack, 
  Typography, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  MyLocation, 
  Search, 
  Refresh, 
  WarningAmber, 
  CheckCircleOutline,
  DirectionsRun,
  Login,
  Flag,
  InfoOutlined,
  ArrowForwardIos
} from '@mui/icons-material';
import { apiClient } from '@/src/lib/apiClient';
import { LessonGpsStatus } from '@/src/types/backend';

export default function GpsMonitoringPage() {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const { data: gpsStatusList = [], isLoading, refetch, isFetching } = useQuery<LessonGpsStatus[]>({
    queryKey: ['gpsStatus', today],
    queryFn: () => apiClient.getGpsStatus(today),
    refetchInterval: 60000, // 1분마다 자동 갱신
  });

  // 통계 계산
  const stats = useMemo(() => {
    if (!Array.isArray(gpsStatusList)) return { total: 0, departed: 0, arrived: 0, finished: 0, suspicious: 0, risk: 0 };
    return {
      total: gpsStatusList.length,
      departed: gpsStatusList.filter(g => g.departed).length,
      arrived: gpsStatusList.filter(g => g.arrived).length,
      finished: gpsStatusList.filter(g => g.finished).length,
      suspicious: gpsStatusList.filter(g => g.suspicious).length,
      risk: gpsStatusList.filter(g => g.commuteRiskDetected || g.delayedFinish).length,
    };
  }, [gpsStatusList]);

  // 필터링 필터 구현
  const filteredList = useMemo(() => {
    if (!filterQuery) return gpsStatusList;
    const lowerQuery = filterQuery.toLowerCase();
    return gpsStatusList.filter(g => 
      g.lectureTitle.toLowerCase().includes(lowerQuery) || 
      g.instructorName.toLowerCase().includes(lowerQuery)
    );
  }, [gpsStatusList, filterQuery]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 1 }}>
            실시간 GPS 모니터링
          </Typography>
          <Typography variant="body2" color="text.secondary">
            금일({today}) 진행되는 모든 수업의 위치 및 출결 상태를 실시간으로 모니터링합니다.
          </Typography>
        </Box>
        <IconButton 
          onClick={() => refetch()} 
          disabled={isFetching}
          sx={{ 
            bgcolor: 'white', 
            border: '1px solid', 
            borderColor: 'divider',
            '&:hover': { bgcolor: '#FBF7ED' }
          }}
        >
          <Refresh className={isFetching ? 'animate-spin' : ''} />
        </IconButton>
      </Stack>

      {/* 요약 카드 영역 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="전체 수업" value={stats.total} icon={<Flag color="action" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="출발 완료" value={stats.departed} color="#E3F2FD" icon={<DirectionsRun sx={{ color: '#1565C0' }} />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="도착 완료" value={stats.arrived} color="#E8F5E9" icon={<Login sx={{ color: '#2E7D32' }} />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="수업 종료" value={stats.finished} color="#F3E5F5" icon={<CheckCircleOutline sx={{ color: '#7B1FA2' }} />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard title="의심/리스크" value={stats.suspicious + stats.risk} color="#FFF5F5" icon={<WarningAmber sx={{ color: '#E53E3E' }} />} highlight />
        </Grid>
      </Grid>

      {/* 모니터링 리스트 */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FBF7ED' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">오늘의 수업 모니터링</Typography>
            <TextField
              size="small"
              placeholder="강사명 또는 수업명 검색"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300, bgcolor: 'white' }}
            />
          </Stack>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#FAFAFA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>수업 정보</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>강사</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>수업 시간</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>GPS 시퀀스</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>리스크 현황</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">조회된 모니터링 데이터가 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((g: LessonGpsStatus) => (
                    <TableRow 
                      key={g.lessonId} 
                      hover 
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}
                      onClick={() => router.push(`/schedules/lessons/${g.lessonId}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{g.lectureTitle}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{g.instructorName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {formatTime(g.startsAt)} ~ {formatTime(g.endsAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <StatusIndicator label="출발" active={g.departed} time={formatTime(g.departedAt)} />
                          <StatusIndicator label="도착" active={g.arrived} time={formatTime(g.arrivedAt)} />
                          <StatusIndicator label="종료" active={g.finished} time={formatTime(g.finishedAt)} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {g.suspicious && <Chip label="위치 의심" size="small" color="error" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />}
                          {g.commuteRiskDetected && <Chip label="지각 위험" size="small" color="error" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />}
                          {g.delayedFinish && <Chip label="지연 종료" size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <ArrowForwardIos sx={{ fontSize: 14 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 정책 안내 */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <InfoOutlined sx={{ fontSize: 16 }} />
        <Typography variant="caption">
          GPS 모니터링 데이터는 강사의 위치 정보를 기반으로 백엔드에서 실시간 검증(250m 반경, GPS 정확도 등)을 거쳐 집계됩니다.
        </Typography>
      </Box>
    </Box>
  );
}

// ── 보조 컴포넌트

function SummaryCard({ title, value, icon, color, highlight }: { title: string; value: number; icon: any; color?: string; highlight?: boolean }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: color || 'white', border: highlight ? '2px solid #E53E3E' : '1px solid #eee' }}>
      <CardContent sx={{ p: '20px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 600 }}>{title}</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: highlight ? '#E53E3E' : 'inherit' }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: '50%' }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatusIndicator({ label, active, time }: { label: string; active: boolean; time?: string }) {
  return (
    <Box 
      sx={{ 
        px: 1, py: 0.5, 
        borderRadius: 1, 
        border: '1px solid', 
        borderColor: active ? 'transparent' : 'divider',
        bgcolor: active ? (label === '출발' ? '#E3F2FD' : label === '도착' ? '#E8F5E9' : '#F3E5F5') : 'transparent',
        opacity: active ? 1 : 0.4,
        minWidth: 54,
        textAlign: 'center'
      }}
    >
      <Typography variant="caption" display="block" sx={{ fontWeight: 800, color: active ? 'inherit' : 'text.disabled', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      {active && time !== '-' && (
        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 600 }}>{time}</Typography>
      )}
    </Box>
  );
}
