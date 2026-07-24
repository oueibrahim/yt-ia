import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { ConversationRow, MessageCommand, MessageRow } from "./types";

const MAX_TITLE_LENGTH = 60;

export function deriveConversationTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/^\/(script|short)\s*/i, "");
  const title = trimmed.length > 0 ? trimmed : "Nouvelle conversation";
  return title.length > MAX_TITLE_LENGTH
    ? `${title.slice(0, MAX_TITLE_LENGTH)}…`
    : title;
}

export async function getConversations(
  studentId: string,
): Promise<ConversationRow[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getConversations failed: ${error.message}`);
  return data ?? [];
}

// Verifies the conversation belongs to the given student before returning it.
export async function getOwnedConversation(
  conversationId: string,
  studentId: string,
): Promise<ConversationRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw new Error(`getOwnedConversation failed: ${error.message}`);
  return data;
}

export async function createConversation(
  studentId: string,
): Promise<ConversationRow> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ student_id: studentId, title: "Nouvelle conversation" })
    .select()
    .single();
  if (error) throw new Error(`createConversation failed: ${error.message}`);
  return data;
}

// Scoped to student_id as a self-contained safety net, even though every
// current call site already verifies ownership via getOwnedConversation.
export async function renameConversation(
  conversationId: string,
  studentId: string,
  title: string,
): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("student_id", studentId);
  if (error) throw new Error(`renameConversation failed: ${error.message}`);
}

export async function getMessages(
  conversationId: string,
): Promise<MessageRow[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getMessages failed: ${error.message}`);
  return data ?? [];
}

// Fetches every assistant message with a command (for the history page),
// scoped to the student's own conversations.
export async function getStudentProductions(
  studentId: string,
): Promise<Array<MessageRow & { conversation_title: string }>> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("messages")
    .select("*, conversations!inner(student_id, title)")
    .eq("conversations.student_id", studentId)
    .eq("role", "assistant")
    .not("command", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getStudentProductions failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const { conversations, ...message } = row as MessageRow & {
      conversations: { student_id: string; title: string };
    };
    return { ...message, conversation_title: conversations.title };
  });
}

export async function saveMessagePair(params: {
  conversationId: string;
  command: MessageCommand | null;
  userContent: string;
  assistantContent: string;
  tokensIn: number;
  tokensOut: number;
}): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("messages").insert([
    {
      conversation_id: params.conversationId,
      role: "user",
      command: params.command,
      content: params.userContent,
      tokens_in: 0,
      tokens_out: 0,
    },
    {
      conversation_id: params.conversationId,
      role: "assistant",
      command: params.command,
      content: params.assistantContent,
      tokens_in: params.tokensIn,
      tokens_out: params.tokensOut,
    },
  ]);
  if (error) throw new Error(`saveMessagePair failed: ${error.message}`);
}

export async function countMonthlyChatUsage(
  studentId: string,
): Promise<number> {
  const supabase = getSupabaseServer();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("kind", "chat")
    .gte("created_at", startOfMonth.toISOString());
  if (error) throw new Error(`countMonthlyChatUsage failed: ${error.message}`);
  return count ?? 0;
}
