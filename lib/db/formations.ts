import "server-only";

import { cache } from "react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { FormationRow } from "./types";

export const getFormationForStudent = cache(
  async (studentId: string): Promise<FormationRow> => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("students")
      .select("formations(*)")
      .eq("id", studentId)
      .single();
    if (error) throw new Error(`getFormationForStudent failed: ${error.message}`);

    const formation = data.formations as unknown as FormationRow | null;
    if (!formation) {
      throw new Error(`getFormationForStudent: no formation for student ${studentId}`);
    }
    return formation;
  },
);
