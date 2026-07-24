"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import { createCheckoutSessionAction } from "@/app/activation/actions";
import { FRANCOPHONE_AFRICAN_COUNTRIES } from "@/lib/chariow/francophone-african-countries";
import { CHARIOW_PLANS, type PlanId } from "@/lib/chariow/plans";

type PurchasePlansProps = {
  email: string;
  defaultFirstName: string;
  defaultLastName: string;
};

export function PurchasePlans({
  email,
  defaultFirstName,
  defaultLastName,
}: PurchasePlansProps) {
  const [openPlanId, setOpenPlanId] = useState<PlanId | null>(null);
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent, planId: PlanId) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        planId,
        firstName,
        lastName,
        countryCode,
        phoneNumber,
      });
      // On success, the server action redirects and never resolves here.
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-fg">Choisissez votre plan</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHARIOW_PLANS.map((plan) => (
          <Card key={plan.id} className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-fg">{plan.label}</p>
              <p className="text-xs text-fg-subtle">
                Accès pendant {plan.durationLabel}
              </p>
            </div>
            <Button
              variant={openPlanId === plan.id ? "secondary" : "primary"}
              size="sm"
              onClick={() => {
                setOpenPlanId(openPlanId === plan.id ? null : plan.id);
                setError(null);
              }}
            >
              {openPlanId === plan.id ? "Annuler" : "Acheter"}
            </Button>

            {openPlanId === plan.id && (
              <form
                onSubmit={(event) => handleSubmit(event, plan.id)}
                className="flex flex-col gap-3 border-t border-border pt-3"
              >
                {error && (
                  <Alert variant="danger" title="Erreur">
                    {error}
                  </Alert>
                )}
                <Field label="E-mail" htmlFor={`email-${plan.id}`}>
                  <Input id={`email-${plan.id}`} value={email} disabled />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Prénom" htmlFor={`first-${plan.id}`}>
                    <Input
                      id={`first-${plan.id}`}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isPending}
                    />
                  </Field>
                  <Field label="Nom" htmlFor={`last-${plan.id}`}>
                    <Input
                      id={`last-${plan.id}`}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isPending}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-[minmax(0,1.2fr)_1fr] gap-2">
                  <Field label="Pays" htmlFor={`cc-${plan.id}`}>
                    <Select
                      id={`cc-${plan.id}`}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={isPending}
                    >
                      <option value="">Sélectionnez…</option>
                      {FRANCOPHONE_AFRICAN_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Téléphone" htmlFor={`phone-${plan.id}`}>
                    <Input
                      id={`phone-${plan.id}`}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0700000000"
                      disabled={isPending}
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  variant="cta"
                  loading={isPending}
                  disabled={isPending}
                >
                  Payer {plan.label}
                </Button>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
