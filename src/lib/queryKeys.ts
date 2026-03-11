export const queryKeys = {
  // Lessons
  lessons: {
    all: ["lessons"] as const,
    list: (filters: Record<string, any>) => ["lessons", "list", filters] as const,
    detail: (id: string | number) => ["lessons", "detail", id] as const,
  },
  
  // Contracts
  contracts: {
    all: ["contracts"] as const,
    list: (filters: Record<string, any>) => ["contracts", "list", filters] as const,
    detail: (id: string | number) => ["contracts", "detail", id] as const,
  },

  // Instructors
  instructors: {
    all: ["instructors"] as const,
    list: (filters?: Record<string, any>) => ["instructors", "list", filters] as const,
    detail: (id: string | number) => ["instructors", "detail", id] as const,
    assignmentAvailable: (lessonId: string | number) => ["instructors", "assignmentAvailable", lessonId] as const,
    operations: (month: string) => ["instructors", "operations", month] as const,
    weekly: (startDate: string) => ["instructors", "weekly", startDate] as const,
  },

  // Settlements
  settlements: {
    all: ["settlements"] as const,
    list: (filters: Record<string, any>) => ["settlements", "list", filters] as const,
    detail: (id: string | number) => ["settlements", "detail", id] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    summary: () => ["dashboard", "summary"] as const,
  },

  // Chat
  chat: {
    rooms: ["chat", "rooms"] as const,
    messages: (roomId: string) => ["chat", "messages", roomId] as const,
    unreadCount: ["chat", "unreadCount"] as const,
  },
} as const;
