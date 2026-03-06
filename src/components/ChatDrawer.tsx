"use client";

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  TextField,
  Paper,
  Stack,
} from "@mui/material";
import { Close, ArrowBack, Send } from "@mui/icons-material";

const MOCK_CHAT_LIST = [
  {
    id: 1,
    name: "김철수",
    lastMessage: "오늘 10분 정도 늦을 것 같습니다 ㅠㅠ",
    time: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    name: "이영희",
    lastMessage: "네, 확인했습니다!",
    time: "어제",
    unread: 0,
  },
  {
    id: 3,
    name: "박지민",
    lastMessage: "이번 달 정산 내역 여쭤볼 게 있습니다.",
    time: "어제",
    unread: 0,
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "instructor",
    text: "관리자님, 안녕하세요!",
    time: "10:28 AM",
  },
  {
    id: 2,
    sender: "instructor",
    text: "오늘 차가 너무 막혀서 10분 정도 늦을 것 같습니다 ㅠㅠ",
    time: "10:30 AM",
  },
];

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    alert(`"${inputText}" 전송 완료! (임시)`);
    setInputText("");
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 400,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* 1. 패널 상단 헤더 */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#1976d2",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* 상세 대화창일 때만 뒤로가기 버튼 표시 */}
            {activeChatId !== null && (
              <IconButton
                color="inherit"
                onClick={() => setActiveChatId(null)}
                size="small"
              >
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight="bold">
              {activeChatId !== null ? "김철수 강사" : "실시간 채팅"}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* 2. 조건부 렌더링: 목록 화면 vs 상세 대화 화면 */}
        {activeChatId === null ? (
          <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
            {MOCK_CHAT_LIST.map((chat) => (
              <React.Fragment key={chat.id}>
                <ListItemButton
                  onClick={() => setActiveChatId(chat.id)}
                  sx={{ py: 2 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: chat.unread > 0 ? "primary.main" : "grey.400",
                      }}
                    >
                      {chat.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          fontWeight={chat.unread > 0 ? "bold" : "medium"}
                        >
                          {chat.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {chat.time}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        noWrap
                        sx={{ mt: 0.5, pr: 2 }}
                      >
                        {chat.lastMessage}
                      </Typography>
                    }
                  />
                  {chat.unread > 0 && (
                    <Badge
                      badgeContent={chat.unread}
                      color="error"
                      sx={{ mr: 2 }}
                    />
                  )}
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <>
            <Box
              sx={{ flexGrow: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}
            >
              <Stack spacing={2}>
                {MOCK_MESSAGES.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "admin" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        maxWidth: "75%",
                        borderRadius: 3,
                        bgcolor:
                          msg.sender === "admin" ? "primary.main" : "white",
                        color:
                          msg.sender === "admin" ? "white" : "text.primary",
                        border:
                          msg.sender === "admin" ? "none" : "1px solid #eee",
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 0.5,
                          textAlign: "right",
                          color:
                            msg.sender === "admin"
                              ? "rgba(255,255,255,0.7)"
                              : "text.secondary",
                        }}
                      >
                        {msg.time}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* 입력창 (상세 뷰 하단 고정) */}
            <Box
              sx={{
                p: 2,
                bgcolor: "white",
                borderTop: "1px solid #eee",
                display: "flex",
                gap: 1,
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="메시지를 입력하세요..."
                variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                sx={{ bgcolor: "rgba(25, 118, 210, 0.1)" }}
              >
                <Send />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
