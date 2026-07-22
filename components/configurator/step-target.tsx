import { Chip, Field, Input, Textarea } from "@/components/ui";
import type { TargetGender } from "@/lib/configurator-types";

export type TargetDraft = {
  gender: TargetGender | null;
  ageRange: string;
  pain: string;
};

type StepTargetProps = {
  value: TargetDraft;
  examples: string[];
  onChange: (value: TargetDraft) => void;
};

const genders: Array<{ id: TargetGender; label: string }> = [
  { id: "hommes", label: "Hommes" },
  { id: "femmes", label: "Femmes" },
  { id: "mixte", label: "Mixte" },
];

export function StepTarget({ value, examples, onChange }: StepTargetProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fg">
          Votre chaîne s&apos;adresse à…
        </p>
        <div className="flex gap-2">
          {genders.map((gender) => (
            <Chip
              key={gender.id}
              selected={value.gender === gender.id}
              onSelect={() => onChange({ ...value, gender: gender.id })}
            >
              {gender.label}
            </Chip>
          ))}
        </div>
      </div>

      <Field
        label="Tranche d'âge principale"
        htmlFor="age-range"
        hint="Ex. 25-35 ans"
      >
        <Input
          id="age-range"
          value={value.ageRange}
          onChange={(event) =>
            onChange({ ...value, ageRange: event.target.value })
          }
          placeholder="Ex. 25-35 ans"
          maxLength={30}
        />
      </Field>

      <Field
        label="LA douleur principale de cette personne"
        htmlFor="pain"
        hint="Ex. ventre qui ne part pas, manque de temps, perte de motivation…"
      >
        <Textarea
          id="pain"
          value={value.pain}
          onChange={(event) => onChange({ ...value, pain: event.target.value })}
          placeholder="Décrivez la douleur principale de votre cible…"
          rows={3}
          maxLength={600}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-fg-subtle">
          Exemples pour votre niche :
        </p>
        {examples.map((example) => (
          <p
            key={example}
            className="rounded-md border border-border bg-surface p-3 text-sm text-fg-muted"
          >
            {example}
          </p>
        ))}
      </div>
    </div>
  );
}
