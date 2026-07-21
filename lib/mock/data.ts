import type { Formation, License, Niche, Student } from "./types";

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

export function licenseDaysRemaining(license: License): number {
  const diff = new Date(license.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
