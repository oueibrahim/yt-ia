// Extracts the assistant name (e.g. "FORGEBOT") from a generated Prompt B.
// Client-safe pure helper.
export function extractAssistantName(content: string): string | null {
  const match = content.slice(0, 400).match(/([A-ZÀ-Ü][A-ZÀ-Ü0-9]{1,30}BOT)/);
  return match ? match[1] : null;
}
