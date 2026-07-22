import { Alert, Badge, Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { NameSuggestion } from "@/lib/configurator-types";

type StepChannelNameProps = {
  value: string;
  targetSummary: string | null;
  suggestions: NameSuggestion[];
  suggesting: boolean;
  onChange: (value: string) => void;
  onSuggest: () => void;
};

const angleLabels: Record<NameSuggestion["angle"], string> = {
  identite: "Identité",
  promesse: "Promesse",
  punchy: "Punchy",
};

export function StepChannelName({
  value,
  targetSummary,
  suggestions,
  suggesting,
  onChange,
  onSuggest,
}: StepChannelNameProps) {
  return (
    <div className="flex flex-col gap-5">
      {targetSummary && (
        <Alert variant="info" title="Ta cible">
          {targetSummary}
        </Alert>
      )}

      <Field
        label="Nom de votre chaîne"
        htmlFor="channel-name"
        hint="Court et mémorisable — 1 à 3 mots maximum."
      >
        <Input
          id="channel-name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex. FORGE"
          maxLength={50}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          onClick={onSuggest}
          loading={suggesting}
          disabled={suggesting}
        >
          Proposer 6 noms
        </Button>
        {suggestions.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => onChange(suggestion.name)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                  value === suggestion.name
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-fg-subtle",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-fg">
                    {suggestion.name}
                  </span>
                  <Badge variant="neutral">{angleLabels[suggestion.angle]}</Badge>
                </span>
                <span className="text-xs text-fg-muted">
                  {suggestion.justification}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
