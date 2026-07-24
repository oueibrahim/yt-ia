import "server-only";

import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { StudentRow, StudentStatus } from "./types";

async function fetchStudentByClerkId(
  clerkUserId: string,
): Promise<StudentRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(`getStudentByClerkId failed: ${error.message}`);
  return data;
}

// cache(): deduplicated per request (layout + page share the same fetch).
// ensureStudent uses the uncached fetch internally so a first-visit `null`
// is never memoised for the rest of the render tree.
export const getStudentByClerkId = cache(fetchStudentByClerkId);

// Creates the student row on first visit (status pending_license, default
// formation = the single seeded one), or returns the existing row.
export async function ensureStudent(): Promise<StudentRow | null> {
  const user = await currentUser();
  if (!user) return null;

  const existing = await fetchStudentByClerkId(user.id);
  if (existing) return existing;

  const supabase = getSupabaseServer();
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (formationError) {
    throw new Error(`ensureStudent: no formation found: ${formationError.message}`);
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const { data, error } = await supabase
    .from("students")
    .upsert(
      {
        clerk_user_id: user.id,
        email,
        formation_id: formation.id,
      },
      { onConflict: "clerk_user_id" },
    )
    .select()
    .single();
  if (error) throw new Error(`ensureStudent failed: ${error.message}`);
  return data;
}

export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus,
): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", studentId);
  if (error) throw new Error(`updateStudentStatus failed: ${error.message}`);
}
