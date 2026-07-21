import type {
  Formation,
  License,
  Niche,
  NicheContent,
  Student,
} from "./types";

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

export const mockNicheContent: NicheContent = {
  targetExamples: [
    "Hommes 25-40 ans qui veulent se remettre au sport après des années d'inactivité, avec peu de temps libre.",
    "Femmes 20-35 ans qui cherchent à perdre du poids durablement sans régime extrême, entraînement à la maison.",
  ],
  palettes: [
    { id: "energy", name: "Énergie", primary: "#FF4D2E", secondary: "#1D1D26" },
    { id: "power", name: "Puissance", primary: "#FBBF24", secondary: "#0B0B0F" },
    { id: "fresh", name: "Fraîcheur", primary: "#34D399", secondary: "#15151C" },
  ],
  avatarStyles: ["Réaliste", "Cartoon", "Mascotte", "Minimaliste"],
  bannerStyles: ["Salle de sport", "Outdoor", "Studio épuré", "Avant/Après"],
};

export function licenseDaysRemaining(license: License): number {
  const diff = new Date(license.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
