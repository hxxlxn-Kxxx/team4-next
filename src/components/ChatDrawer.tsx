"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer, Box, Typography, IconButton, Divider,
  List, ListItemButton, ListItemAvatar, Avatar,
  ListItemText, Badge, TextField, Paper, Stack, CircularProgress,
} from "@mui/material";
import { Close, ArrowBack, Send } from "@mui/icons-material";
import { io, Socket } from "socket.io-client";
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
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

const getToken = (): string | null => {
  if (typeof window !== "undefined") return localStorage.getItem("accessToken");
  return null;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday)
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const diff = now.getTime() - d.getTime();
  if (diff < 1000 * 60 * 60 * 24 * 2) return "어제";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

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
  /** 드로어 외부(AppShell)에서 unreadCount를 공유 받을 콜백 */
  onUnreadCountChange?: (count: number) => void;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function ChatDrawer({ open, onClose, onUnreadCountChange }: ChatDrawerProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef<ChatRoom | null>(null);

  // activeRoom이 바뀔 때 ref 동기화 (socket 핸들러 클로저에서 참조)
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ── WebSocket 연결 (컴포넌트 마운트 ~ 언마운트)
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`${BASE_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // 실시간 메시지 수신
    socket.on("chat_message", (msg: ChatMessage) => {
      const current = activeRoomRef.current;
      if (current && msg.roomId === current.roomId) {
        // 현재 열린 방이면 메시지 추가
        setMessages((prev) => {
          // 중복 방지
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [...prev, msg];
        });
      } else {
        // 다른 방 메시지 → unreadCount+1
        setRooms((prev) =>
          prev.map((r) =>
            r.roomId === msg.roomId
              ? {
                  ...r,
                  unreadCount: r.unreadCount + 1,
                  lastMessage: { content: msg.content, sentAt: msg.sentAt },
                  updatedAt: msg.sentAt,
                }
              : r
          )
        );
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("ChatSocket connect error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // unreadCount 변경 시 부모에 알림
  useEffect(() => {
    const total = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
    onUnreadCountChange?.(total);
  }, [rooms, onUnreadCountChange]);

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
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRooms(list);
    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err);
    } finally {
      setIsRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchRooms();
  }, [open, fetchRooms]);

  // ── 메시지 조회
  const fetchMessages = useCallback(async (roomId: string, cursor?: string) => {
    setIsMsgLoading(true);
    try {
      const data = await apiClient.getChatMessages(roomId, cursor);
      const list: ChatMessage[] = Array.isArray(data?.items) ? data.items : [];
      list.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      if (cursor) {
        setMessages((prev) => [...list, ...prev]);
      } else {
        setMessages(list);
      }
      setNextCursor(data?.nextCursor ?? null);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
    } finally {
      setIsMsgLoading(false);
    }
  }, []);

  // ── 방 선택
  const handleSelectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setMessages([]);
    setNextCursor(null);
    await fetchMessages(room.roomId);
    // 읽음 처리 → vadgeCount 0
    apiClient.readRoom(room.roomId).catch(() => {});
    setRooms((prev) =>
      prev.map((r) => (r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r))
    );
  };

  // ── 메시지 전송
  const handleSend = async () => {
    if (!inputText.trim() || !activeRoom || isSending) return;
    const content = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      const sent = await apiClient.sendChatMessage(activeRoom.roomId, content);
      const newMsg: ChatMessage = sent?.data ?? sent;
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
        return [...prev, newMsg];
      });
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === activeRoom.roomId
            ? { ...r, lastMessage: { content, sentAt: newMsg?.sentAt ?? new Date().toISOString() }, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error("메시지 전송 실패:", err);
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  // 메시지 추가 시 하단 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBack = () => {
    setActiveRoom(null);
    setMessages([]);
    fetchRooms();
  };

  const activeRoomName = activeRoom ? getRoomDisplayName(activeRoom) : "";

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* 헤더 */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#1976d2", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {activeRoom && (
              <IconButton color="inherit" onClick={handleBack} size="small">
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight="bold">
              {activeRoom ? activeRoomName : "실시간 채팅"}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* 채팅방 목록 */}
        {!activeRoom && (
          <>
            {isRoomsLoading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
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
                              <Typography variant="caption" color="textSecondary">{time}</Typography>
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

        {/* 메시지 목록 */}
        {activeRoom && (
          <>
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}>
              {nextCursor && (
                <Box textAlign="center" mb={1}>
                  <Typography
                    variant="caption" color="primary"
                    sx={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => fetchMessages(activeRoom.roomId, nextCursor)}
                  >
                    이전 메시지 더 보기
                  </Typography>
                </Box>
              )}
              {isMsgLoading && messages.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                  <Typography variant="body2">메시지가 없습니다.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {messages.map((msg) => {
                    const isAdmin =
                      activeRoom.members.find((m) => m.userId === msg.senderUserId)?.role === "ADMIN";
                    return (
                      <Box key={msg.messageId} sx={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
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
                            sx={{ display: "block", mt: 0.5, textAlign: "right", color: isAdmin ? "rgba(255,255,255,0.7)" : "text.secondary" }}
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

            {/* 입력창 */}
            <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #eee", display: "flex", gap: 1 }}>
              <TextField
                fullWidth size="small" placeholder="메시지를 입력하세요..." variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={isSending}
              />
              <IconButton
                color="primary" onClick={handleSend}
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
