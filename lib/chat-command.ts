// Client-safe (no server imports): detects a /script or /short command
// prefix in a raw message string.

export type MessageCommand = "script" | "short";

export function detectCommand(text: string): MessageCommand | null {
  const match = text.trim().match(/^\/(script|short)\b/i);
  if (!match) return null;
  return match[1].toLowerCase() as MessageCommand;
}
