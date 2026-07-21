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

export type ColorPalette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
};

export type ConfiguratorAnswers = {
  target: string;
  channelName: string;
  colors: {
    paletteId: string | null;
    primary: string;
    secondary: string;
  };
  avatar: {
    description: string;
    styles: string[];
  };
  banner: {
    description: string;
    styles: string[];
  };
};

export type NicheContent = {
  targetExamples: string[];
  palettes: ColorPalette[];
  avatarStyles: string[];
  bannerStyles: string[];
};

export type License = {
  id: string;
  key: string;
  studentId: string;
  activatedAt: string;
  expiresAt: string;
};
