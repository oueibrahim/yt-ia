import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ConversationRow } from "@/lib/db/types";

type ConversationListProps = {
  conversations: ConversationRow[];
  activeId: string | null;
  creating: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function ConversationList({
  conversations,
  activeId,
  creating,
  onSelect,
  onCreate,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Button
        variant="secondary"
        className="w-full"
        onClick={onCreate}
        loading={creating}
        disabled={creating}
      >
        + Nouvelle conversation
      </Button>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="px-3 py-2 text-sm text-fg-subtle">
            Aucune conversation pour l&apos;instant.
          </p>
        )}
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
                {dateFormatter.format(new Date(conversation.created_at))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
