import type {
  Conversation,
  Formation,
  License,
  Message,
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

export const mockAssistantName = "FITBOT";

export const mockQuotaUsed = 128;

export const mockConversations: Conversation[] = [
  {
    id: "conv-01",
    title: "Script — Le mythe du cardio à jeun",
    createdAt: "2026-07-21T09:12:00Z",
  },
  {
    id: "conv-02",
    title: "Short — 3 erreurs au développé couché",
    createdAt: "2026-07-15T18:40:00Z",
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-01",
    conversationId: "conv-01",
    role: "user",
    command: "script",
    content: "/script Le cardio à jeun fait-il vraiment perdre plus de gras ?",
    createdAt: "2026-07-21T09:12:00Z",
  },
  {
    id: "msg-02",
    conversationId: "conv-01",
    role: "assistant",
    command: "script",
    content: `STRUCTURE : MYTHE BRISÉ

HOOK (0-15 s)
On t'a répété que courir le ventre vide brûlait deux fois plus de gras. Et si je te disais que tu perds surtout ton temps — et parfois ton muscle ?

INTRODUCTION
Reste jusqu'au bout : je te montre ce que disent vraiment les études, et ce que tu dois faire à la place pour voir ton ventre fondre.

PARTIE UNE — D'OÙ VIENT LE MYTHE
Dans les années quatre-vingt-dix, une étude sur douze cyclistes…`,
    createdAt: "2026-07-21T09:12:45Z",
  },
  {
    id: "msg-03",
    conversationId: "conv-02",
    role: "user",
    command: "short",
    content: "/short 3 erreurs au développé couché qui bloquent tes pecs",
    createdAt: "2026-07-15T18:40:00Z",
  },
  {
    id: "msg-04",
    conversationId: "conv-02",
    role: "assistant",
    command: "short",
    content: `FORMAT : LISTE CHOC

HOOK (0-2 s)
Tes pecs ne grossissent pas ? C'est sûrement l'une de ces trois erreurs.

ERREUR UNE — Tu descends la barre trop haut, sur le cou au lieu du bas des pecs.
ERREUR DEUX — Tes coudes partent à quatre-vingt-dix degrés : tes épaules encaissent tout.
ERREUR TROIS — Tu ne touches jamais ta poitrine : amplitude coupée, résultats coupés.

CTA
Abonne-toi, la suite arrive demain.`,
    createdAt: "2026-07-15T18:41:10Z",
  },
];

export function licenseDaysRemaining(license: License): number {
  const diff = new Date(license.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
