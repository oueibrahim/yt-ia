"use client";

import { useState } from "react";
import { Button, StepIndicator } from "@/components/ui";
import { mockNicheContent } from "@/lib/mock/data";
import type { ConfiguratorAnswers } from "@/lib/mock/types";
import { StepTarget } from "./step-target";
import { StepChannelName } from "./step-channel-name";
import { StepColors } from "./step-colors";
import { StepVisual } from "./step-visual";
import { StepSummary } from "./step-summary";

const stepLabels = ["Cible", "Nom", "Couleurs", "Avatar", "Bannière"];
const summaryStep = stepLabels.length;

const initialAnswers: ConfiguratorAnswers = {
  target: "",
  channelName: "",
  colors: { paletteId: null, primary: "", secondary: "" },
  avatar: { description: "", styles: [] },
  banner: { description: "", styles: [] },
};

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isStepValid(step: number, answers: ConfiguratorAnswers): boolean {
  switch (step) {
    case 0:
      return answers.target.trim().length > 0;
    case 1:
      return answers.channelName.trim().length > 0;
    case 2:
      return (
        HEX_PATTERN.test(answers.colors.primary) &&
        HEX_PATTERN.test(answers.colors.secondary)
      );
    case 3:
      return answers.avatar.description.trim().length > 0;
    case 4:
      return answers.banner.description.trim().length > 0;
    default:
      return true;
  }
}

const stepDescriptions = [
  "Définissez précisément à qui parle votre chaîne.",
  "Choisissez le nom que verra votre audience.",
  "Sélectionnez l'identité visuelle de votre chaîne.",
  "Décrivez l'avatar qui vous représentera.",
  "Décrivez la bannière de votre chaîne.",
  "Vérifiez vos réponses avant de générer votre assistant.",
];

export function ConfiguratorFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<ConfiguratorAnswers>(initialAnswers);
  const [editingFromSummary, setEditingFromSummary] = useState(false);

  const isSummary = currentStep === summaryStep;
  const canGoNext = isStepValid(currentStep, answers);

  function editStep(stepIndex: number) {
    setEditingFromSummary(true);
    setCurrentStep(stepIndex);
  }

  function goPrevious() {
    setEditingFromSummary(false);
    setCurrentStep((step) => step - 1);
  }

  function goNext() {
    if (editingFromSummary) {
      setEditingFromSummary(false);
      setCurrentStep(summaryStep);
    } else {
      setCurrentStep((step) => step + 1);
    }
  }

  function update<K extends keyof ConfiguratorAnswers>(
    key: K,
    value: ConfiguratorAnswers[K],
  ) {
    setAnswers((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Configurateur</h1>
        <StepIndicator steps={stepLabels} current={currentStep} />
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">
            {stepDescriptions[currentStep]}
          </p>
          <span className="text-xs text-fg-subtle">
            Enregistrement automatique
          </span>
        </div>
      </header>

      <div>
        {currentStep === 0 && (
          <StepTarget
            value={answers.target}
            examples={mockNicheContent.targetExamples}
            onChange={(value) => update("target", value)}
          />
        )}
        {currentStep === 1 && (
          <StepChannelName
            value={answers.channelName}
            onChange={(value) => update("channelName", value)}
          />
        )}
        {currentStep === 2 && (
          <StepColors
            value={answers.colors}
            palettes={mockNicheContent.palettes}
            onChange={(value) => update("colors", value)}
          />
        )}
        {currentStep === 3 && (
          <StepVisual
            idPrefix="avatar"
            label="Décrivez votre avatar"
            hint="L'apparence, l'attitude, l'ambiance — votre assistant s'en servira."
            placeholder="Ex. Coach athlétique et souriant, la trentaine, tenue de sport moderne…"
            stylesLabel="Styles suggérés"
            styleOptions={mockNicheContent.avatarStyles}
            value={answers.avatar}
            onChange={(value) => update("avatar", value)}
          />
        )}
        {currentStep === 4 && (
          <StepVisual
            idPrefix="banner"
            label="Décrivez votre bannière"
            hint="Le décor et l'ambiance qui représenteront votre chaîne."
            placeholder="Ex. Salle de sport moderne aux lumières rouge et orange…"
            stylesLabel="Ambiances suggérées"
            styleOptions={mockNicheContent.bannerStyles}
            value={answers.banner}
            onChange={(value) => update("banner", value)}
          />
        )}
        {isSummary && <StepSummary answers={answers} onEdit={editStep} />}
      </div>

      {!isSummary && (
        <footer className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={goPrevious}
            disabled={currentStep === 0}
          >
            Précédent
          </Button>
          <Button onClick={goNext} disabled={!canGoNext}>
            {editingFromSummary || currentStep === summaryStep - 1
              ? "Voir le récapitulatif"
              : "Suivant"}
          </Button>
        </footer>
      )}
    </div>
  );
}
