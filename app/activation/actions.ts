"use server";

import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  activateLicense,
  ChariowError,
  getLicense,
} from "@/lib/chariow/client";
import {
  countRecentActivationAttempts,
  getLicenseByKey,
  linkLicenseToStudent,
  recordActivationAttempt,
  upsertLicenseFromChariow,
} from "@/lib/db/licenses";
import { ensureStudent, updateStudentStatus } from "@/lib/db/students";

type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "Une erreur est survenue. Réessayez.";
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 10;

const licenseKeySchema = z
  .string()
  .trim()
  .min(6, "Clé trop courte.")
  .max(48, "Clé trop longue.")
  .regex(/^[A-Za-z0-9-]+$/, "Format de clé invalide.");

function statusMessage(status: string): string {
  switch (status) {
    case "expired":
      return "Cette licence a expiré.";
    case "revoked":
      return "Cette licence a été révoquée.";
    case "pending_activation":
      return "Cette licence n'a pas pu être activée. Contactez le support.";
    default:
      return "Cette licence n'est pas valide.";
  }
}

export async function activateLicenseAction(
  rawKey: string,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: GENERIC_ERROR };

  const student = await ensureStudent();
  if (!student) return { ok: false, error: GENERIC_ERROR };

  // Anti-abuse guard: rejects before ever calling Chariow's API, whose
  // 100 req/min quota is shared across every student on the platform.
  const attemptCount = await countRecentActivationAttempts(
    student.id,
    ATTEMPT_WINDOW_MINUTES,
  );
  if (attemptCount >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  const parsed = licenseKeySchema.safeParse(rawKey);
  if (!parsed.success) {
    return { ok: false, error: "Format de clé invalide." };
  }
  const licenseKey = parsed.data;

  await recordActivationAttempt(student.id);

  const existing = await getLicenseByKey(licenseKey);
  if (existing?.student_id && existing.student_id !== student.id) {
    return {
      ok: false,
      error: "Cette clé de licence est déjà utilisée sur un autre compte.",
    };
  }

  try {
    // Always read the current Chariow state first (free, no side effect).
    // Only call the mutating activate endpoint when Chariow itself has never
    // activated this key — never based on our own DB state. This way, a
    // retry after our DB write failed (Chariow call already succeeded)
    // re-reads status="active" and skips calling activate a second time,
    // instead of silently consuming another device-activation slot.
    let chariowLicense = await getLicense(licenseKey);
    if (chariowLicense.status === "pending_activation") {
      chariowLicense = await activateLicense(licenseKey, student.id);
    }

    if (chariowLicense.status !== "active") {
      return { ok: false, error: statusMessage(chariowLicense.status) };
    }

    await upsertLicenseFromChariow({
      licenseKey,
      chariowPayload: chariowLicense,
      expiresAt: chariowLicense.expires_at,
    });

    // Guarded write: only succeeds if the row is unlinked or already ours —
    // closes the race where two students both pass the pre-check above with
    // existing=null and both reach this point for the same key.
    const linked = await linkLicenseToStudent({
      licenseKey,
      studentId: student.id,
    });
    if (!linked.ok) {
      return {
        ok: false,
        error: "Cette clé de licence est déjà utilisée sur un autre compte.",
      };
    }

    await updateStudentStatus(student.id, "active");

    return { ok: true };
  } catch (error) {
    if (error instanceof ChariowError && error.status === 404) {
      return { ok: false, error: "Cette clé de licence est invalide." };
    }
    console.error("activateLicenseAction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
