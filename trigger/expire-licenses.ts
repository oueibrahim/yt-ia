import "server-only";

import { schedules } from "@trigger.dev/sdk";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getActiveLicense } from "@/lib/db/licenses";
import { updateStudentStatus } from "@/lib/db/students";

// Safety net for a permanently missed Chariow Pulse (webhook retries give up
// after ~27h). Runs daily: any student marked "active" whose license is no
// longer currently valid (per getActiveLicense — the same check used
// everywhere else) gets flipped to "expired".
export const expireLicenses = schedules.task({
  id: "expire-licenses",
  cron: { pattern: "0 3 * * *", timezone: "UTC" },
  run: async () => {
    const supabase = getSupabaseServer();
    const { data: activeStudents, error } = await supabase
      .from("students")
      .select("id")
      .eq("status", "active");
    if (error) throw new Error(`expire-licenses: query failed: ${error.message}`);

    let expiredCount = 0;
    for (const student of activeStudents ?? []) {
      const license = await getActiveLicense(student.id);
      if (!license) {
        await updateStudentStatus(student.id, "expired");
        expiredCount += 1;
      }
    }

    console.log(
      `expire-licenses: checked ${activeStudents?.length ?? 0} active students, expired ${expiredCount}`,
    );
  },
});
