"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  activateLicense,
  ChariowError,
  createCheckoutSession,
  getLicense,
} from "@/lib/chariow/client";
import { CHARIOW_PLANS, type PlanId } from "@/lib/chariow/plans";
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

const purchaseFormSchema = z.object({
  planId: z.enum(["30j", "90j"]),
  firstName: z.string().trim().min(1, "Prénom requis.").max(50),
  lastName: z.string().trim().min(1, "Nom requis.").max(50),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Code pays invalide (ex. CI, FR, SN)."),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{6,15}$/, "Numéro de téléphone invalide (chiffres uniquement)."),
});

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

export async function createCheckoutSessionAction(
  rawForm: {
    planId: PlanId;
    firstName: string;
    lastName: string;
    countryCode: string;
    phoneNumber: string;
  },
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: GENERIC_ERROR };

  const student = await ensureStudent();
  if (!student) return { ok: false, error: GENERIC_ERROR };

  const parsed = purchaseFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const plan = CHARIOW_PLANS.find((p) => p.id === parsed.data.planId);
  if (!plan) return { ok: false, error: GENERIC_ERROR };

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return { ok: false, error: GENERIC_ERROR };

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckoutSession({
      product_id: plan.productId,
      email,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: {
        number: parsed.data.phoneNumber,
        country_code: parsed.data.countryCode,
      },
      custom_metadata: { student_id: student.id },
      redirect_url: `${appUrl}/activation?checkout=success`,
    });

    if (session.step === "already_purchased") {
      return {
        ok: false,
        error: session.message ?? "Vous avez déjà acheté ce plan.",
      };
    }
    if (session.step === "payment" && session.payment?.checkout_url) {
      checkoutUrl = session.payment.checkout_url;
    } else if (session.step === "completed") {
      checkoutUrl = `${appUrl}/activation?checkout=success`;
    } else {
      return { ok: false, error: GENERIC_ERROR };
    }
  } catch (error) {
    console.error("createCheckoutSessionAction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  // redirect() throws internally — must run outside the try/catch above so
  // its control-flow signal isn't swallowed by our own error handling.
  redirect(checkoutUrl);
}
