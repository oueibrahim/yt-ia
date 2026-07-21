import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/mock/types";

type MessageBubbleProps = {
  message: Message;
  assistantName: string;
};

export function MessageBubble({ message, assistantName }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
      {!isUser && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-accent">
            {assistantName}
          </span>
          {message.command && (
            <Badge variant={message.command === "short" ? "active" : "neutral"}>
              /{message.command}
            </Badge>
          )}
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-surface-raised text-fg"
            : "border border-border bg-surface text-fg-muted",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
