import { NextResponse } from "next/server";
import { getLicense } from "@/lib/chariow/client";
import { getLicenseByKey, upsertLicenseFromChariow } from "@/lib/db/licenses";
import { updateStudentStatus } from "@/lib/db/students";

export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set([
  "license.activated",
  "license.expired",
  "license.revoked",
]);

type ChariowPulsePayload = {
  event?: string;
  license?: { key?: string };
};

// Chariow documents no webhook signature. Mitigation: a shared secret in the
// Pulse URL (checked first) PLUS — the real safeguard — the payload is never
// trusted for state. It only tells us which license to re-check; the actual
// status/expiry always comes from a fresh server-to-server getLicense() call.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token !== process.env.CHARIOW_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as
    | ChariowPulsePayload
    | null;
  const event = payload?.event;
  const licenseKey = payload?.license?.key;

  if (!event || !RELEVANT_EVENTS.has(event) || !licenseKey) {
    // Unrecognized/irrelevant event: 200 avoids pointless Chariow retries.
    return NextResponse.json({ ignored: true });
  }

  try {
    const chariowLicense = await getLicense(licenseKey);

    await upsertLicenseFromChariow({
      licenseKey,
      chariowPayload: chariowLicense,
      expiresAt: chariowLicense.expires_at,
    });

    const localLicense = await getLicenseByKey(licenseKey);
    if (localLicense?.student_id) {
      const nextStatus = chariowLicense.status === "active" ? "active" : "expired";
      await updateStudentStatus(localLicense.student_id, nextStatus);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[chariow webhook] processing failed:", error);
    // Non-2xx so Chariow retries on our own transient failures.
    return new Response("Internal error", { status: 500 });
  }
}
