import { Field, Input } from "@/components/ui";

type StepChannelNameProps = {
  value: string;
  onChange: (value: string) => void;
};

export function StepChannelName({ value, onChange }: StepChannelNameProps) {
  return (
    <Field
      label="Nom de votre chaîne"
      htmlFor="channel-name"
      hint="Court et mémorisable — 2 à 3 mots maximum, facile à prononcer."
    >
      <Input
        id="channel-name"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex. FitMax Coaching"
        maxLength={50}
      />
    </Field>
  );
}
