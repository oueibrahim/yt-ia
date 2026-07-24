import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Alert } from "@/components/ui";
import { ActivationForm } from "@/components/activation/activation-form";
import { PurchasePlans } from "@/components/activation/purchase-plans";
import { getActiveLicense } from "@/lib/db/licenses";
import { ensureStudent } from "@/lib/db/students";

export default async function ActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const student = await ensureStudent();
  if (!student) redirect("/sign-in");

  // Already has a valid license — skip straight to the app.
  const activeLicense = await getActiveLicense(student.id);
  if (activeLicense) redirect("/dashboard");

  const user = await currentUser();
  const checkoutSuccess = (await searchParams).checkout === "success";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="text-center">
          <p className="text-lg font-bold">
            Plate<span className="text-accent">forme</span>
          </p>
          <h1 className="mt-4 text-2xl font-bold">Activez votre licence</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Achetez un plan ou entrez la clé de licence reçue après votre
            achat pour accéder à votre espace.
          </p>
        </header>

        {checkoutSuccess && (
          <Alert variant="success" title="Paiement reçu">
            Votre clé de licence vous a été envoyée par e-mail. Collez-la
            ci-dessous pour activer votre compte.
          </Alert>
        )}

        {!checkoutSuccess && (
          <PurchasePlans
            email={student.email}
            defaultFirstName={user?.firstName ?? ""}
            defaultLastName={user?.lastName ?? ""}
          />
        )}

        <ActivationForm />

        <p className="text-center text-sm text-fg-subtle">
          Où trouver ma clé ? Elle vous a été envoyée par e-mail après votre
          achat.
        </p>
      </div>
    </main>
  );
}
