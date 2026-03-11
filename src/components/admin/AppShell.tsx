"use client";

import type { ReactNode } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/src/lib/apiClient';
import Image from 'next/image';
import {
  Avatar,
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  Menu,
  MenuItem,
  ListItemIcon,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  AccountCircle,
  ChatBubble,
  ExpandLess,
  ExpandMore,
  Logout,
  Notifications,
  Search,
  Settings,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

import ChatDrawer from '@/src/components/ChatDrawer';
import AtomButton from '@/src/components/atoms/AtomButton';
import AtomNavItem from '@/src/components/atoms/AtomNavItem';
import { adminNavigation } from './navigation';

const drawerWidth = 272;

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
}


export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Instructors: pathname.startsWith('/instructors'),
    Schedules: pathname.startsWith('/schedules'),
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);



  const activeSectionLabel = useMemo(() => {
    const activeItem = adminNavigation.find((item) => pathname.startsWith(item.href));
    return activeItem?.label ?? 'free-b Admin';
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  // 초기 미읽음 카운트 조회 (30초마다 폴링)
  const refreshUnreadCount = useCallback(async () => {
    // 채팅 드로어가 열려있을 때는 드로어 자체의 상태 업데이트를 우선시합니다.
    if (isChatOpen) return;
    try {
      const data = await apiClient.getUnreadCount();
      const count = data?.unreadCount ?? data?.count ?? 0;
      setChatUnreadCount(count);
    } catch {
      // 인증 전이면 무시
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  useEffect(() => {

    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    apiClient.logout();
  };


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            px: 2,
            py: 2,
          },
        }}
      >
        <Toolbar disableGutters sx={{ px: 1.5, minHeight: '72px !important' }}>
          <Box
            sx={{
              px: 2.25,
              py: 1.75,
              borderRadius: '18px 0 18px 18px',
              backgroundColor: '#FBF7ED',
              border: '1px solid #EFD9A2',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Image src="/bee.svg" alt="free-b bee logo" width={38} height={30} />
            <Typography variant="h4" sx={{ color: 'primary.main', lineHeight: 1 }}>
              free-b
            </Typography>
          </Box>
        </Toolbar>

        <List sx={{ mt: 2 }}>
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const isGroupActive = pathname.startsWith(item.href);
            const isOpen = item.children ? (openGroups[item.label] ?? isGroupActive) : false;

            return (
              <Box key={item.label} sx={{ mb: 1 }}>
                <AtomNavItem
                  label={item.label}
                  icon={<Icon />}
                  active={isGroupActive && !item.children ? true : isGroupActive}
                  onClick={() => {
                    if (!item.children) {
                      router.push(item.href);
                      return;
                    }

                    if (!isGroupActive) {
                      router.push(item.children[0].href);
                      setOpenGroups((current) => ({ ...current, [item.label]: true }));
                      return;
                    }

                    toggleGroup(item.label);
                  }}
                  trailing={item.children ? (isOpen ? <ExpandLess /> : <ExpandMore />) : null}
                />

                {item.children ? (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <Stack spacing={0.5} sx={{ mt: 1, ml: 2 }}>
                      {item.children.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <AtomNavItem
                            key={child.href}
                            label={child.label}
                            icon={null}
                            nested
                            active={isActive}
                            onClick={() => router.push(child.href)}
                          />
                        );
                      })}
                    </Stack>
                  </Collapse>
                ) : null}
              </Box>
            );
          })}
        </List>
      </Drawer>

      <Box sx={{ ml: `${drawerWidth}px`, minHeight: '100vh' }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: '88px !important',
            px: { xs: 3, md: 5 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(255, 249, 239, 0.82)',
            backdropFilter: 'blur(18px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {activeSectionLabel}
              </Typography>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '12px 0 12px 12px',
                    backgroundColor: '#FFF0C2',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Image src="/bee.svg" alt="free-b bee logo" width={22} height={18} />
                </Box>
                <Typography variant="h5">free-b Admin</Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton sx={{ color: 'text.secondary' }}>
                <Search />
              </IconButton>
              <IconButton 
                onClick={() => setIsChatOpen(true)} 
                sx={{ 
                  color: 'text.secondary',
                  bgcolor: 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.05)', bgcolor: '#FFF9EF' }
                }}
              >
                <Badge 
                  badgeContent={chatUnreadCount} 
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      bgcolor: '#251B10', 
                      color: 'white',
                      fontWeight: 700,
                      border: '2px solid #FFF9EF'
                    } 
                  }}
                >
                  <ChatBubble fontSize="small" />
                </Badge>
              </IconButton>
              <IconButton 
                sx={{ 
                  color: 'text.secondary',
                  bgcolor: 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.05)', bgcolor: '#FFF9EF' }
                }}
              >
                <Badge 
                  badgeContent={3} 
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      bgcolor: '#F3C742', 
                      color: '#251B10',
                      fontWeight: 700,
                      border: '2px solid #FFF9EF'
                    } 
                  }}
                >
                  <Notifications fontSize="small" />
                </Badge>
              </IconButton>
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0 }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'M'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '16px 0 16px 16px',
                    minWidth: 220,
                    boxShadow: '0 8px 32px rgba(37, 27, 16, 0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user?.name || '관리자'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {user?.email || 'admin@free-b.kr'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => router.push('/settings')}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">프로필 관리</Typography>
                </MenuItem>
                <MenuItem onClick={() => router.push('/settings')}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">설정</Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography variant="body2">로그아웃</Typography>
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Toolbar>

        <Box component="main" sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
          {children}
        </Box>
      </Box>

      <ChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onUnreadCountChange={(count) => setChatUnreadCount(count)}
      />
    </Box>
  );
}
