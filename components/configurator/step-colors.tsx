import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  ColorsAnswer,
  NichePalette,
  PaletteSuggestion,
} from "@/lib/configurator-types";

type StepColorsProps = {
  value: ColorsAnswer;
  palettes: NichePalette[];
  aiSuggestion: PaletteSuggestion | null;
  suggesting: boolean;
  onChange: (value: ColorsAnswer) => void;
  onSuggest: () => void;
};

export function StepColors({
  value,
  palettes,
  aiSuggestion,
  suggesting,
  onChange,
  onSuggest,
}: StepColorsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fg">Palettes de la niche</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {palettes.map((palette) => {
            const isSelected = value.paletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onChange({
                    paletteId: palette.id,
                    primary: palette.primary,
                    secondary: palette.secondary,
                  })
                }
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-fg-subtle",
                )}
              >
                <div className="flex h-10 overflow-hidden rounded-md">
                  <span
                    className="flex-1"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    className="flex-1"
                    style={{ backgroundColor: palette.secondary }}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isSelected ? "font-medium text-accent" : "text-fg-muted",
                  )}
                >
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          onClick={onSuggest}
          loading={suggesting}
          disabled={suggesting}
        >
          Proposer une palette (IA)
        </Button>
        {aiSuggestion && (
          <button
            type="button"
            onClick={() =>
              onChange({
                paletteId: null,
                primary: aiSuggestion.primary,
                secondary: aiSuggestion.secondary,
                neutral: aiSuggestion.neutral,
              })
            }
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
              value.primary === aiSuggestion.primary &&
                value.secondary === aiSuggestion.secondary
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-fg-subtle",
            )}
          >
            <div className="flex h-10 w-full max-w-60 overflow-hidden rounded-md">
              <span
                className="flex-1"
                style={{ backgroundColor: aiSuggestion.primary }}
              />
              <span
                className="flex-1"
                style={{ backgroundColor: aiSuggestion.secondary }}
              />
              <span
                className="flex-1"
                style={{ backgroundColor: aiSuggestion.neutral }}
              />
            </div>
            <span className="text-xs text-fg-muted">
              {aiSuggestion.rationale}
            </span>
            <span className="font-mono text-xs text-fg-subtle">
              {aiSuggestion.primary} · {aiSuggestion.secondary} ·{" "}
              {aiSuggestion.neutral}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-fg">Ou personnalisez</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Couleur principale" htmlFor="color-primary">
            <Input
              id="color-primary"
              value={value.primary}
              onChange={(event) =>
                onChange({ ...value, paletteId: null, primary: event.target.value })
              }
              placeholder="#FF4D2E"
              maxLength={7}
            />
          </Field>
          <Field label="Couleur secondaire" htmlFor="color-secondary">
            <Input
              id="color-secondary"
              value={value.secondary}
              onChange={(event) =>
                onChange({
                  ...value,
                  paletteId: null,
                  secondary: event.target.value,
                })
              }
              placeholder="#1D1D26"
              maxLength={7}
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-fg-subtle">Aperçu :</span>
          <div className="flex h-8 w-40 overflow-hidden rounded-md border border-border">
            <span className="flex-1" style={{ backgroundColor: value.primary }} />
            <span
              className="flex-1"
              style={{ backgroundColor: value.secondary }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
