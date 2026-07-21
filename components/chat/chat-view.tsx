"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  mockAssistantName,
  mockConversations,
  mockFormation,
  mockMessages,
  mockQuotaUsed,
} from "@/lib/mock/data";
import { ChatInput } from "./chat-input";
import { ConversationList } from "./conversation-list";
import { MessageBubble } from "./message-bubble";
import { QuotaBanner } from "./quota-banner";

type ChatViewProps = {
  quotaFull?: boolean;
};

export function ChatView({ quotaFull = false }: ChatViewProps) {
  const [activeId, setActiveId] = useState(mockConversations[0]?.id ?? "");
  const [mobileShowList, setMobileShowList] = useState(false);

  const quotaUsed = quotaFull
    ? mockFormation.monthlyMessageQuota
    : mockQuotaUsed;
  const isQuotaFull = quotaUsed >= mockFormation.monthlyMessageQuota;

  const activeConversation = mockConversations.find(
    (conversation) => conversation.id === activeId,
  );
  const messages = mockMessages.filter(
    (message) => message.conversationId === activeId,
  );

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowList(false);
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-5xl gap-6 lg:h-[calc(100dvh-4rem)]">
      {/* Liste des conversations — colonne desktop / vue plein écran mobile */}
      <aside
        className={
          mobileShowList
            ? "flex w-full flex-col md:w-64"
            : "hidden w-64 md:flex md:flex-col"
        }
      >
        <ConversationList
          conversations={mockConversations}
          activeId={activeId}
          onSelect={selectConversation}
        />
      </aside>

      {/* Fil de messages */}
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
            {activeConversation?.title ?? "Conversation"}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              assistantName={mockAssistantName}
            />
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border pt-3">
          <QuotaBanner
            used={quotaUsed}
            limit={mockFormation.monthlyMessageQuota}
          />
          <ChatInput key={activeId} disabled={isQuotaFull} />
        </footer>
      </section>
    </div>
  );
}
