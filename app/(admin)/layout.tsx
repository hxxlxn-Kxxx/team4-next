"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Collapse,
} from "@mui/material";
import {
  ChatBubble,
  Dashboard,
  People,
  Paid,
  Event,
  Receipt,
  Settings,
  Notifications,
  Search,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import ChatDrawer from "@/src/components/ChatDrawer";

const drawerWidth = 240;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [openInstructors, setOpenInstructors] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    {
      text: "Instructors",
      icon: <People />,
      path: "/instructors",
      // 하위 메뉴 배열 추가
      subItems: [
        { text: "강사 운영 리스트", path: "/instructors/list" },
        { text: "전체 강사 DB", path: "/instructors/db" },
      ],
    },
    { text: "Schedules", icon: <Event />, path: "/schedules" },
    { text: "Contracts", icon: <Receipt />, path: "/contracts" },
    { text: "Settlements", icon: <Paid />, path: "/settlements" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* 1. 상단 헤더 영역 (기존 유지) */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: "white",
          color: "black",
          boxShadow: "none",
          borderBottom: "1px solid #eee",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold">
            free-b Admin
          </Typography>
          {/* 상단 우측 아이콘 그룹 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton>
              <Search />
            </IconButton>
            <IconButton onClick={() => setIsChatOpen(true)}>
              <Badge badgeContent={2} color="error">
                <ChatBubble />
              </Badge>
            </IconButton>
            <IconButton>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
              M
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 2. 왼쪽 사이드바 영역 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #eee",
          },
        }}
      >
        <Toolbar>
          <Typography
            variant="h5"
            color="primary"
            fontWeight="bold"
            sx={{ letterSpacing: 1 }}
          >
            free-b
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: "auto", px: 2, mt: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const isGroupActive = pathname.startsWith(item.path);

              return (
                <React.Fragment key={item.text}>
                  {/* 메인 메뉴 항목 */}
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => {
                        if (item.subItems) {
                          if (!pathname.startsWith(item.path)) {
                            router.push(item.subItems[0].path);
                            setOpenInstructors(true);
                          } else {
                            setOpenInstructors(!openInstructors);
                          }
                        } else {
                          router.push(item.path);
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        bgcolor:
                          isActive && !item.subItems
                            ? "primary.main"
                            : "transparent",
                        color: isActive && !item.subItems ? "white" : "inherit",
                        "&:hover": {
                          bgcolor:
                            isActive && !item.subItems
                              ? "primary.main"
                              : "rgba(0,0,0,0.04)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color:
                            isActive && !item.subItems ? "white" : "inherit",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: "14px",
                          fontWeight: isGroupActive ? 600 : 500,
                        }}
                      />
                      {/* 하위 메뉴가 있으면 화살표 표시 */}
                      {item.subItems &&
                        (openInstructors ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>
                  </ListItem>

                  {/* 하위 메뉴 (아코디언 영역) */}
                  {item.subItems && (
                    <Collapse in={openInstructors} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.path;
                          return (
                            <ListItemButton
                              key={subItem.text}
                              onClick={() => router.push(subItem.path)}
                              sx={{
                                pl: 7, // 하위 메뉴 들여쓰기
                                py: 1,
                                mb: 0.5,
                                borderRadius: 2,
                                bgcolor: isSubActive
                                  ? "rgba(99, 102, 241, 0.1)"
                                  : "transparent",
                                color: isSubActive
                                  ? "primary.main"
                                  : "text.secondary",
                                "&:hover": {
                                  bgcolor: "rgba(99, 102, 241, 0.05)",
                                },
                              }}
                            >
                              <ListItemText
                                primary={subItem.text}
                                primaryTypographyProps={{
                                  fontSize: "13px",
                                  fontWeight: isSubActive ? 600 : 400,
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
          <ChatDrawer open={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </Box>
      </Drawer>

      {/* 3. 메인 콘텐츠 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
