import { Badge, Button, Card, CardTitle, Field, Input } from "@/components/ui";
import type { Formation, Niche } from "@/lib/mock/types";

type FormationQuotaCardProps = {
  formation: Formation;
  niche: Niche;
};

export function FormationQuotaCard({
  formation,
  niche,
}: FormationQuotaCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="mb-0">{formation.name}</CardTitle>
            <Badge variant="neutral">{niche.name}</Badge>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            Accès de {formation.accessDurationDays} jours par licence.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Field
            label="Quota mensuel (messages)"
            htmlFor="formation-quota"
            className="w-44"
          >
            <Input
              id="formation-quota"
              type="number"
              defaultValue={formation.monthlyMessageQuota}
              disabled
            />
          </Field>
          <Button disabled title="Bientôt disponible">
            Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  );
}
