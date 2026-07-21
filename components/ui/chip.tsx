"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  className?: string;
};

export function Chip({ children, selected, onSelect, className }: ChipProps) {
  const [internalSelected, setInternalSelected] = useState(false);
  const isControlled = selected !== undefined;
  const isSelected = isControlled ? selected : internalSelected;

  function handleClick() {
    const next = !isSelected;
    if (!isControlled) setInternalSelected(next);
    onSelect?.(next);
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={handleClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isSelected
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-surface text-fg-muted hover:border-fg-subtle hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}
