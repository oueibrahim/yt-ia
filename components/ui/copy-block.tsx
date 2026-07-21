"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CopyBlockProps = {
  content: string;
  label?: string;
  className?: string;
};

export function CopyBlock({ content, label, className }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface-raised",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-fg-muted">
          {label ?? "Prompt"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            copied
              ? "bg-success/15 text-success"
              : "bg-surface text-fg-muted hover:text-fg",
          )}
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg-muted whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
