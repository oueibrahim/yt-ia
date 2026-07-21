import { Chip, Field, Textarea } from "@/components/ui";
import type { ConfiguratorAnswers } from "@/lib/mock/types";

type VisualValue = ConfiguratorAnswers["avatar"];

type StepVisualProps = {
  idPrefix: "avatar" | "banner";
  label: string;
  hint: string;
  placeholder: string;
  stylesLabel: string;
  styleOptions: string[];
  value: VisualValue;
  onChange: (value: VisualValue) => void;
};

export function StepVisual({
  idPrefix,
  label,
  hint,
  placeholder,
  stylesLabel,
  styleOptions,
  value,
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
      <Field label={label} htmlFor={`${idPrefix}-description`} hint={hint}>
        <Textarea
          id={`${idPrefix}-description`}
          value={value.description}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
          placeholder={placeholder}
          rows={4}
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
    </div>
  );
}
