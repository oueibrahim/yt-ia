import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Badge, Button, Card } from "@/components/ui";
import { getStudentProductions } from "@/lib/db/messages";
import { getStudentByClerkId } from "@/lib/db/students";
import type { MessageRow } from "@/lib/db/types";

const DAY_MS = 1000 * 60 * 60 * 24;

type Production = MessageRow & { conversation_title: string };

type HistoryGroup = {
  label: string;
  items: Production[];
};

function groupByDate(productions: Production[]): HistoryGroup[] {
  const now = new Date();
  const today: Production[] = [];
  const thisWeek: Production[] = [];
  const older: Production[] = [];

  for (const production of productions) {
    const ageDays =
      (now.getTime() - new Date(production.created_at).getTime()) / DAY_MS;
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

export default async function HistoryPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const student = await getStudentByClerkId(user.id);
  if (!student) redirect("/sign-in");

  const productions = await getStudentProductions(student.id);
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
            {group.items.map((production) => (
              <Card key={production.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-fg">
                      {production.conversation_title}
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
                    href={`/chat?conversation=${production.conversation_id}`}
                    className="text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    Ouvrir la conversation →
                  </Link>
                </div>
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
