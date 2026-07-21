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

export type License = {
  id: string;
  key: string;
  studentId: string;
  activatedAt: string;
  expiresAt: string;
};
