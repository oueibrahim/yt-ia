"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Alert } from "@/components/ui";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { QuotaBanner } from "./quota-banner";

type ChatThreadProps = {
  conversationId: string;
  initialMessages: UIMessage[];
  assistantName: string;
  quota: { used: number; limit: number };
};

export function ChatThread({
  conversationId,
  initialMessages,
  assistantName,
  quota,
}: ChatThreadProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // Optimistic bump: quota.used only refreshes once router.refresh()
  // completes after the full response streams in, which lags noticeably
  // behind the user's action. Reset whenever the server value itself moves
  // (adjusted during render, the React-endorsed alternative to an effect).
  const [pendingUsage, setPendingUsage] = useState(0);
  const [syncedUsed, setSyncedUsed] = useState(quota.used);
  if (quota.used !== syncedUsed) {
    setSyncedUsed(quota.used);
    setPendingUsage(0);
  }
  const displayedUsed = quota.used + pendingUsage;
  const isQuotaFull = displayedUsed >= quota.limit;

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => setServerError(error.message),
    // Refreshes server data (conversation title, quota banner) once the
    // assistant reply is fully persisted.
    onFinish: () => router.refresh(),
  });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSend(text: string) {
    setServerError(null);
    setPendingUsage((count) => count + 1);
    sendMessage({ text }, { body: { conversationId } });
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-fg-subtle">
            Écrivez un message, ou utilisez /script ou /short pour générer un
            script.
          </p>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            assistantName={assistantName}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-3">
        {serverError && (
          <Alert variant="danger" title="Erreur">
            {serverError}
          </Alert>
        )}
        <QuotaBanner used={displayedUsed} limit={quota.limit} />
        <ChatInput
          disabled={isBusy || isQuotaFull}
          onSend={handleSend}
        />
      </footer>
    </>
  );
}
