import "server-only";

import { cache } from "react";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { NicheRow } from "./types";

// Resolves the student's niche through their formation.
export const getNicheForStudent = cache(
  async (studentId: string): Promise<NicheRow> => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("students")
      .select("formation_id, formations(niche_id, niches(*))")
      .eq("id", studentId)
      .single();
    if (error) throw new Error(`getNicheForStudent failed: ${error.message}`);

    const formation = data.formations as unknown as {
      niches: NicheRow;
    } | null;
    if (!formation?.niches) {
      throw new Error(`getNicheForStudent: no niche for student ${studentId}`);
    }
    return formation.niches;
  },
);
