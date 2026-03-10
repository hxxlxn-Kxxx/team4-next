"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer, Box, Typography, IconButton, Divider,
  List, ListItemButton, ListItemAvatar, Avatar,
  ListItemText, Badge, TextField, Paper, Stack, CircularProgress,
} from "@mui/material";
import { Close, ArrowBack, Send } from "@mui/icons-material";
import { apiClient } from "@/src/lib/apiClient";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type ChatMember = {
  userId: string;
  role: "ADMIN" | "INSTRUCTOR";
  userName?: string | null;
};

type ChatRoom = {
  roomId: string;
  title?: string | null;
  unreadCount: number;
  members: ChatMember[];
  lastMessage?: {
    content: string;
    sentAt: string;
  } | null;
  updatedAt: string;
};

type ChatMessage = {
  messageId: string;
  roomId: string;
  senderUserId: string;
  senderName?: string | null;
  messageType: "TEXT" | "SYSTEM";
  content: string;
  sentAt: string;
};

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const diff = now.getTime() - d.getTime();
  if (diff < 1000 * 60 * 60 * 24 * 2) return "어제";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 채팅방 상대방 이름 추출 (INSTRUCTOR 멤버 우선, 없으면 title, 없으면 roomId) */
function getRoomDisplayName(room: ChatRoom): string {
  const other = room.members.find((m) => m.role === "INSTRUCTOR");
  return other?.userName || room.title || room.roomId;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  // ── 상태
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── 채팅방 목록 조회
  const fetchRooms = useCallback(async () => {
    setIsRoomsLoading(true);
    try {
      const data = await apiClient.getChatRooms();
      const list: ChatRoom[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      // updatedAt 최신순
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRooms(list);
    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err);
    } finally {
      setIsRoomsLoading(false);
    }
  }, []);

  // 드로어 열릴 때 목록 조회
  useEffect(() => {
    if (open) fetchRooms();
  }, [open, fetchRooms]);

  // ── 메시지 조회
  const fetchMessages = useCallback(async (roomId: string, cursor?: string) => {
    setIsMsgLoading(true);
    try {
      const data = await apiClient.getChatMessages(roomId, cursor);
      const list: ChatMessage[] = Array.isArray(data?.items) ? data.items : [];
      const nc: string | null = data?.nextCursor ?? null;

      // 오름차순 정렬 (sentAt)
      list.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

      if (cursor) {
        // 더 불러오기: 앞에 추가
        setMessages((prev) => [...list, ...prev]);
      } else {
        setMessages(list);
      }
      setNextCursor(nc);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
    } finally {
      setIsMsgLoading(false);
    }
  }, []);

  // 방 선택
  const handleSelectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setMessages([]);
    setNextCursor(null);
    await fetchMessages(room.roomId);
    // 읽음 처리 (에러 무시)
    apiClient.readRoom(room.roomId).catch(() => {});
    // 목록 unreadCount 초기화
    setRooms((prev) =>
      prev.map((r) => (r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r))
    );
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!inputText.trim() || !activeRoom || isSending) return;
    const content = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      const sent = await apiClient.sendChatMessage(activeRoom.roomId, content);
      const newMsg: ChatMessage = sent?.data ?? sent;
      setMessages((prev) => [...prev, newMsg]);
      // 목록 lastMessage 업데이트
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === activeRoom.roomId
            ? { ...r, lastMessage: { content, sentAt: newMsg?.sentAt ?? new Date().toISOString() }, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error("메시지 전송 실패:", err);
      setInputText(content); // 실패 시 복원
    } finally {
      setIsSending(false);
    }
  };

  // 메시지 추가 시 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 뒤로가기
  const handleBack = () => {
    setActiveRoom(null);
    setMessages([]);
    fetchRooms(); // 목록 갱신
  };

  const activeRoomName = activeRoom ? getRoomDisplayName(activeRoom) : "";

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* ── 헤더 */}
        <Box
          sx={{
            p: 2, display: "flex", alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#1976d2", color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {activeRoom && (
              <IconButton color="inherit" onClick={handleBack} size="small">
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight="bold">
              {activeRoom ? `${activeRoomName}` : "실시간 채팅"}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* ── 채팅방 목록 */}
        {!activeRoom && (
          <>
            {isRoomsLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : rooms.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                <Typography>채팅방이 없습니다.</Typography>
              </Box>
            ) : (
              <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
                {rooms.map((room) => {
                  const displayName = getRoomDisplayName(room);
                  const preview = room.lastMessage?.content ?? "";
                  const time = room.lastMessage?.sentAt
                    ? formatTime(room.lastMessage.sentAt)
                    : formatTime(room.updatedAt);
                  return (
                    <React.Fragment key={room.roomId}>
                      <ListItemButton onClick={() => handleSelectRoom(room)} sx={{ py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: room.unreadCount > 0 ? "primary.main" : "grey.400" }}>
                            {displayName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography fontWeight={room.unreadCount > 0 ? "bold" : "medium"}>
                                {displayName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {time}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary" noWrap sx={{ mt: 0.5, pr: 2 }}>
                              {preview || "메시지 없음"}
                            </Typography>
                          }
                        />
                        {room.unreadCount > 0 && (
                          <Badge badgeContent={room.unreadCount} color="error" sx={{ mr: 2 }} />
                        )}
                      </ListItemButton>
                      <Divider component="li" />
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </>
        )}

        {/* ── 메시지 목록 */}
        {activeRoom && (
          <>
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}>
              {/* 더 불러오기 */}
              {nextCursor && (
                <Box textAlign="center" mb={1}>
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => fetchMessages(activeRoom.roomId, nextCursor)}
                  >
                    이전 메시지 더 보기
                  </Typography>
                </Box>
              )}

              {isMsgLoading && messages.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                  <Typography variant="body2">메시지가 없습니다.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {messages.map((msg) => {
                    // 현재 로그인 유저는 ADMIN이므로 senderName 없거나 ADMIN 역할이면 내 메시지
                    const isAdmin =
                      activeRoom.members.find((m) => m.userId === msg.senderUserId)?.role === "ADMIN";
                    return (
                      <Box
                        key={msg.messageId}
                        sx={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5, maxWidth: "75%", borderRadius: 3,
                            bgcolor: isAdmin ? "primary.main" : "white",
                            color: isAdmin ? "white" : "text.primary",
                            border: isAdmin ? "none" : "1px solid #eee",
                          }}
                        >
                          {!isAdmin && msg.senderName && (
                            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                              {msg.senderName}
                            </Typography>
                          )}
                          <Typography variant="body2">{msg.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block", mt: 0.5, textAlign: "right",
                              color: isAdmin ? "rgba(255,255,255,0.7)" : "text.secondary",
                            }}
                          >
                            {formatTime(msg.sentAt)}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* ── 입력창 */}
            <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #eee", display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="메시지를 입력하세요..."
                variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isSending}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!inputText.trim() || isSending}
                sx={{ bgcolor: "rgba(25, 118, 210, 0.1)" }}
              >
                {isSending ? <CircularProgress size={20} /> : <Send />}
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
