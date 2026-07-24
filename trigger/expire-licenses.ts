import "server-only";

import { schedules } from "@trigger.dev/sdk";
import { getSupabaseServer } from "@/lib/supabase/server";

// Safety net for a permanently missed Chariow Pulse (webhook retries give up
// after ~27h). Runs daily: any student marked "active" with no currently
// valid license gets flipped to "expired".
//
// Two batch queries + a set difference, not one query per student —
// getActiveLicense's React cache() has no dedup guarantee outside an RSC
// render, so a per-student loop would mean N sequential DB round trips.
export const expireLicenses = schedules.task({
  id: "expire-licenses",
  cron: { pattern: "0 3 * * *", timezone: "UTC" },
  run: async () => {
    const supabase = getSupabaseServer();

    const { data: activeStudents, error: activeError } = await supabase
      .from("students")
      .select("id")
      .eq("status", "active");
    if (activeError) {
      throw new Error(`expire-licenses: students query failed: ${activeError.message}`);
    }

    const { data: validLicenses, error: licenseError } = await supabase
      .from("licenses")
      .select("student_id")
      .not("student_id", "is", null)
      .not("activated_at", "is", null)
      .gt("expires_at", new Date().toISOString());
    if (licenseError) {
      throw new Error(`expire-licenses: licenses query failed: ${licenseError.message}`);
    }

    const validStudentIds = new Set(
      (validLicenses ?? []).map((license) => license.student_id),
    );
    const toExpire = (activeStudents ?? [])
      .map((student) => student.id)
      .filter((id) => !validStudentIds.has(id));

    if (toExpire.length > 0) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ status: "expired" })
        .in("id", toExpire);
      if (updateError) {
        throw new Error(`expire-licenses: update failed: ${updateError.message}`);
      }
    }

    console.log(
      `expire-licenses: checked ${activeStudents?.length ?? 0} active students, expired ${toExpire.length}`,
    );
  },
});
