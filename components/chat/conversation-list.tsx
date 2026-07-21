import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/mock/types";

type ConversationListProps = {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Button variant="secondary" disabled className="w-full">
        + Nouvelle conversation
      </Button>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors",
                isActive
                  ? "bg-accent/10 text-fg"
                  : "text-fg-muted hover:bg-surface-raised hover:text-fg",
              )}
            >
              <span className="truncate text-sm font-medium">
                {conversation.title}
              </span>
              <span className="text-xs text-fg-subtle">
                {dateFormatter.format(new Date(conversation.createdAt))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
