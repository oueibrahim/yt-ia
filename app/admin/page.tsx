import { FormationQuotaCard } from "@/components/admin/formation-quota-card";
import { StudentsTable } from "@/components/admin/students-table";
import {
  mockAdminStudents,
  mockFormation,
  mockNiche,
} from "@/lib/mock/data";

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Élèves</h1>
        <p className="mt-2 text-fg-muted">
          Suivi des élèves de la formation, consommation et gestion des accès.
        </p>
      </header>

      <FormationQuotaCard formation={mockFormation} niche={mockNiche} />

      <StudentsTable
        students={mockAdminStudents}
        monthlyQuota={mockFormation.monthlyMessageQuota}
      />
    </div>
  );
}
