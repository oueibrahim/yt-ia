import { currentUser } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { getModelId } from "@/lib/ai/client";
import { buildCommandReminder } from "@/lib/ai/chat-prompt";
import { detectCommand } from "@/lib/chat-command";
import {
  countMonthlyChatUsage,
  deriveConversationTitle,
  getOwnedConversation,
  renameConversation,
  saveMessagePair,
} from "@/lib/db/messages";
import { getNicheForStudent } from "@/lib/db/niches";
import { getActivePromptB } from "@/lib/db/prompt-b";
import { getStudentByClerkId } from "@/lib/db/students";
import { getFormationForStudent } from "@/lib/db/formations";
import { recordUsageEvent } from "@/lib/db/usage";

export const maxDuration = 60;

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const student = await getStudentByClerkId(user.id);
  if (!student) return new Response("Unauthorized", { status: 401 });

  if (student.status !== "active") {
    return new Response(
      "Votre licence n'est pas active. Le chat est temporairement bloqué.",
      { status: 403 },
    );
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const conversation = await getOwnedConversation(conversationId, student.id);
  if (!conversation) return new Response("Conversation introuvable", { status: 404 });

  const formation = await getFormationForStudent(student.id);
  const usedThisMonth = await countMonthlyChatUsage(student.id);
  if (usedThisMonth >= formation.monthly_message_quota) {
    return new Response(
      "Vous avez atteint votre quota de messages pour ce mois-ci.",
      { status: 403 },
    );
  }

  const promptB = await getActivePromptB(student.id);
  if (!promptB) {
    return new Response(
      "Terminez d'abord votre configurateur pour générer votre assistant.",
      { status: 409 },
    );
  }

  const lastMessage = messages[messages.length - 1];
  const userText = textOf(lastMessage);
  const command = detectCommand(userText);
  const isFirstMessage = messages.length === 1;

  let system = promptB.content;
  if (command) {
    const niche = await getNicheForStudent(student.id);
    system += buildCommandReminder(command, niche);
  }

  const modelId = getModelId();
  const result = streamText({
    model: openai(modelId),
    system,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text, usage }) => {
      // The HTTP response is already streamed to the client by the time this
      // runs — a thrown error here cannot reach the caller. Catch and log
      // explicitly so a DB hiccup doesn't silently drop the persisted data.
      try {
        await saveMessagePair({
          conversationId,
          command,
          userContent: userText,
          assistantContent: text,
          tokensIn: usage.inputTokens ?? 0,
          tokensOut: usage.outputTokens ?? 0,
        });
        if (isFirstMessage) {
          await renameConversation(
            conversationId,
            student.id,
            deriveConversationTitle(userText),
          );
        }
        await recordUsageEvent({
          studentId: student.id,
          kind: "chat",
          model: modelId,
          tokensIn: usage.inputTokens ?? 0,
          tokensOut: usage.outputTokens ?? 0,
        });
      } catch (error) {
        console.error("[chat] onFinish persistence failed:", error);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
