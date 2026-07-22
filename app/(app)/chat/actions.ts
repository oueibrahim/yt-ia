"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getFormationForStudent } from "@/lib/db/formations";
import { countMonthlyChatUsage, createConversation } from "@/lib/db/messages";
import { getStudentByClerkId } from "@/lib/db/students";
import type { ConversationRow } from "@/lib/db/types";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GENERIC_ERROR = "Une erreur est survenue. Réessayez.";

export async function createConversationAction(): Promise<
  ActionResult<ConversationRow>
> {
  try {
    const user = await currentUser();
    if (!user) throw new Error("unauthenticated");
    const student = await getStudentByClerkId(user.id);
    if (!student) throw new Error("no student");
    if (student.status !== "active") {
      return { ok: false, error: "Votre licence n'est pas active." };
    }
    const conversation = await createConversation(student.id);
    return { ok: true, data: conversation };
  } catch (error) {
    console.error("createConversationAction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export type QuotaStatus = { used: number; limit: number };

export async function getQuotaStatus(): Promise<ActionResult<QuotaStatus>> {
  try {
    const user = await currentUser();
    if (!user) throw new Error("unauthenticated");
    const student = await getStudentByClerkId(user.id);
    if (!student) throw new Error("no student");
    const formation = await getFormationForStudent(student.id);
    const used = await countMonthlyChatUsage(student.id);
    return { ok: true, data: { used, limit: formation.monthly_message_quota } };
  } catch (error) {
    console.error("getQuotaStatus failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
