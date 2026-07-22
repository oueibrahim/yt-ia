import { Chip, CopyBlock, Field, Textarea } from "@/components/ui";
import type { ImagePrompt } from "@/lib/configurator-types";

export type VisualDraft = {
  description: string;
  styles: string[];
};

type StepVisualProps = {
  idPrefix: "avatar" | "banner";
  label: string;
  hint: string;
  placeholder: string;
  stylesLabel: string;
  styleOptions: string[];
  value: VisualDraft;
  imagePrompts: ImagePrompt[] | null;
  onChange: (value: VisualDraft) => void;
};

const bannerDimensions = [
  "🖼️ Bannière de chaîne : 2560 × 1440 px — zone sûre visible partout : 1546 × 423 px centrée — JPG/PNG < 6 Mo",
  "🎬 Vignette vidéo : 1280 × 720 px (16:9), minimum 640 px de large — JPG/PNG < 2 Mo",
  "▶️ Photo de profil (logo) : 800 × 800 px — JPG/PNG < 4 Mo",
  "🎞️ Générique d'intro : 1920 × 1080 px, 3 à 5 secondes max — avatar + nom de chaîne + tagline",
];

export function StepVisual({
  idPrefix,
  label,
  hint,
  placeholder,
  stylesLabel,
  styleOptions,
  value,
  imagePrompts,
  onChange,
}: StepVisualProps) {
  function toggleStyle(style: string, selected: boolean) {
    const styles = selected
      ? [...value.styles, style]
      : value.styles.filter((item) => item !== style);
    onChange({ ...value, styles });
  }

  return (
    <div className="flex flex-col gap-5">
      {idPrefix === "banner" && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-4">
          <p className="mb-1 text-sm font-semibold text-fg">
            Dimensions YouTube à respecter
          </p>
          {bannerDimensions.map((line) => (
            <p key={line} className="text-xs text-fg-muted">
              {line}
            </p>
          ))}
        </div>
      )}

      <Field label={label} htmlFor={`${idPrefix}-description`} hint={hint}>
        <Textarea
          id={`${idPrefix}-description`}
          value={value.description}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
          placeholder={placeholder}
          rows={4}
          maxLength={1000}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fg">{stylesLabel}</p>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((style) => (
            <Chip
              key={style}
              selected={value.styles.includes(style)}
              onSelect={(selected) => toggleStyle(style, selected)}
            >
              {style}
            </Chip>
          ))}
        </div>
      </div>

      {imagePrompts && imagePrompts.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg">
            {idPrefix === "avatar"
              ? "Vos 3 prompts d'avatar — collez-les dans Midjourney, Ideogram ou Leonardo :"
              : "Votre prompt de bannière :"}
          </p>
          {imagePrompts.map((item) => (
            <CopyBlock key={item.title} label={item.title} content={item.prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
