import { ChatView } from "@/components/chat/chat-view";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ quota?: string }>;
}) {
  const quotaFull = (await searchParams).quota === "full";
  return <ChatView quotaFull={quotaFull} />;
}
