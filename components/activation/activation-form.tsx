"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { activateLicenseAction } from "@/app/activation/actions";

export function ActivationForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await activateLicenseAction(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // push() alone already fetches fresh RSC data for the destination
      // route; calling refresh() right after races with that navigation
      // and can leave the UI stuck mid-transition (the request still
      // completes server-side, which is why it showed up in the logs).
      router.push("/dashboard");
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Clé de licence"
          htmlFor="license-key"
          error={error ?? undefined}
        >
          <Input
            id="license-key"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ex. IBR-PRO-XKCD-92HF-LM7P"
            autoComplete="off"
            disabled={isPending}
          />
        </Field>
        <Button
          type="submit"
          variant="cta"
          className="w-full"
          loading={isPending}
          disabled={isPending || value.trim().length === 0}
        >
          Activer ma licence
        </Button>
      </form>
    </Card>
  );
}
