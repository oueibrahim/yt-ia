"use client";

import { useState } from "react";
import { Alert, Button, StepIndicator } from "@/components/ui";
import type {
  ConfiguratorAnswers,
  ConfiguratorNicheContent,
  ImagePrompt,
  NameSuggestion,
  PaletteSuggestion,
} from "@/lib/configurator-types";
import {
  completeConfiguration,
  saveAvatar,
  saveBanner,
  saveChannelName,
  saveColors,
  saveTarget,
  suggestChannelNames,
  suggestPalette,
} from "@/app/(app)/configurateur/actions";
import { StepTarget, type TargetDraft } from "./step-target";
import { StepChannelName } from "./step-channel-name";
import { StepColors } from "./step-colors";
import { StepVisual, type VisualDraft } from "./step-visual";
import { StepSummary } from "./step-summary";

const stepLabels = ["Cible", "Nom", "Couleurs", "Avatar", "Bannière"];
const summaryStep = stepLabels.length;
const stepNames = ["target", "channel_name", "colors", "avatar", "banner"];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const stepDescriptions = [
  "Définissez précisément à qui parle votre chaîne.",
  "Choisissez le nom que verra votre audience.",
  "Sélectionnez l'identité visuelle de votre chaîne.",
  "Décrivez l'avatar qui vous représentera.",
  "Décrivez la bannière de votre chaîne.",
  "Vérifiez vos réponses avant de générer votre assistant.",
];

type ConfiguratorFlowProps = {
  initialAnswers: ConfiguratorAnswers;
  initialStep: string;
  initialCompleted: boolean;
  niche: ConfiguratorNicheContent;
};

function initialStepIndex(step: string, completed: boolean): number {
  if (completed) return summaryStep;
  const index = stepNames.indexOf(step);
  if (index >= 0) return index;
  return summaryStep;
}

export function ConfiguratorFlow({
  initialAnswers,
  initialStep,
  initialCompleted,
  niche,
}: ConfiguratorFlowProps) {
  const [answers, setAnswers] = useState<ConfiguratorAnswers>(initialAnswers);
  const [currentStep, setCurrentStep] = useState(() =>
    initialStepIndex(initialStep, initialCompleted),
  );
  const [completed, setCompleted] = useState(initialCompleted);
  const [editingFromSummary, setEditingFromSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-step drafts, hydrated from saved answers
  const [targetDraft, setTargetDraft] = useState<TargetDraft>({
    gender: initialAnswers.target?.gender ?? null,
    ageRange: initialAnswers.target?.ageRange ?? "",
    pain: initialAnswers.target?.pain ?? "",
  });
  const [nameDraft, setNameDraft] = useState(
    initialAnswers.channel_name?.name ?? "",
  );
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [suggestingNames, setSuggestingNames] = useState(false);
  const [colorsDraft, setColorsDraft] = useState(
    initialAnswers.colors ?? { paletteId: null, primary: "", secondary: "" },
  );
  const [paletteSuggestion, setPaletteSuggestion] =
    useState<PaletteSuggestion | null>(null);
  const [suggestingPalette, setSuggestingPalette] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<VisualDraft>({
    description: initialAnswers.avatar?.description ?? "",
    styles: initialAnswers.avatar?.styles ?? [],
  });
  const [avatarPrompts, setAvatarPrompts] = useState<ImagePrompt[] | null>(
    initialAnswers.avatar?.imagePrompts ?? null,
  );
  const [bannerDraft, setBannerDraft] = useState<VisualDraft>({
    description: initialAnswers.banner?.description ?? "",
    styles: initialAnswers.banner?.styles ?? [],
  });
  const [bannerPrompt, setBannerPrompt] = useState<string | null>(
    initialAnswers.banner?.imagePrompt ?? null,
  );

  const isSummary = currentStep === summaryStep;

  const canGoNext = (() => {
    switch (currentStep) {
      case 0:
        return (
          targetDraft.gender !== null &&
          targetDraft.ageRange.trim().length > 0 &&
          targetDraft.pain.trim().length >= 5
        );
      case 1:
        return nameDraft.trim().length >= 2;
      case 2:
        return (
          HEX_PATTERN.test(colorsDraft.primary) &&
          HEX_PATTERN.test(colorsDraft.secondary)
        );
      case 3:
        return avatarDraft.description.trim().length >= 5;
      case 4:
        return bannerDraft.description.trim().length >= 5;
      default:
        return true;
    }
  })();

  function advance() {
    if (editingFromSummary) {
      setEditingFromSummary(false);
      setCurrentStep(summaryStep);
    } else {
      setCurrentStep((step) => step + 1);
    }
  }

  async function goNext() {
    setError(null);
    setSaving(true);
    try {
      switch (currentStep) {
        case 0: {
          const result = await saveTarget(targetDraft);
          if (!result.ok) return setError(result.error);
          setAnswers((prev) => ({ ...prev, target: result.data }));
          advance();
          break;
        }
        case 1: {
          const result = await saveChannelName({ name: nameDraft.trim() });
          if (!result.ok) return setError(result.error);
          setAnswers((prev) => ({
            ...prev,
            channel_name: { name: nameDraft.trim() },
          }));
          advance();
          break;
        }
        case 2: {
          const payload = {
            paletteId: colorsDraft.paletteId ?? null,
            primary: colorsDraft.primary,
            secondary: colorsDraft.secondary,
            ...(colorsDraft.neutral ? { neutral: colorsDraft.neutral } : {}),
          };
          const result = await saveColors(payload);
          if (!result.ok) return setError(result.error);
          setAnswers((prev) => ({ ...prev, colors: payload }));
          advance();
          break;
        }
        case 3: {
          if (avatarPrompts) {
            advance();
            break;
          }
          const result = await saveAvatar(avatarDraft);
          if (!result.ok) return setError(result.error);
          setAvatarPrompts(result.data);
          setAnswers((prev) => ({
            ...prev,
            avatar: { ...avatarDraft, imagePrompts: result.data },
          }));
          break;
        }
        case 4: {
          if (bannerPrompt) {
            advance();
            break;
          }
          const result = await saveBanner(bannerDraft);
          if (!result.ok) return setError(result.error);
          setBannerPrompt(result.data);
          setAnswers((prev) => ({
            ...prev,
            banner: { ...bannerDraft, imagePrompt: result.data },
          }));
          break;
        }
      }
    } finally {
      setSaving(false);
    }
  }

  function goPrevious() {
    setError(null);
    setEditingFromSummary(false);
    setCurrentStep((step) => step - 1);
  }

  async function handleSuggestNames() {
    setError(null);
    setSuggestingNames(true);
    try {
      const result = await suggestChannelNames();
      if (!result.ok) return setError(result.error);
      setNameSuggestions(result.data);
    } finally {
      setSuggestingNames(false);
    }
  }

  async function handleSuggestPalette() {
    setError(null);
    setSuggestingPalette(true);
    try {
      const result = await suggestPalette();
      if (!result.ok) return setError(result.error);
      setPaletteSuggestion(result.data);
    } finally {
      setSuggestingPalette(false);
    }
  }

  async function handleComplete() {
    setError(null);
    setCompleting(true);
    try {
      const result = await completeConfiguration();
      if (!result.ok) return setError(result.error);
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  }

  const nextLabel = (() => {
    if (currentStep === 3 && !avatarPrompts) return "Générer mes prompts d'avatar";
    if (currentStep === 4 && !bannerPrompt) return "Générer mon prompt de bannière";
    if (editingFromSummary || currentStep === summaryStep - 1) {
      return "Voir le récapitulatif";
    }
    return "Suivant";
  })();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Configurateur</h1>
        <StepIndicator steps={stepLabels} current={currentStep} />
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">{stepDescriptions[currentStep]}</p>
          <span className="text-xs text-fg-subtle">
            {saving ? "Enregistrement…" : "Enregistrement automatique"}
          </span>
        </div>
      </header>

      {error && (
        <Alert variant="danger" title="Erreur">
          {error}
        </Alert>
      )}

      <div>
        {currentStep === 0 && (
          <StepTarget
            value={targetDraft}
            examples={niche.targetExamples}
            onChange={setTargetDraft}
          />
        )}
        {currentStep === 1 && (
          <StepChannelName
            value={nameDraft}
            targetSummary={answers.target?.summary ?? null}
            suggestions={nameSuggestions}
            suggesting={suggestingNames}
            onChange={setNameDraft}
            onSuggest={handleSuggestNames}
          />
        )}
        {currentStep === 2 && (
          <StepColors
            value={colorsDraft}
            palettes={niche.palettes}
            aiSuggestion={paletteSuggestion}
            suggesting={suggestingPalette}
            onChange={setColorsDraft}
            onSuggest={handleSuggestPalette}
          />
        )}
        {currentStep === 3 && (
          <StepVisual
            idPrefix="avatar"
            label="Décrivez votre avatar"
            hint="L'apparence, l'attitude, l'ambiance — l'IA générera 3 prompts d'image prêts à l'emploi."
            placeholder="Ex. Coach athlétique masqué, tenue rouge-orangé, style super-héros…"
            stylesLabel="Styles suggérés"
            styleOptions={niche.avatarStyles}
            value={avatarDraft}
            imagePrompts={avatarPrompts}
            onChange={(value) => {
              setAvatarDraft(value);
              setAvatarPrompts(null);
            }}
          />
        )}
        {currentStep === 4 && (
          <StepVisual
            idPrefix="banner"
            label="Décrivez votre bannière"
            hint="Le décor et l'ambiance — l'IA générera le prompt d'image de votre bannière."
            placeholder="Ex. Salle de sport moderne aux lumières rouge et orange…"
            stylesLabel="Ambiances suggérées"
            styleOptions={niche.bannerStyles}
            value={bannerDraft}
            imagePrompts={bannerPrompt ? [{ title: "Prompt de bannière", prompt: bannerPrompt }] : null}
            onChange={(value) => {
              setBannerDraft(value);
              setBannerPrompt(null);
            }}
          />
        )}
        {isSummary && (
          <StepSummary
            answers={answers}
            completed={completed}
            completing={completing}
            onEdit={(stepIndex) => {
              setEditingFromSummary(true);
              setCurrentStep(stepIndex);
            }}
            onComplete={handleComplete}
          />
        )}
      </div>

      {!isSummary && (
        <footer className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={goPrevious}
            disabled={currentStep === 0 || saving}
          >
            Précédent
          </Button>
          <Button onClick={goNext} disabled={!canGoNext || saving} loading={saving}>
            {nextLabel}
          </Button>
        </footer>
      )}
    </div>
  );
}
