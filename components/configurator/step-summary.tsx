import { Alert, Button, Card } from "@/components/ui";
import type { ConfiguratorAnswers } from "@/lib/configurator-types";

type StepSummaryProps = {
  answers: ConfiguratorAnswers;
  completed: boolean;
  completing: boolean;
  onEdit: (stepIndex: number) => void;
  onComplete: () => void;
};

type SummarySection =
  | { kind: "text"; title: string; stepIndex: number; content: string }
  | { kind: "colors"; title: string; stepIndex: number };

export function StepSummary({
  answers,
  completed,
  completing,
  onEdit,
  onComplete,
}: StepSummaryProps) {
  const sections: SummarySection[] = [
    {
      kind: "text",
      title: "Cible",
      stepIndex: 0,
      content: answers.target?.summary ?? "",
    },
    {
      kind: "text",
      title: "Nom de chaîne",
      stepIndex: 1,
      content: answers.channel_name?.name ?? "",
    },
    { kind: "colors", title: "Couleurs", stepIndex: 2 },
    {
      kind: "text",
      title: "Avatar",
      stepIndex: 3,
      content: [
        answers.avatar?.description,
        answers.avatar?.styles.join(", "),
      ]
        .filter(Boolean)
        .join(" — "),
    },
    {
      kind: "text",
      title: "Bannière",
      stepIndex: 4,
      content: [
        answers.banner?.description,
        answers.banner?.styles.join(", "),
      ]
        .filter(Boolean)
        .join(" — "),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {completed && (
        <Alert variant="success" title="Configuration terminée">
          Vos réponses sont enregistrées. La génération de votre assistant
          arrive très bientôt.
        </Alert>
      )}

      {sections.map((section) =>
        section.kind === "colors" ? (
          <Card key={section.title}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-fg">{section.title}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-28 overflow-hidden rounded-md border border-border">
                    <span
                      className="flex-1"
                      style={{ backgroundColor: answers.colors?.primary }}
                    />
                    <span
                      className="flex-1"
                      style={{ backgroundColor: answers.colors?.secondary }}
                    />
                  </div>
                  <span className="font-mono text-xs text-fg-muted">
                    {answers.colors?.primary} · {answers.colors?.secondary}
                    {answers.colors?.neutral ? ` · ${answers.colors.neutral}` : ""}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(section.stepIndex)}
              >
                Modifier
              </Button>
            </div>
          </Card>
        ) : (
          <Card key={section.title}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-fg">{section.title}</p>
                <p className="text-sm text-fg-muted">{section.content}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(section.stepIndex)}
              >
                Modifier
              </Button>
            </div>
          </Card>
        ),
      )}

      <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 text-center">
        {!completed && (
          <Button
            variant="primary"
            onClick={onComplete}
            loading={completing}
            disabled={completing}
          >
            Terminer la configuration
          </Button>
        )}
        <Button variant="cta" disabled>
          Générer mon assistant
        </Button>
        <p className="text-xs text-fg-subtle">
          Dernière étape en cours de branchement — votre assistant sera généré à
          partir de ces réponses.
        </p>
      </div>
    </div>
  );
}
