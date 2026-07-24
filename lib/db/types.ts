// Hand-written row types, aligned with supabase/migrations/0001_initial_schema.sql

export type StudentStatus =
  | "pending_license"
  | "active"
  | "expired"
  | "suspended";

export type NicheRow = {
  id: string;
  slug: string;
  name: string;
  vocabulary: {
    terms: string[];
    target_examples: string[];
    avatar_styles: string[];
    banner_styles: string[];
  };
  hook_examples: string[];
  default_palette: Array<{
    id: string;
    name: string;
    primary: string;
    secondary: string;
  }>;
  script_structures: { long: string[]; shorts: string[] };
  is_active: boolean;
  created_at: string;
};

export type FormationRow = {
  id: string;
  name: string;
  niche_id: string;
  chariow_product_id: string | null;
  monthly_message_quota: number;
  access_duration_days: number;
  created_at: string;
};

export type StudentRow = {
  id: string;
  clerk_user_id: string;
  email: string;
  formation_id: string;
  status: StudentStatus;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  student_id: string;
  title: string;
  created_at: string;
};

export type MessageCommand = "script" | "short";

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  command: MessageCommand | null;
  content: string;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
};

export type LicenseRow = {
  id: string;
  license_key: string;
  student_id: string | null;
  chariow_payload: Record<string, unknown> | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
};
