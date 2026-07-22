import type { AdminStudentRow, Formation, License, Niche, Student } from "./types";

export const mockNiche: Niche = {
  id: "niche-fitness",
  slug: "fitness",
  name: "Fitness",
};

export const mockFormation: Formation = {
  id: "formation-fitness-01",
  name: "Formation YouTube Fitness",
  nicheId: mockNiche.id,
  monthlyMessageQuota: 200,
  accessDurationDays: 30,
};

export const mockStudent: Student = {
  id: "student-01",
  firstName: "Ibrahim",
  email: "eleve@exemple.com",
  formationId: mockFormation.id,
  status: "active",
};

export const mockLicense: License = {
  id: "license-01",
  key: "FIT-2026-XXXX-XXXX",
  studentId: mockStudent.id,
  activatedAt: "2026-07-01",
  expiresAt: "2026-07-31",
};

export const mockAdminStudents: AdminStudentRow[] = [
  {
    id: "adm-01",
    name: "Ibrahim K.",
    email: "eleve@exemple.com",
    status: "active",
    configuratorStep: "Terminé",
    lastActivity: "2026-07-21T09:12:00Z",
    messagesUsed: 128,
  },
  {
    id: "adm-02",
    name: "Sarah M.",
    email: "sarah.m@exemple.com",
    status: "active",
    configuratorStep: "Couleurs (3/5)",
    lastActivity: "2026-07-20T16:30:00Z",
    messagesUsed: 42,
  },
  {
    id: "adm-03",
    name: "Yann D.",
    email: "yann.d@exemple.com",
    status: "pending_license",
    configuratorStep: "Non commencé",
    lastActivity: "2026-07-19T11:05:00Z",
    messagesUsed: 0,
  },
  {
    id: "adm-04",
    name: "Aminata S.",
    email: "aminata.s@exemple.com",
    status: "expired",
    configuratorStep: "Terminé",
    lastActivity: "2026-06-28T14:20:00Z",
    messagesUsed: 187,
  },
  {
    id: "adm-05",
    name: "Kevin T.",
    email: "kevin.t@exemple.com",
    status: "suspended",
    configuratorStep: "Avatar (4/5)",
    lastActivity: "2026-07-10T08:45:00Z",
    messagesUsed: 199,
  },
  {
    id: "adm-06",
    name: "Léa B.",
    email: "lea.b@exemple.com",
    status: "active",
    configuratorStep: "Cible (1/5)",
    lastActivity: "2026-07-21T07:55:00Z",
    messagesUsed: 3,
  },
];

export function licenseDaysRemaining(license: License): number {
  const diff = new Date(license.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
