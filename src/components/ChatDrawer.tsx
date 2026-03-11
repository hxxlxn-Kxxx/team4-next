"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer, Box, Typography, IconButton, Divider,
  List, ListItemButton, ListItemAvatar, Avatar,
  ListItemText, Badge, TextField, Paper, Stack, CircularProgress,
} from "@mui/material";
import { Close, ArrowBack, Send } from "@mui/icons-material";
import { io, Socket } from "socket.io-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { queryKeys } from "@/src/lib/queryKeys";
import AtomButton from "@/src/components/atoms/AtomButton";

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
  const queryClient = useQueryClient();

  // ── 채팅방 목록 조회 (React Query)
  const { data: roomsData, isLoading: isRoomsLoading } = useQuery({
    queryKey: queryKeys.chat.rooms,
    queryFn: async () => {
      const data = await apiClient.getChatRooms();
      const list: ChatRoom[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return list;
    },
    enabled: open,
  });
  const rooms = roomsData ?? [];

  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef<ChatRoom | null>(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ── WebSocket 연결
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`${BASE_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("chat_message", (msg: ChatMessage) => {
      const current = activeRoomRef.current;
      if (current && msg.roomId === current.roomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [...prev, msg];
        });
        apiClient.readRoom(msg.roomId).catch(() => {});
      } else {
        queryClient.setQueryData<ChatRoom[]>(queryKeys.chat.rooms, (old) => {
          if (!old) return old;
          return old.map((r) =>
            r.roomId === msg.roomId
              ? {
                  ...r,
                  unreadCount: r.unreadCount + 1,
                  lastMessage: { content: msg.content, sentAt: msg.sentAt },
                  updatedAt: msg.sentAt,
                }
              : r
          );
        });
      }
    });

    socket.on("connect", () => {
      if (activeRoomRef.current) {
        socket.emit("join_room", { roomId: activeRoomRef.current.roomId });
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("ChatSocket connect error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  // unreadCount 변경 시 부모에 알림
  useEffect(() => {
    const total = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
    onUnreadCountChange?.(total);
  }, [rooms, onUnreadCountChange]);

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

  const isFirstScrollRef = useRef(true);

  // 메시지 추가 시 하단 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: isFirstScrollRef.current ? "auto" : "smooth" 
      });
      isFirstScrollRef.current = false;
    }
  }, [messages]);

  // ── 방 선택
  const handleSelectRoom = async (room: ChatRoom) => {
    isFirstScrollRef.current = true; // 대화방 진입 시 첫 스크롤은 즉시 이동
    setActiveRoom(room);
    setMessages([]);
    setNextCursor(null);
    await fetchMessages(room.roomId);

    socketRef.current?.emit("join_room", { roomId: room.roomId });

    apiClient.readRoom(room.roomId).catch(() => {});
    queryClient.setQueryData<ChatRoom[]>(queryKeys.chat.rooms, (old) => {
      if (!old) return old;
      return old.map((r) => (r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r));
    });
  };

  // ── 메시지 전송
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeRoom) throw new Error("No active room");
      return await apiClient.sendChatMessage(activeRoom.roomId, content);
    },
    onSuccess: (sent, content) => {
      if (!activeRoom) return;
      const newMsg: ChatMessage = sent?.data ?? sent;
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
        return [...prev, newMsg];
      });
      queryClient.setQueryData<ChatRoom[]>(queryKeys.chat.rooms, (old) => {
        if (!old) return old;
        return old.map((r) =>
          r.roomId === activeRoom.roomId
            ? { ...r, lastMessage: { content, sentAt: newMsg?.sentAt ?? new Date().toISOString() }, updatedAt: new Date().toISOString() }
            : r
        );
      });
    },
    onError: (err, content) => {
      console.error("메시지 전송 실패:", err);
      setInputText(content);
    }
  });

  const handleSend = () => {
    if (!inputText.trim() || !activeRoom || sendMutation.isPending) return;
    const content = inputText.trim();
    setInputText("");
    sendMutation.mutate(content);
  };

  const handleBack = () => {
    if (activeRoom) {
      socketRef.current?.emit("leave_room", { roomId: activeRoom.roomId });
    }
    setActiveRoom(null);
    setMessages([]);
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms });
  };

  const activeRoomName = activeRoom ? getRoomDisplayName(activeRoom) : "";

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 440 },
          borderRadius: { sm: '32px 0 0 32px' },
          overflow: 'hidden',
          boxShadow: '-10px 0 30px rgba(37, 27, 16, 0.08)',
        }
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: '#FBF7ED' }}>
        {/* 헤더 */}
        <Box 
          sx={{ 
            p: 2.5, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            background: 'linear-gradient(135deg, #FBF7ED 0%, #FFF9EF 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {activeRoom && (
              <IconButton 
                onClick={handleBack} 
                size="small"
                sx={{ bgcolor: 'white', border: '1px solid #eee' }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#251B10">
                {activeRoom ? activeRoomName : "메시지"}
              </Typography>
              {!activeRoom && (
                <Typography variant="caption" color="text.secondary">
                  {rooms.length}개의 대화
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ bgcolor: 'white', border: '1px solid #eee' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* 채팅방 목록 */}
        {!activeRoom && (
          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 2 }}>
            {isRoomsLoading ? (
              <Box display="flex" justifyContent="center" py={10}><CircularProgress size={32} color="inherit" /></Box>
            ) : rooms.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 12, opacity: 0.6 }}>
                <Typography variant="body2">진행 중인 대화가 없습니다.</Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {rooms.map((room) => {
                  const displayName = getRoomDisplayName(room);
                  const preview = room.lastMessage?.content ?? "";
                  const time = room.lastMessage?.sentAt
                    ? formatTime(room.lastMessage.sentAt)
                    : formatTime(room.updatedAt);
                  const isUnread = room.unreadCount > 0;

                  return (
                    <ListItemButton 
                      key={room.roomId}
                      onClick={() => handleSelectRoom(room)} 
                      sx={{ 
                        py: 2, 
                        px: 2,
                        borderRadius: '20px',
                        bgcolor: isUnread ? '#FFF9EF' : 'white',
                        border: '1px solid',
                        borderColor: isUnread ? '#EFD9A2' : 'transparent',
                        boxShadow: isUnread ? '0 4px 12px rgba(243, 199, 66, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isUnread ? '#FFF9EF' : '#F5F5F5',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color="success"
                          invisible={!isUnread}
                          sx={{ '& .MuiBadge-badge': { border: '2px solid white' } }}
                        >
                          <Avatar 
                            sx={{ 
                              width: 48, 
                              height: 48, 
                              bgcolor: isUnread ? '#F3C742' : '#E8E8E8',
                              color: isUnread ? '#251B10' : '#888',
                              fontWeight: 700,
                              fontSize: '1rem',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}
                          >
                            {displayName.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight={isUnread ? 800 : 600} color="#251B10">
                              {displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                              {time}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              noWrap 
                              sx={{ 
                                maxWidth: '180px',
                                fontWeight: isUnread ? 500 : 400,
                                color: isUnread ? '#251B10' : '#666'
                              }}
                            >
                              {preview || "메시지 없음"}
                            </Typography>
                            {isUnread && (
                              <Badge 
                                badgeContent={room.unreadCount} 
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    bgcolor: '#251B10', 
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.65rem'
                                  } 
                                }} 
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* 메시지 상세 화면 */}
        {activeRoom && (
          <>
            <Box 
              sx={{ 
                flexGrow: 1, 
                overflowY: "auto", 
                px: 2.5, 
                py: 3, 
                bgcolor: "#FFFFFF",
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {nextCursor && (
                <Box textAlign="center" mb={2}>
                  <AtomButton
                    atomVariant="ghost"
                    size="small"
                    onClick={() => fetchMessages(activeRoom.roomId, nextCursor)}
                  >
                    이전 메시지 보기
                  </AtomButton>
                </Box>
              )}
              
              {isMsgLoading && messages.length === 0 ? (
                <Box display="flex" justifyContent="center" py={10}><CircularProgress size={28} color="inherit" /></Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 10, opacity: 0.5 }}>
                  <Typography variant="body2">나눈 대화가 여기에 표시됩니다.</Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {messages.map((msg, idx) => {
                    const isAdmin = activeRoom.members.find((m) => m.userId === msg.senderUserId)?.role === "ADMIN";
                    const isSystem = msg.messageType === "SYSTEM";
                    
                    if (isSystem) {
                      return (
                        <Box key={msg.messageId} sx={{ textAlign: 'center', my: 1 }}>
                          <Typography variant="caption" sx={{ bgcolor: '#F5F5F5', px: 1.5, py: 0.5, borderRadius: '10px', color: '#888' }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      );
                    }

                    return (
                      <Box 
                        key={msg.messageId} 
                        sx={{ 
                          display: "flex", 
                          flexDirection: 'column',
                          alignItems: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        {!isAdmin && msg.senderName && (
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#251B10', mb: 0.5, ml: 1 }}>
                            {msg.senderName}
                          </Typography>
                        )}
                        <Stack 
                          direction={isAdmin ? "row" : "row-reverse"} 
                          spacing={1} 
                          alignItems="flex-end"
                        >
                          <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.65rem', mb: 0.5 }}>
                            {formatTime(msg.sentAt)}
                          </Typography>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.75, 
                              maxWidth: "280px", 
                              borderRadius: isAdmin ? '20px 0 20px 20px' : '0 20px 20px 20px',
                              bgcolor: isAdmin ? "#251B10" : "#F3F3F3",
                              color: isAdmin ? "white" : "#251B10",
                              boxShadow: isAdmin ? '0 4px 12px rgba(37, 27, 16, 0.15)' : 'none',
                              position: 'relative'
                            }}
                          >
                            <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: 'break-all' }}>
                              {msg.content}
                            </Typography>
                          </Paper>
                        </Stack>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* 입력창 */}
            <Box 
              sx={{ 
                p: 2.5, 
                bgcolor: "white", 
                borderTop: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  display: "flex", 
                  alignItems: "center",
                  bgcolor: '#FBF7ED',
                  border: '1px solid #EFD9A2',
                  borderRadius: '16px 0 16px 16px',
                  px: 1.5,
                  py: 0.5
                }}
              >
                <TextField
                  fullWidth 
                  multiline
                  maxRows={4}
                  placeholder="메시지 입력..." 
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{ py: 1, px: 0.5 }}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === "Enter" && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleSend(); 
                    } 
                  }}
                  disabled={sendMutation.isPending}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendMutation.isPending}
                  sx={{ 
                    bgcolor: inputText.trim() ? "#251B10" : "transparent",
                    color: inputText.trim() ? "white" : "#ccc",
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: '#443322'
                    },
                    ml: 1,
                    width: 36,
                    height: 36
                  }}
                >
                  {sendMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Send sx={{ fontSize: 18 }} />}
                </IconButton>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
