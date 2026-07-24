"use client";

import { useState } from "react";
import { Button, Chip, Textarea } from "@/components/ui";
import type { MessageCommand } from "@/lib/chat-command";

const commands: MessageCommand[] = ["script", "short"];

type ChatInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (text: string) => void;
};

export function ChatInput({
  disabled = false,
  placeholder,
  onSend,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  function prefixCommand(command: MessageCommand) {
    const stripped = value.replace(/^\/(script|short)\s*/i, "");
    setValue(`/${command} ${stripped}`);
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {commands.map((command) => (
          <Chip
            key={command}
            selected={value.toLowerCase().startsWith(`/${command}`)}
            onSelect={() => prefixCommand(command)}
            className={disabled ? "pointer-events-none opacity-50" : undefined}
          >
            /{command}
          </Chip>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            placeholder ??
            "Ex. /script Le sujet de votre prochaine vidéo…"
          }
          rows={2}
          disabled={disabled}
          className="min-h-14"
        />
        <Button onClick={handleSubmit} disabled={disabled || value.trim().length === 0}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}
