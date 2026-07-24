import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { UIMessage } from "ai";
import { ChatView } from "@/components/chat/chat-view";
import { extractAssistantName } from "@/lib/assistant-name";
import { getFormationForStudent } from "@/lib/db/formations";
import {
  countMonthlyChatUsage,
  getConversations,
  getMessages,
} from "@/lib/db/messages";
import { getActivePromptB } from "@/lib/db/prompt-b";
import { getStudentByClerkId } from "@/lib/db/students";
import type { MessageRow } from "@/lib/db/types";

function toUIMessage(message: MessageRow): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const student = await getStudentByClerkId(user.id);
  if (!student) redirect("/sign-in");

  const [conversations, formation, usedThisMonth, promptB] = await Promise.all([
    getConversations(student.id),
    getFormationForStudent(student.id),
    countMonthlyChatUsage(student.id),
    getActivePromptB(student.id),
  ]);

  const requestedId = (await searchParams).conversation;
  const activeConversation =
    conversations.find((c) => c.id === requestedId) ?? conversations[0] ?? null;
  const initialMessages = activeConversation
    ? (await getMessages(activeConversation.id)).map(toUIMessage)
    : [];

  return (
    <ChatView
      conversations={conversations}
      initialConversationId={activeConversation?.id ?? null}
      initialMessages={initialMessages}
      quota={{ used: usedThisMonth, limit: formation.monthly_message_quota }}
      assistantName={promptB ? extractAssistantName(promptB.content) : null}
      hasActiveAssistant={promptB !== null}
      studentActive={student.status === "active"}
    />
  );
}
