import Link from "next/link";
import { Alert, Button, Card } from "@/components/ui";
import type { ConfiguratorAnswers } from "@/lib/configurator-types";

export type AssistantInfo = {
  version: number;
  name: string | null;
};

type StepSummaryProps = {
  answers: ConfiguratorAnswers;
  completed: boolean;
  completing: boolean;
  assistant: AssistantInfo | null;
  generating: boolean;
  onEdit: (stepIndex: number) => void;
  onComplete: () => void;
  onGenerate: () => void;
};

type SummarySection =
  | { kind: "text"; title: string; stepIndex: number; content: string }
  | { kind: "colors"; title: string; stepIndex: number };

export function StepSummary({
  answers,
  completed,
  completing,
  assistant,
  generating,
  onEdit,
  onComplete,
  onGenerate,
}: StepSummaryProps) {
  function handleGenerate() {
    if (
      assistant &&
      !window.confirm(
        "Régénérer votre assistant créera une nouvelle version (persona et tagline différentes). Continuer ?",
      )
    ) {
      return;
    }
    onGenerate();
  }
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
      {completed && !assistant && !generating && (
        <Alert variant="success" title="Configuration terminée">
          Vos réponses sont enregistrées. Vous pouvez maintenant générer votre
          assistant personnalisé.
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
        {!completed ? (
          <>
            <Button
              variant="primary"
              onClick={onComplete}
              loading={completing}
              disabled={completing}
            >
              Terminer la configuration
            </Button>
            <Button variant="cta" disabled>
              Générer mon assistant
            </Button>
            <p className="text-xs text-fg-subtle">
              Terminez d&apos;abord la configuration — votre assistant sera
              généré à partir de ces réponses.
            </p>
          </>
        ) : generating ? (
          <>
            <Button variant="cta" loading disabled>
              Génération en cours…
            </Button>
            <p className="text-xs text-fg-subtle">
              Votre assistant est en cours de création, cela prend environ une
              minute. Vous pouvez rester sur cette page.
            </p>
          </>
        ) : assistant ? (
          <>
            <p className="text-lg font-semibold text-fg">
              🎉 Votre assistant {assistant.name ?? "personnalisé"} est prêt
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/chat">
                <Button variant="cta">Ouvrir mon assistant</Button>
              </Link>
              <Button variant="secondary" onClick={handleGenerate}>
                Régénérer mon assistant
              </Button>
            </div>
            <p className="text-xs text-fg-subtle">
              Version {assistant.version} — l&apos;espace de chat sera branché
              très bientôt.
            </p>
          </>
        ) : (
          <>
            <Button variant="cta" onClick={handleGenerate}>
              Générer mon assistant
            </Button>
            <p className="text-xs text-fg-subtle">
              Votre assistant personnalisé sera généré à partir de ces réponses.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
