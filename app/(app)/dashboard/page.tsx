import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Badge, Card, CardTitle } from "@/components/ui";
import { getActiveLicense, licenseDaysRemaining } from "@/lib/db/licenses";
import { getStudentByClerkId } from "@/lib/db/students";
import type { StudentStatus } from "@/lib/db/types";

const statusLabels: Record<StudentStatus, string> = {
  active: "Licence active",
  pending_license: "Licence en attente d'activation",
  expired: "Licence expirée",
  suspended: "Compte suspendu",
};

const statusBadgeVariants: Record<
  StudentStatus,
  "active" | "pending" | "expired" | "suspended"
> = {
  active: "active",
  pending_license: "pending",
  expired: "expired",
  suspended: "suspended",
};

const shortcuts = [
  {
    title: "Configurateur",
    description:
      "Définissez votre chaîne étape par étape : cible, nom, couleurs, avatar, bannière.",
    href: "/configurateur",
    cta: "Continuer la configuration",
  },
  {
    title: "Assistant",
    description:
      "Générez vos scripts et vos shorts avec votre assistant personnalisé.",
    href: "/chat",
    cta: "Ouvrir l'assistant",
  },
  {
    title: "Historique",
    description: "Retrouvez tous vos scripts générés, classés par date.",
    href: "/historique",
    cta: "Voir l'historique",
  },
];

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const student = await getStudentByClerkId(user.id);
  if (!student) redirect("/sign-in");

  const license = await getActiveLicense(student.id);
  const daysRemaining = license ? licenseDaysRemaining(license) : null;
  const greetingName = user.firstName ?? student.email.split("@")[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Bonjour {greetingName} 👋</h1>
        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariants[student.status]}>
            {statusLabels[student.status]}
          </Badge>
          {daysRemaining !== null && (
            <span className="text-sm text-fg-muted">
              Expire dans {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <Card key={shortcut.href} className="flex flex-col justify-between gap-4">
            <div>
              <CardTitle>{shortcut.title}</CardTitle>
              <p className="text-sm text-fg-muted">{shortcut.description}</p>
            </div>
            <Link
              href={shortcut.href}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {shortcut.cta} →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
