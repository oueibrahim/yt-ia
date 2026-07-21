import { Badge, Button, Card } from "@/components/ui";
import type { AdminStudentRow, StudentStatus } from "@/lib/mock/types";

type StudentsTableProps = {
  students: AdminStudentRow[];
  monthlyQuota: number;
};

const statusLabels: Record<StudentStatus, string> = {
  active: "Actif",
  pending_license: "En attente",
  expired: "Expiré",
  suspended: "Suspendu",
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

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

function StudentActions({ status }: { status: StudentStatus }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "active" && (
        <Button size="sm" variant="danger" disabled title="Bientôt disponible">
          Suspendre
        </Button>
      )}
      {status === "suspended" && (
        <Button size="sm" variant="secondary" disabled title="Bientôt disponible">
          Réactiver
        </Button>
      )}
      {(status === "active" || status === "expired") && (
        <>
          <Button size="sm" variant="secondary" disabled title="Bientôt disponible">
            Prolonger
          </Button>
          <Button size="sm" variant="ghost" disabled title="Bientôt disponible">
            Révoquer
          </Button>
        </>
      )}
    </div>
  );
}

export function StudentsTable({ students, monthlyQuota }: StudentsTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Liste des élèves de la formation</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-subtle uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Élève</th>
              <th scope="col" className="px-4 py-3 font-medium">Statut</th>
              <th scope="col" className="px-4 py-3 font-medium">Configurateur</th>
              <th scope="col" className="px-4 py-3 font-medium">Dernière activité</th>
              <th scope="col" className="px-4 py-3 font-medium">Conso</th>
              <th scope="col" className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-fg">{student.name}</p>
                  <p className="text-xs text-fg-subtle">{student.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariants[student.status]}>
                    {statusLabels[student.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {student.configuratorStep}
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {dateFormatter.format(new Date(student.lastActivity))}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {student.messagesUsed} / {monthlyQuota}
                </td>
                <td className="px-4 py-3">
                  <StudentActions status={student.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <Card key={student.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-fg">{student.name}</p>
                <p className="text-xs text-fg-subtle">{student.email}</p>
              </div>
              <Badge variant={statusBadgeVariants[student.status]}>
                {statusLabels[student.status]}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-muted">
              <dt className="text-fg-subtle">Configurateur</dt>
              <dd>{student.configuratorStep}</dd>
              <dt className="text-fg-subtle">Dernière activité</dt>
              <dd>{dateFormatter.format(new Date(student.lastActivity))}</dd>
              <dt className="text-fg-subtle">Conso</dt>
              <dd className="font-mono">
                {student.messagesUsed} / {monthlyQuota}
              </dd>
            </dl>
            <StudentActions status={student.status} />
          </Card>
        ))}
      </div>
    </>
  );
}
