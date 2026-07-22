"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { Alert, Button } from "@/components/ui";
import { createConversationAction } from "@/app/(app)/chat/actions";
import type { ConversationRow } from "@/lib/db/types";
import { ChatThread } from "./chat-thread";
import { ConversationList } from "./conversation-list";

type ChatViewProps = {
  conversations: ConversationRow[];
  initialConversationId: string | null;
  initialMessages: UIMessage[];
  quota: { used: number; limit: number };
  assistantName: string | null;
  hasActiveAssistant: boolean;
  studentActive: boolean;
};

export function ChatView({
  conversations,
  initialConversationId,
  initialMessages,
  quota,
  assistantName,
  hasActiveAssistant,
  studentActive,
}: ChatViewProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(initialConversationId);
  const [mobileShowList, setMobileShowList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowList(false);
    router.replace(`/chat?conversation=${id}`);
  }

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const result = await createConversationAction();
      if (!result.ok) return setError(result.error);
      router.push(`/chat?conversation=${result.data.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  if (!studentActive) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-16">
        <Alert variant="danger" title="Licence inactive">
          Votre licence n&apos;est pas active. Le chat est temporairement
          bloqué — votre historique reste consultable.
        </Alert>
      </div>
    );
  }

  if (!hasActiveAssistant) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-16 text-center">
        <Alert variant="info" title="Assistant non généré">
          Terminez d&apos;abord le configurateur pour générer votre assistant
          personnalisé.
        </Alert>
        <a
          href="/configurateur"
          className="font-medium text-accent hover:text-accent-hover"
        >
          Aller au configurateur →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-5xl gap-6 lg:h-[calc(100dvh-4rem)]">
      <aside
        className={
          mobileShowList
            ? "flex w-full flex-col md:w-64"
            : "hidden w-64 md:flex md:flex-col"
        }
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          creating={creating}
          onSelect={selectConversation}
          onCreate={handleCreate}
        />
      </aside>

      <section
        className={
          mobileShowList
            ? "hidden flex-1 flex-col gap-4 md:flex"
            : "flex flex-1 flex-col gap-4"
        }
      >
        <header className="flex items-center gap-3 border-b border-border pb-3">
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileShowList(true)}
          >
            ← Conversations
          </Button>
          <h1 className="truncate text-lg font-semibold">
            {activeConversation?.title ?? "Nouvelle conversation"}
          </h1>
        </header>

        {error && (
          <Alert variant="danger" title="Erreur">
            {error}
          </Alert>
        )}

        {activeConversation ? (
          <ChatThread
            key={activeConversation.id}
            conversationId={activeConversation.id}
            initialMessages={initialMessages}
            assistantName={assistantName ?? "Assistant"}
            quota={quota}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-fg-muted">
              Créez une conversation pour commencer.
            </p>
            <Button variant="cta" onClick={handleCreate} loading={creating}>
              + Nouvelle conversation
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
