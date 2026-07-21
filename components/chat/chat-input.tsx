"use client";

import { useState } from "react";
import { Button, Chip, Textarea } from "@/components/ui";
import type { CommandKind } from "@/lib/mock/types";

const commands: CommandKind[] = ["script", "short"];

type ChatInputProps = {
  disabled?: boolean;
};

export function ChatInput({ disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");

  function prefixCommand(command: CommandKind) {
    const stripped = value.replace(/^\/(script|short)\s*/, "");
    setValue(`/${command} ${stripped}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {commands.map((command) => (
          <Chip
            key={command}
            selected={value.startsWith(`/${command}`)}
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
          placeholder={
            disabled
              ? "Quota atteint — revenez le mois prochain."
              : "Ex. /script Le sujet de votre prochaine vidéo…"
          }
          rows={2}
          disabled={disabled}
          className="min-h-14"
        />
        <Button disabled title="Bientôt disponible">
          Envoyer
        </Button>
      </div>
      <p className="text-xs text-fg-subtle">
        L&apos;envoi sera disponible bientôt — votre assistant est en cours de
        branchement.
      </p>
    </div>
  );
}
