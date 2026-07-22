import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { detectCommand } from "@/lib/chat-command";
import type { UIMessage } from "ai";

type MessageBubbleProps = {
  message: UIMessage;
  assistantName: string;
};

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function MessageBubble({ message, assistantName }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const content = textOf(message);
  const command = isUser ? detectCommand(content) : null;

  return (
    <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
      {!isUser && (
        <span className="text-xs font-semibold text-accent">
          {assistantName}
        </span>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-surface-raised text-fg"
            : "border border-border bg-surface text-fg-muted",
        )}
      >
        {isUser && command && (
          <Badge variant={command === "short" ? "active" : "neutral"} className="mb-1.5">
            /{command}
          </Badge>
        )}
        {content}
      </div>
    </div>
  );
}
