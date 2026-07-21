import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { mockConversations, mockMessages } from "@/lib/mock/data";
import type { Message } from "@/lib/mock/types";

const REFERENCE_NOW = new Date("2026-07-21T12:00:00Z");
const DAY_MS = 1000 * 60 * 60 * 24;

type HistoryGroup = {
  label: string;
  items: Message[];
};

function groupByDate(productions: Message[]): HistoryGroup[] {
  const today: Message[] = [];
  const thisWeek: Message[] = [];
  const older: Message[] = [];

  for (const production of productions) {
    const ageDays =
      (REFERENCE_NOW.getTime() - new Date(production.createdAt).getTime()) /
      DAY_MS;
    if (ageDays < 1) today.push(production);
    else if (ageDays < 7) thisWeek.push(production);
    else older.push(production);
  }

  return [
    { label: "Aujourd'hui", items: today },
    { label: "Cette semaine", items: thisWeek },
    { label: "Plus ancien", items: older },
  ].filter((group) => group.items.length > 0);
}

function excerpt(content: string): string {
  return content.split("\n").filter(Boolean).slice(0, 2).join(" — ");
}

export default function HistoryPage() {
  const productions = mockMessages
    .filter((message) => message.role === "assistant" && message.command)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const groups = groupByDate(productions);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Historique</h1>
        <p className="mt-2 text-fg-muted">
          Tous les scripts et shorts générés par votre assistant.
        </p>
      </header>

      {groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-fg-muted">
            Aucun script généré pour l&apos;instant.
          </p>
          <Link href="/chat">
            <Button variant="cta">Générer mon premier script</Button>
          </Link>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-fg-subtle uppercase">
              {group.label}
            </h2>
            {group.items.map((production) => {
              const conversation = mockConversations.find(
                (item) => item.id === production.conversationId,
              );
              return (
                <Card key={production.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-fg">
                        {conversation?.title ?? "Conversation"}
                      </p>
                      <Badge
                        variant={
                          production.command === "short" ? "active" : "neutral"
                        }
                      >
                        /{production.command}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-fg-muted">
                      {excerpt(production.content)}
                    </p>
                    <Link
                      href="/chat"
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Ouvrir la conversation →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
