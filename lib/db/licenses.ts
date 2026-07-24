import "server-only";

import { cache } from "react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { LicenseRow } from "./types";

// cache(): deduplicated per request (layout + page share the same fetch)
export const getActiveLicense = cache(
  async (studentId: string): Promise<LicenseRow | null> => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("student_id", studentId)
      .not("expires_at", "is", null)
      .not("activated_at", "is", null)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`getActiveLicense failed: ${error.message}`);
    return data;
  },
);

export function licenseDaysRemaining(license: LicenseRow): number | null {
  if (!license.expires_at) return null;
  const diff = new Date(license.expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function getLicenseByKey(
  licenseKey: string,
): Promise<LicenseRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", licenseKey)
    .maybeSingle();
  if (error) throw new Error(`getLicenseByKey failed: ${error.message}`);
  return data;
}

// Upserts the Chariow-sourced cache fields only (never student_id/activated_at
// — those are set exclusively by linkLicenseToStudent, once a real student
// links the key on our platform). Used by both the activation flow and the
// webhook, so a Pulse arriving before anyone activates on our side still
// pre-seeds an audit trail.
export async function upsertLicenseFromChariow(params: {
  licenseKey: string;
  chariowPayload: Record<string, unknown>;
  expiresAt: string | null;
}): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("licenses").upsert(
    {
      license_key: params.licenseKey,
      chariow_payload: params.chariowPayload,
      expires_at: params.expiresAt,
    },
    { onConflict: "license_key", ignoreDuplicates: false },
  );
  if (error) throw new Error(`upsertLicenseFromChariow failed: ${error.message}`);
}

// Guarded update: only succeeds if the row is currently unlinked or already
// belongs to this student (studentId is always our own generated uuid, never
// user input). Returns ok:false if a race was lost to another student.
export async function linkLicenseToStudent(params: {
  licenseKey: string;
  studentId: string;
}): Promise<{ ok: boolean }> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("licenses")
    .update({
      student_id: params.studentId,
      activated_at: new Date().toISOString(),
    })
    .eq("license_key", params.licenseKey)
    .or(`student_id.is.null,student_id.eq.${params.studentId}`)
    .select("id");
  if (error) throw new Error(`linkLicenseToStudent failed: ${error.message}`);
  return { ok: (data?.length ?? 0) > 0 };
}

export async function countRecentActivationAttempts(
  studentId: string,
  sinceMinutes: number,
): Promise<number> {
  const supabase = getSupabaseServer();
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("license_activation_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .gte("created_at", since);
  if (error) {
    throw new Error(`countRecentActivationAttempts failed: ${error.message}`);
  }
  return count ?? 0;
}

export async function recordActivationAttempt(studentId: string): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("license_activation_attempts")
    .insert({ student_id: studentId });
  if (error) {
    throw new Error(`recordActivationAttempt failed: ${error.message}`);
  }
}
