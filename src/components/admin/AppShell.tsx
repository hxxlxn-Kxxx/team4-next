"use client";

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Avatar,
  Badge,
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  ChatBubble,
  ExpandLess,
  ExpandMore,
  Notifications,
  Search,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

import ChatDrawer from '@/src/components/ChatDrawer';
import AtomButton from '@/src/components/atoms/AtomButton';
import AtomNavItem from '@/src/components/atoms/AtomNavItem';
import { adminNavigation } from './navigation';

const drawerWidth = 272;

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Instructors: pathname.startsWith('/instructors'),
    Schedules: pathname.startsWith('/schedules'),
  });

  const activeSectionLabel = useMemo(() => {
    const activeItem = adminNavigation.find((item) => pathname.startsWith(item.href));
    return activeItem?.label ?? 'free-b Admin';
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
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
              <IconButton onClick={() => setIsChatOpen(true)} sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={2} color="error">
                  <ChatBubble />
                </Badge>
              </IconButton>
              <IconButton sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                }}
              >
                M
              </Avatar>
            </Stack>
          </Stack>
        </Toolbar>

        <Box component="main" sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
          {children}
        </Box>
      </Box>

      <ChatDrawer open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Box>
  );
}
