import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { LicenseRow } from "./types";

export async function getActiveLicense(
  studentId: string,
): Promise<LicenseRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("student_id", studentId)
    .not("expires_at", "is", null)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getActiveLicense failed: ${error.message}`);
  return data;
}

export function licenseDaysRemaining(license: LicenseRow): number | null {
  if (!license.expires_at) return null;
  const diff = new Date(license.expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
