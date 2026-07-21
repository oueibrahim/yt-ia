import { Alert, Button, Card, Field, Input } from "@/components/ui";

type ActivationState = "default" | "error" | "success";

function parseState(value: string | undefined): ActivationState {
  if (value === "error" || value === "success") return value;
  return "default";
}

export default async function ActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const state = parseState((await searchParams).state);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="text-center">
          <p className="text-lg font-bold">
            Plate<span className="text-accent">forme</span>
          </p>
          <h1 className="mt-4 text-2xl font-bold">Activez votre licence</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Entrez la clé de licence reçue après votre achat pour accéder à
            votre espace.
          </p>
        </header>

        <Card className="flex flex-col gap-4">
          {state === "success" ? (
            <Alert variant="success" title="Licence activée">
              Votre accès est actif jusqu&apos;au 31 juillet 2026. Bienvenue !
            </Alert>
          ) : (
            <>
              <Field
                label="Clé de licence"
                htmlFor="license-key"
                error={
                  state === "error"
                    ? "Cette clé de licence est invalide ou déjà utilisée."
                    : undefined
                }
              >
                <Input
                  id="license-key"
                  placeholder="Ex. FIT-2026-XXXX-XXXX"
                  autoComplete="off"
                />
              </Field>
              <Button variant="cta" className="w-full">
                Activer ma licence
              </Button>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-fg-subtle">
          Où trouver ma clé ?{" "}
          <a href="#" className="text-accent hover:text-accent-hover">
            Elle vous a été envoyée après votre achat.
          </a>
        </p>
      </div>
    </main>
  );
}
