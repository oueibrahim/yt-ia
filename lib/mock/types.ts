export type StudentStatus = "pending_license" | "active" | "expired" | "suspended";

export type Niche = {
  id: string;
  slug: string;
  name: string;
};

export type Formation = {
  id: string;
  name: string;
  nicheId: string;
  monthlyMessageQuota: number;
  accessDurationDays: number;
};

export type Student = {
  id: string;
  firstName: string;
  email: string;
  formationId: string;
  status: StudentStatus;
};

export type CommandKind = "script" | "short";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  command: CommandKind | null;
  content: string;
  createdAt: string;
};

export type AdminStudentRow = {
  id: string;
  name: string;
  email: string;
  status: StudentStatus;
  configuratorStep: string;
  lastActivity: string;
  messagesUsed: number;
};

export type License = {
  id: string;
  key: string;
  studentId: string;
  activatedAt: string;
  expiresAt: string;
};
