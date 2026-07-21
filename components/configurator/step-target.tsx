import { Field, Textarea } from "@/components/ui";

type StepTargetProps = {
  value: string;
  examples: string[];
  onChange: (value: string) => void;
};

export function StepTarget({ value, examples, onChange }: StepTargetProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Qui voulez-vous toucher ?"
        htmlFor="target"
        hint="Décrivez votre spectateur idéal : qui il est, sa tranche d'âge, son objectif."
      >
        <Textarea
          id="target"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex. Hommes 25-40 ans qui veulent se remettre au sport…"
          rows={4}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-fg-subtle">
          Exemples pour votre niche — cliquez pour utiliser :
        </p>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            className="rounded-md border border-border bg-surface p-3 text-left text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
